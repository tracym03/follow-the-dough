import { NextRequest, NextResponse } from 'next/server';
import { mapToIndustry, addToIndustryBucket, finalizeBuckets } from '@/lib/industryKeywords';

const FEC_KEY  = process.env.FEC_API_KEY || '';
const FEC_BASE = 'https://api.open.fec.gov/v1';

async function fecGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(FEC_BASE + path);
  url.searchParams.set('api_key', FEC_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 86400 },
  });
  if (!r.ok) return null;
  return r.json();
}

// Congress API returns "Last, First M." — convert to "First Last" for FEC search.
// Strip middle initials (single letter after first name) — they cause FEC misses.
function normalizeName(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z\s,'-]/g, '').trim();
  if (clean.includes(',')) {
    const [last, first] = clean.split(',').map(s => s.trim());
    // Drop trailing middle initial e.g. "Marlin A" → "Marlin"
    const firstName = first.replace(/\s+[A-Z]$/i, '').trim();
    return `${firstName} ${last}`.trim();
  }
  return clean;
}

// Search FEC for a candidate, trying multiple election cycles.
// Senators run every 6 years — many won't appear in 2024.
async function findCandidate(name: string, state: string, chamber: string) {
  const cycles = chamber === 'S' ? [2024, 2022, 2020, 2018] : [2024, 2022];

  for (const year of cycles) {
    // Try with state filter first
    const withState = await fecGet('/candidates/', {
      q: name, state, office: chamber,
      election_year: year, sort: '-receipts', per_page: 5,
    });
    const stateResults: any[] = withState?.results ?? [];
    if (stateResults.length) {
      return stateResults.find((c: any) => c.state === state) ?? stateResults[0];
    }

    // Fallback: no state filter (catches edge cases)
    const noState = await fecGet('/candidates/', {
      q: name, office: chamber,
      election_year: year, sort: '-receipts', per_page: 5,
    });
    const noStateResults: any[] = noState?.results ?? [];
    if (noStateResults.length) {
      return noStateResults.find((c: any) => c.state === state) ?? noStateResults[0];
    }
  }
  return null;
}

// Get the candidate's principal campaign committee ID.
// Schedule A receipts must be queried by committee_id, not candidate_id.
async function getPrincipalCommittee(candidateId: string): Promise<string | null> {
  const resp = await fecGet(`/candidate/${candidateId}/committees/`, { per_page: 10 });
  const committees: any[] = resp?.results ?? [];
  // Designation 'P' = Principal Campaign Committee
  const principal = committees.find((c: any) => c.designation === 'P') ?? committees[0];
  return principal?.committee_id ?? null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawName = searchParams.get('name') || '';
  const state   = searchParams.get('state') || '';
  const chamber = searchParams.get('chamber') || 'H';

  if (!rawName || !state) return NextResponse.json({ found: false });

  const name = normalizeName(rawName);

  // ── 1. Find the candidate ─────────────────────────────────────────────────
  const cand = await findCandidate(name, state, chamber);
  if (!cand) return NextResponse.json({ found: false, name });

  const candidateId: string = cand.candidate_id;
  const party: string       = cand.party ?? '';

  // ── 2. Candidate fundraising totals ──────────────────────────────────────
  // Try 2024 first; fall back to the most recent cycle in the candidate record
  const latestCycle = cand.election_years?.slice(-1)[0] ?? 2024;
  const tryTotalsCycle = latestCycle >= 2020 ? latestCycle : 2024;

  const totalsResp = await fecGet('/candidates/totals/', {
    candidate_id: candidateId,
    cycle: tryTotalsCycle,
    per_page: 1,
  });
  const totals  = totalsResp?.results?.[0] ?? {};
  const raised  = totals.receipts ?? cand.receipts ?? 0;
  const indivT  = totals.individual_contributions ?? 0;
  const pacT    = totals.other_political_committee_contributions ?? 0;

  // ── 3. Get principal campaign committee → use for PAC schedule A ──────────
  const committeeId = await getPrincipalCommittee(candidateId);

  let pacDonors: any[] = [];
  if (committeeId) {
    // Use committee_id (reliable) rather than candidate_id (unreliable on schedule_a)
    const pacResp = await fecGet('/schedules/schedule_a/', {
      committee_id: committeeId,
      two_year_transaction_period: tryTotalsCycle,
      contributor_type: 'committee',
      sort: '-contribution_receipt_amount',
      per_page: 30,
    });
    pacDonors = pacResp?.results ?? [];

    // If still empty, try without period filter
    if (!pacDonors.length) {
      const pacResp2 = await fecGet('/schedules/schedule_a/', {
        committee_id: committeeId,
        contributor_type: 'committee',
        sort: '-contribution_receipt_amount',
        per_page: 30,
      });
      pacDonors = pacResp2?.results ?? [];
    }
  }

  // ── 4. Top employer donations (individual contributors) ───────────────────
  const empResp = await fecGet('/schedules/schedule_a/by_employer/', {
    candidate_id: candidateId,
    cycle: tryTotalsCycle,
    sort: '-total',
    per_page: 20,
  });
  const employers: any[] = empResp?.results ?? [];

  // ── 5. Map PAC names + employer names to industries ───────────────────────
  const buckets = new Map<string, any>();

  for (const p of pacDonors) {
    const orgName = p.contributor_name ?? '';
    const amt     = p.contribution_receipt_amount ?? 0;
    if (amt <= 0) continue;

    const industry = mapToIndustry(orgName);
    if (industry) {
      addToIndustryBucket(buckets, industry.label, industry.emoji, industry.color, amt);
    } else {
      // Fall back to committee type classification
      const commType = p.contributor_committee_type ?? '';
      const desig    = p.contributor_committee_designation ?? '';
      if (commType === 'O' || desig === 'U') {
        addToIndustryBucket(buckets, 'Super PAC Money', '⚡', '#e74c3c', amt);
      } else if (commType === 'Y') {
        addToIndustryBucket(buckets, 'Party Committees', '🏛️', '#1a6bb5', amt);
      } else if (commType === 'W' || orgName.match(/union|afl|seiu|teamster|worker/i)) {
        addToIndustryBucket(buckets, 'Labor & Unions', '👷', '#2d6a4f', amt);
      } else if (desig === 'L') {
        addToIndustryBucket(buckets, 'Leadership PACs', '⭐', '#854d0e', amt);
      } else if (commType === 'Q' || commType === 'N') {
        addToIndustryBucket(buckets, 'Corporate & Trade PACs', '🏢', '#607d8b', amt);
      }
    }
  }

  for (const e of employers) {
    const empName = e.employer ?? '';
    const amt     = e.total ?? 0;
    if (amt <= 0) continue;
    const industry = mapToIndustry(empName);
    if (industry) {
      addToIndustryBucket(buckets, industry.label, industry.emoji, industry.color, amt * 0.5);
    }
  }

  // Lower threshold to $250 so smaller members still show data
  const industrySlices = finalizeBuckets(buckets, 250, 6);

  return NextResponse.json({
    found: true,
    name:  normalizeName(rawName),
    candidateId,
    committeeId,
    party,
    raised,
    indivT,
    pacT,
    industrySlices,
    debug: { cycle: tryTotalsCycle, pacDonorCount: pacDonors.length, employerCount: employers.length },
  });
}
