import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const FEC_KEY = process.env.FEC_API_KEY || '';
const FEC_BASE = 'https://api.open.fec.gov/v1';

// Which election cycle to show — update this each cycle year
const ELECTION_YEAR = 2026;
const TRANSACTION_PERIOD = '2026';

// ── FEC helpers ──────────────────────────────────────────────────────────────
async function fecGet(path: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(FEC_BASE + path);
  url.searchParams.set('api_key', FEC_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FEC ${r.status}`);
  return r.json();
}

async function fecGetMulti(path: string, params: Record<string, string | number | boolean | string[]> = {}) {
  const url = new URL(FEC_BASE + path);
  url.searchParams.set('api_key', FEC_KEY);
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x));
    else url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FEC ${r.status}`);
  return r.json();
}

// ── Census geocoder: ZIP → congressional district ────────────────────────────
async function getDistrictFromZip(zip: string): Promise<string | null> {
  try {
    const url = new URL('https://geocoding.geo.census.gov/geocoder/geographies/address');
    url.searchParams.set('zip', zip);
    url.searchParams.set('street', '');
    url.searchParams.set('benchmark', 'Public_AR_Current');
    url.searchParams.set('vintage', 'Current_Votings');
    url.searchParams.set('layers', '54');
    url.searchParams.set('format', 'json');
    const r = await fetch(url.toString());
    if (!r.ok) return null;
    const data = await r.json();
    const geographies = data?.result?.geographies;
    const districts =
      geographies?.['119th Congressional Districts'] ||
      geographies?.['118th Congressional Districts'] ||
      geographies?.['Congressional Districts'];
    if (districts?.length) {
      const districtNum = districts[0]?.DISTRICT;
      return districtNum ? String(parseInt(districtNum)) : null;
    }
    return null;
  } catch {
    return null;
  }
}

