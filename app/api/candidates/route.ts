import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const FEC_KEY = process.env.FEC_API_KEY || '';
const FEC_BASE = 'https://api.open.fec.gov/v1';

// Try 2026 first — if no candidates found, fall back to 2024
const PREFERRED_YEAR = 2026;
const FALLBACK_YEAR = 2024;

// ── FEC helpers ───────────────────────────────────────────────────────────────
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

// ── Census geocoder: ZIP → congressional district ─────────────────────────────
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
      const n = districts[0]?.DISTRICT;
      return n ? String(parseInt(n)) : null;
    }
    return null;
  } catch { return null; }
}

// ── Industry categorization ───────────────────────────────────────────────────
// Maps FEC industry codes to human-readable names with emoji
const INDUSTRY_MAP: Record<string, { label: string; emoji: string }> = {
  'K02': { label: 'Real Estate', emoji: '🏘️' },
  'K01': { label: 'Finance & Banking', emoji: '🏦' },
  'K03': { label: 'Insurance', emoji: '🛡️' },
  'K04': { label: 'Accountants', emoji: '📊' },
  'B11': { label: 'Oil & Gas', emoji: '🛢️' },
  'B12': { label: 'Mining', emoji: '⛏️' },
  'B13': { label: 'Electric Utilities', emoji: '⚡' },
  'B09': { label: 'Environmental', emoji: '🌿' },
  'C00': { label: 'Construction', emoji: '🏗️' },
  'D00': { label: 'Defense', emoji: '🛡️' },
  'E01': { label: 'Education', emoji: '🎓' },
  'F10': { label: 'Lawyers & Lobbyists', emoji: '⚖️' },
  'G00': { label: 'Government & Politics', emoji: '🏛️' },
  'H04': { label: 'Health Professionals', emoji: '🏥' },
  'H02': { label: 'Pharmaceuticals', emoji: '💊' },
  'H03': { label: 'Hospitals', emoji: '🏨' },
  'H06': { label: 'Health Services', emoji: '🩺' },
  'J01': { label: 'Agriculture', emoji: '🌾' },
  'K12': { label: 'Securities & Investment', emoji: '📈' },
  'K13': { label: 'Venture Capital', emoji: '💸' },
  'L00': { label: 'Labor Unions', emoji: '👷' },
  'M00': { label: 'Miscellaneous Business', emoji: '💼' },
  'N00': { label: 'Lawyers', emoji: '⚖️' },
  'P00': { label: 'Pro-Israel / AIPAC', emoji: '🌐' },
  'P01': { label: 'Pro-Israel Orgs', emoji: '🌐' },
  'Q00': { label: 'Ideological / Single Issue', emoji: '🎯' },
  'Q03': { label: 'Gun Rights', emoji: '🔫' },
  'Q04': { label: 'Gun Control', emoji: '🚫' },
  'Q05': { label: 'Abortion Policy', emoji: '⚕️' },
  'W00': { label: 'Technology', emoji: '💻' },
  'W02': { label: 'Telecom', emoji: '📡' },
  'X00': { label: 'Unknown / Uncoded', emoji: '❓' },
  'Z90': { label: 'Small Individual Donors', emoji: '👥' },
};

async function getIndustryBreakdown(committeeId: string, cycle: number) {
  try {
    const resp = await fecGet('/schedules/schedule_a/by_industry/', {
      committee_id: committeeId,
      cycle,
      sort: '-total',
      per_page: 10,
    });
    const results: any[] = resp.results || [];
    return results
      .filter((r: any) => r.total > 0 && r.industry_code)
      .slice(0, 8)
      .map((r: any) => {
        const mapped = INDUSTRY_MAP[r.industry_code] || { label: r.industry || 'Other', emoji: '💼' };
        return {
          code: r.industry_code,
          label: mapped.label,
          emoji: mapped.emoji,
          total: r.total || 0,
          count: r.count || 0,
        };
      });
  } catch { return []; }
}

