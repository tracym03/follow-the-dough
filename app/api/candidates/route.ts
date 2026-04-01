import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { mapToIndustry, addToIndustryBucket, finalizeBuckets, type IndustrySlice } from '@/lib/industryKeywords';

const FEC_KEY = process.env.FEC_API_KEY || '';
const FEC_BASE = 'https://api.open.fec.gov/v1';

// Show 2024 data by default — only upgrade to 2026 if candidates have raised real money
const PRIMARY_YEAR = 2024;
const CURRENT_YEAR = 2026;
const UPGRADE_THRESHOLD = 10000; // $10k raised = 2026 cycle is live

// ── FEC helpers ───────────────────────────────────────────────────────────────
async function fecGet(path: string, params: Record<string, string | number | boolean> = {}) {
  const url = new URL(FEC_BASE + path);
  url.searchParams.set('api_key', FEC_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FEC ${r.status}: ${url.pathname}`);
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
  if (!r.ok) throw new Error(`FEC ${r.status}: ${url.pathname}`);
  return r.json();
}

// ── ZIP → congressional district via FEC's own elections/search endpoint ──────
// The FEC knows exactly which district every ZIP belongs to — no Census needed.
async function getDistrictFromZip(zip: string): Promise<string | null> {
  try {
    const url = new URL(FEC_BASE + '/elections/search/');
    url.searchParams.set('api_key', FEC_KEY);
    url.searchParams.set('zip', zip);
    url.searchParams.set('cycle', String(PRIMARY_YEAR));
    const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    const data = await r.json();
    const houseRace = (data.results || []).find((e: any) => e.office === 'H');
    if (!houseRace?.district) return null;
    return String(parseInt(houseRace.district)); // e.g. "47" not "047"
  } catch { return null; }
}


// Build industry + PAC-type pizza from employer names and PAC profiles
// This gives voters the "Big Pharma / Defense / Wall Street" breakdown they care about
function buildPacIndustrySlices(pac: any[], employers: any[]): IndustrySlice[] {
  const buckets = new Map<string, IndustrySlice>();

  // ── From PAC data ────────────────────────────────────────────────────────────
  for (const p of pac) {
    const amt = p.contribution_receipt_amount || 0;
    if (amt <= 0) continue;
    const profile = p.profile;
    const comm = profile?.committee_type || '';
    const desig = profile?.designation || '';
    const org = profile?.organization_type || '';
    const connOrg = profile?.connected_organization_name || '';
    const pacName = p.contributor_name || '';

    // Try to identify the real-world industry from the connected org name
    const industryFromOrg = connOrg ? mapToIndustry(connOrg) : (mapToIndustry(pacName) ?? null);

    if (comm === 'O' || desig === 'U') {
      // Super PAC — try to industry-map it, otherwise bucket as Super PAC
      if (industryFromOrg) {
        addToIndustryBucket(buckets, industryFromOrg.label, industryFromOrg.emoji, industryFromOrg.color, amt);
      } else {
        addToIndustryBucket(buckets, 'Super PAC Money', '⚡', '#c0392b', amt);
      }
    } else if (industryFromOrg) {
      addToIndustryBucket(buckets, industryFromOrg.label, industryFromOrg.emoji, industryFromOrg.color, amt);
    } else if (org === 'L' || comm === 'W') {
      addToIndustryBucket(buckets, 'Labor & Unions', '👷', '#2d6a4f', amt);
    } else if (comm === 'Y') {
      addToIndustryBucket(buckets, 'Party Committees', '🏛', '#1a6bb5', amt);
    } else if (desig === 'L') {
      addToIndustryBucket(buckets, 'Leadership PACs', '⭐', '#c8934a', amt);
    } else {
      addToIndustryBucket(buckets, 'Other PAC Money', '💼', '#854d0e', amt);
    }
  }

  // ── From employer data (individual donations by employer) ────────────────────
  for (const emp of employers) {
    const total = emp.total || 0;
    if (total <= 0) continue;
    const industry = mapToIndustry(emp.employer || '');
    if (industry) {
      addToIndustryBucket(buckets, industry.label, industry.emoji, industry.color, total);
    }
  }

  return finalizeBuckets(buckets);
}

// ── Enrich a single candidate with donors, PACs, industries ──────────────────
// `cand` is a row from /candidates/totals/ — already has financial summary fields
async function enrichCandidate(cand: any, cycle: number) {
  try {
    // cand already has receipts/disbursements from /candidates/totals/
    // We just need the committee ID to fetch itemized donors + industry breakdown
    const commResp = await fecGet(`/candidate/${cand.candidate_id}/committees/`, {
      cycle, designation: 'P',
    }).catch(() => fecGet(`/candidate/${cand.candidate_id}/committees/`, { cycle }));

    const cid = commResp?.results?.[0]?.committee_id;

    // Build a totals object from the candidate record itself (no extra API call needed)
    const t = {
      receipts: cand.receipts ?? 0,
      disbursements: cand.disbursements ?? 0,
      individual_contributions: cand.individual_itemized_contributions ?? 0,
      other_political_committee_contributions: cand.other_political_committee_contributions ?? 0,
    };

    if (!cid) return { c: cand, t, ind: [], employers: [], industries: [], pac: [], bundlers: [] };

    const period = String(cycle);

    const [ir] = await Promise.all([
      fecGetMulti('/schedules/schedule_a/', {
        committee_id: cid,
        contributor_type: 'individual',
        sort: '-contribution_receipt_amount',
        per_page: '10',
        two_year_transaction_period: period,
      }).catch(() => ({ results: [] })),
    ]);

    const pacResp = await fecGetMulti('/schedules/schedule_a/', {
      committee_id: cid,
      contributor_type: 'committee',
      sort: '-contribution_receipt_amount',
      per_page: '12',
      two_year_transaction_period: period,
    }).catch(() => ({ results: [] }));

    const pacRows: any[] = pacResp.results || [];
    const candLast = (cand.name || '').split(',')[0].toLowerCase().replace(/[^a-z]/g, '');
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

    // Build pizza AFTER we have both pac and employer data
    const pacIndustrySlices = buildPacIndustrySlices(pacWithDetails.filter(Boolean), empRows);

    return {
      c: cand,
      t,
      ind: ir?.results || [],
      employers: empRows,
      pacIndustrySlices,
      pac: pacWithDetails.filter(Boolean),
      bundlers: actBlueWinRed,
    };
  } catch {
    return { c: cand, t: null, ind: [], employers: [], pacIndustrySlices: [], pac: [], bundlers: [] };
  }
}

// ── Fetch candidates using /candidates/totals/ (supports sort by receipts) ───
async function fetchCandidatesForYear(state: string, district: string | null, year: number) {
  // House — district-specific first, then statewide fallback
  const houseBase = { state, office: 'H', election_year: year, sort: '-receipts', per_page: '8', is_election: 'true' };

  const houseWithDistrict = district
    ? fecGetMulti('/candidates/totals/', { ...houseBase, district: district.padStart(2, '0') }).catch(() => ({ results: [] }))
    : Promise.resolve({ results: [] });

  const houseStatewide = fecGetMulti('/candidates/totals/', houseBase).catch(() => ({ results: [] }));

  const senateResp = fecGetMulti('/candidates/totals/', {
    state, office: 'S', election_year: year, sort: '-receipts', per_page: '6', is_election: 'true',
  }).catch(() => ({ results: [] }));

  const [houseDistrictResp, houseAllResp, senateData] = await Promise.all([
    houseWithDistrict, houseStatewide, senateResp,
  ]);

  const districtResults: any[] = houseDistrictResp.results || [];
  const stateResults: any[] = houseAllResp.results || [];

  // Prefer district results; fall back to top statewide
  const houseCands: any[] = districtResults.length > 0
    ? districtResults.slice(0, 6)
    : stateResults.slice(0, 4);

  const senateCands: any[] = (senateData.results || []).slice(0, 4);
  return [...houseCands, ...senateCands];
}

// ── Cached data fetcher ───────────────────────────────────────────────────────
const getCandidateData = unstable_cache(
  async (state: string, district: string | null, zip: string) => {
    // Fetch both years in parallel — no extra API calls needed
    // /candidates/totals/ already includes receipts so we can check 2026 for free
    const [primaryCands, currentCands] = await Promise.all([
      fetchCandidatesForYear(state, district, PRIMARY_YEAR),
      fetchCandidatesForYear(state, district, CURRENT_YEAR),
    ]);

    // Check if 2026 has real fundraising (receipts field comes free from /candidates/totals/)
    const maxIn2026 = Math.max(...currentCands.map((c: any) => c.receipts ?? 0), 0);
    const use2026 = maxIn2026 >= UPGRADE_THRESHOLD;

    const allCands = use2026 ? currentCands : primaryCands;
    const electionYear = use2026 ? CURRENT_YEAR : PRIMARY_YEAR;
    const usingFallback = !use2026;

    if (!allCands.length) return { candidates: [], state, zip, district, electionYear, usingFallback };

    const details = await Promise.all(allCands.map((c: any) => enrichCandidate(c, electionYear)));
    // Already sorted by receipts from the API, but re-sort after enrichment
    details.sort((a: any, b: any) => (b.t?.receipts ?? 0) - (a.t?.receipts ?? 0));

    return { candidates: details, state, zip, district, electionYear, usingFallback };
  },
  [`candidates-v4-${new Date().toISOString().slice(0, 10)}`],
  { revalidate: 3600 }
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