// ── Enrich a single candidate with donor details ─────────────────────────────
async function enrichCandidate(c: any) {
  try {
    // Try 2026 committee first, fall back to any recent
    const commResp = await fecGet(`/candidate/${c.candidate_id}/committees/`, {
      cycle: ELECTION_YEAR,
      designation: 'P',
    }).catch(() => fecGet(`/candidate/${c.candidate_id}/committees/`, { cycle: ELECTION_YEAR }));

    const cid = commResp?.results?.[0]?.committee_id;
    if (!cid) return { c, t: null, ind: [], employers: [], pac: [], bundlers: [] };

    const [tr, ir] = await Promise.all([
      fecGet(`/committee/${cid}/totals/`, { cycle: ELECTION_YEAR }).catch(() => null),
      fecGetMulti('/schedules/schedule_a/', {
        committee_id: cid,
        contributor_type: 'individual',
        sort: '-contribution_receipt_amount',
        per_page: '10',
        two_year_transaction_period: TRANSACTION_PERIOD,
      }).catch(() => ({ results: [] })),
    ]);

    const pacResp = await fecGetMulti('/schedules/schedule_a/', {
      committee_id: cid,
      contributor_type: 'committee',
      sort: '-contribution_receipt_amount',
      per_page: '12',
      two_year_transaction_period: TRANSACTION_PERIOD,
    }).catch(() => ({ results: [] }));

    const pacRows: any[] = pacResp.results || [];
    const candLast = (c.name || '').split(',')[0].toLowerCase().replace(/[^a-z]/g, '');
    const actBlueWinRed: any[] = [];
    const externalPacs = pacRows.filter((p: any) => {
      const n = (p.contributor_name || '').toLowerCase();
      if (n.includes('actblue') || n.includes('winred')) { actBlueWinRed.push(p); return false; }
      if (candLast.length > 3 && n.replace(/[^a-z]/g, '').includes(candLast)) return false;
      return true;
    });

    const pacWithDetails = await Promise.all(
      externalPacs.slice(0, 6).map(async (p: any) => {
        const pacId = p.contributor_committee_id || '';
        if (!pacId) return { ...p, profile: null, pacDonors: [] };
        const profileResp = await fecGet(`/committee/${pacId}/`, {}).catch(() => null);
        const profile = profileResp?.result || null;
        let pacDonors: any[] = [];
        if (!profile?.connected_organization_name) {
          const dr = await fecGetMulti('/schedules/schedule_a/', {
            committee_id: pacId,
            sort: '-contribution_receipt_amount',
            per_page: '5',
            two_year_transaction_period: TRANSACTION_PERIOD,
          }).catch(() => ({ results: [] }));
          pacDonors = (dr.results || []).slice(0, 4).map((d: any) => ({
            name: d.contributor_name || '',
            employer: d.contributor_employer || '',
            city: d.contributor_city || '',
            state: d.contributor_state || '',
            amount: d.contribution_receipt_amount || 0,
            isOrg: (d.entity_type || '') === 'ORG',
          })).filter((d: any) => d.name);
        }
        return { ...p, profile, pacDonors };
      })
    );

    const empResp = await fecGet('/schedules/schedule_a/by_employer/', {
      committee_id: cid, sort: '-total', per_page: 10, cycle: ELECTION_YEAR,
    }).catch(() => ({ results: [] }));

    const empRows = ((empResp.results || []) as any[]).filter((e: any) => {
      const emp = (e.employer || '').toLowerCase().trim();
      return emp && emp.length > 2 &&
        emp !== 'null' && emp !== 'n/a' && emp !== 'na' &&
        emp !== 'none' && emp !== 'unknown' && emp !== 'various' &&
        !emp.includes('retired') && !emp.includes('self-employed') &&
        !emp.includes('self employed') && !emp.includes('homemaker') &&
        !emp.includes('not employed') && !emp.includes('unemployed') &&
        !emp.includes('disabled') && !emp.includes('student');
    }).slice(0, 8);

    return {
      c,
      t: tr?.results?.[0] || null,
      ind: ir?.results || [],
      employers: empRows,
      pac: pacWithDetails.filter(Boolean),
      bundlers: actBlueWinRed,
    };
  } catch {
    return { c, t: null, ind: [], employers: [], pac: [], bundlers: [] };
  }
}

// ── Cached FEC data fetcher ───────────────────────────────────────────────────
const getCandidateData = unstable_cache(
  async (state: string, district: string | null, zip: string) => {
    const houseParams: any = {
      state,
      office: 'H',
      election_year: ELECTION_YEAR,
      sort: '-receipts',
      per_page: '6',
      has_raised_funds: 'true',
    };
    if (district) houseParams.district = district.padStart(2, '0');

    const senateParams: any = {
      state,
      office: 'S',
      election_year: ELECTION_YEAR,
      sort: '-receipts',
      per_page: '4',
      has_raised_funds: 'true',
    };

    const [houseResp, senateResp] = await Promise.all([
      fecGetMulti('/candidates/', houseParams).catch(() => ({ results: [] })),
      fecGetMulti('/candidates/', senateParams).catch(() => ({ results: [] })),
    ]);

    const houseCands: any[] = (houseResp.results || []).slice(0, 4);
    const senateCands: any[] = (senateResp.results || []).slice(0, 2);
    const allCands = [...houseCands, ...senateCands];

    if (!allCands.length) return { candidates: [], state, zip, district, electionYear: ELECTION_YEAR };

    const details = await Promise.all(allCands.map(enrichCandidate));
    details.sort((a: any, b: any) => (b.t?.receipts ?? 0) - (a.t?.receipts ?? 0));

    return { candidates: details, state, zip, district, electionYear: ELECTION_YEAR };
  },
  ['candidates-2026'],
  { revalidate: 86400 }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');
  const zip = searchParams.get('zip') || '';
  if (!state) return NextResponse.json({ error: 'state required' }, { status: 400 });

  try {
    const district = await getDistrictFromZip(zip);
    const data = await getCandidateData(state, district, zip);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