// ── Enrich a single candidate ─────────────────────────────────────────────────
async function enrichCandidate(c: any, cycle: number) {
  try {
    const commResp = await fecGet(`/candidate/${c.candidate_id}/committees/`, {
      cycle, designation: 'P',
    }).catch(() => fecGet(`/candidate/${c.candidate_id}/committees/`, { cycle }));

    const cid = commResp?.results?.[0]?.committee_id;
    if (!cid) return { c, t: null, ind: [], employers: [], industries: [], pac: [], bundlers: [] };

    const period = String(cycle);

    const [tr, ir, industries] = await Promise.all([
      fecGet(`/committee/${cid}/totals/`, { cycle }).catch(() => null),
      fecGetMulti('/schedules/schedule_a/', {
        committee_id: cid,
        contributor_type: 'individual',
        sort: '-contribution_receipt_amount',
        per_page: '10',
        two_year_transaction_period: period,
      }).catch(() => ({ results: [] })),
      getIndustryBreakdown(cid, cycle),
    ]);

    const pacResp = await fecGetMulti('/schedules/schedule_a/', {
      committee_id: cid,
      contributor_type: 'committee',
      sort: '-contribution_receipt_amount',
      per_page: '12',
      two_year_transaction_period: period,
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
            two_year_transaction_period: period,
          }).catch(() => ({ results: [] }));
          pacDonors = (dr.results || []).slice(0, 4).map((d: any) => ({
            name: d.contributor_name || '',
            employer: d.contributor_employer || '',
            amount: d.contribution_receipt_amount || 0,
            isOrg: (d.entity_type || '') === 'ORG',
          })).filter((d: any) => d.name);
        }
        return { ...p, profile, pacDonors };
      })
    );

    const empResp = await fecGet('/schedules/schedule_a/by_employer/', {
      committee_id: cid, sort: '-total', per_page: 10, cycle,
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
      industries,
      pac: pacWithDetails.filter(Boolean),
      bundlers: actBlueWinRed,
    };
  } catch {
    return { c, t: null, ind: [], employers: [], industries: [], pac: [], bundlers: [] };
  }
}

// ── Fetch candidates for a given year ────────────────────────────────────────
async function fetchCandidatesForYear(state: string, district: string | null, year: number) {
  const houseParams: any = {
    state, office: 'H', election_year: year, sort: '-receipts', per_page: '8',
  };
  if (district) houseParams.district = district.padStart(2, '0');

  const senateParams: any = {
    state, office: 'S', election_year: year, sort: '-receipts', per_page: '6',
  };

  const [houseResp, senateResp] = await Promise.all([
    fecGetMulti('/candidates/', houseParams).catch(() => ({ results: [] })),
    fecGetMulti('/candidates/', senateParams).catch(() => ({ results: [] })),
  ]);

  const houseCands: any[] = (houseResp.results || []).slice(0, 6);
  const senateCands: any[] = (senateResp.results || []).slice(0, 4);
  return [...houseCands, ...senateCands];
}

// ── Cached data fetcher ───────────────────────────────────────────────────────
const getCandidateData = unstable_cache(
  async (state: string, district: string | null, zip: string) => {
    // Try 2026 first
    let allCands = await fetchCandidatesForYear(state, district, PREFERRED_YEAR);
    let electionYear = PREFERRED_YEAR;
    let usingFallback = false;

    // If no 2026 candidates found, fall back to 2024
    if (allCands.length === 0) {
      allCands = await fetchCandidatesForYear(state, district, FALLBACK_YEAR);
      electionYear = FALLBACK_YEAR;
      usingFallback = true;
    }

    if (!allCands.length) return { candidates: [], state, zip, district, electionYear, usingFallback };

    const details = await Promise.all(allCands.map(c => enrichCandidate(c, electionYear)));
    details.sort((a: any, b: any) => (b.t?.receipts ?? 0) - (a.t?.receipts ?? 0));

    return { candidates: details, state, zip, district, electionYear, usingFallback };
  },
  ['candidates-hybrid'],
  { revalidate: 86400 }
);

// ── Route handler ─────────────────────────────────────────────────────────────
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
