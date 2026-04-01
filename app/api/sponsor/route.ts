import { NextRequest, NextResponse } from 'next/server';
import { mapToIndustry, addToIndustryBucket, finalizeBuckets } from '@/lib/industryKeywords';

const FEC_KEY = process.env.FEC_API_KEY || '';
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

// Congress API returns names as "Last, First" — convert to "First Last" for FEC search
function normalizeName(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z\s,'-]/g, '').trim();
  if (clean.includes(',')) {
    const [last, first] = clean.split(',').map(s => s.trim());
    return `${first} ${last}`.trim();
  }
  return clean;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawName    = searchParams.get('name') || '';
  const state      = searchParams.get('state') || '';
  const chamber    = searchParams.get('chamber') || 'H'; // 'H' or 'S'

  if (!rawName || !state) {
    return NextResponse.json({ found: false });
  }

  const name = normalizeName(rawName);

  // ── 1. Find candidate in FEC by name + state + office ─────────────────────
  const candSearch = await fecGet('/candidates/', {
    q: name,
    state,
    office: chamber,
    election_year: 2024,
    sort: '-receipts',
    per_page: 5,
  });

  const candidates: any[] = candSearch?.results || [];
  if (!candidates.length) {
    // Try again without state filter — some members have unusual FEC records
    const wider = await fecGet('/candidates/', {
      q: name,
      office: chamber,
      election_year: 2024,
      sort: '-receipts',
      per_page: 5,
    });
    candidates.push(...(wider?.results || []));
  }

  if (!candidates.length) {
    return NextResponse.json({ found: false, name });
  }

  // Pick best match — prefer same state, highest receipts
  const cand = candidates.find((c: any) => c.state === state) || candidates[0];
  const candidateId: string = cand.candidate_id;
  const party: string = cand.party || '';

  // ── 2. Get candidate totals ───────────────────────────────────────────────
  const totalsResp = await fecGet('/candidates/totals/', {
    candidate_id: candidateId,
    cycle: 2024,
    per_page: 1,
  });
  const totals = totalsResp?.results?.[0] || {};
  const raised: number  = totals.receipts ?? cand.receipts ?? 0;
  const indivT: number  = totals.individual_contributions ?? 0;
  const pacT: number    = totals.other_political_committee_contributions ?? 0;

  // ── 3. Fetch top PAC contributors to build industry breakdown ─────────────
  const pacResp = await fecGet('/schedules/schedule_a/', {
    candidate_id: candidateId,
    two_year_transaction_period: 2024,
    contributor_type: 'committee',
    sort: '-contribution_receipt_amount',
    per_page: 20,
  });
  const pacDonors: any[] = pacResp?.results || [];

  // ── 4. Fetch top individual employer donations ─────────────────────────────
  const empResp = await fecGet('/schedules/schedule_a/by_employer/', {
    candidate_id: candidateId,
    cycle: 2024,
    sort: '-total',
    per_page: 15,
  });
  const employers: any[] = empResp?.results || [];

  // ── 5. Map to industries ──────────────────────────────────────────────────
  const buckets = new Map<string, any>();

  // PAC names → industry
  for (const p of pacDonors) {
    const orgName = p.contributor_name || '';
    const amt = p.contribution_receipt_amount || 0;
    if (amt <= 0) continue;

    const industry = mapToIndustry(orgName);
    if (industry) {
      addToIndustryBucket(buckets, industry.label, industry.emoji, industry.color, amt);
    } else {
      // Fallback: bucket by PAC type
      const commType = p.contributor_committee_type || '';
      if (commType === 'O' || commType === 'U') {
        addToIndustryBucket(buckets, 'Super PAC Money ⚡', '⚡', '#e74c3c', amt);
      } else if (commType === 'Y') {
        addToIndustryBucket(buckets, 'Party Committees', '🏛️', '#1a6bb5', amt);
      }
    }
  }

  // Employer names → industry
  for (const e of employers) {
    const empName = e.employer || '';
    const amt = e.total || 0;
    if (amt <= 0) continue;
    const industry = mapToIndustry(empName);
    if (industry) {
      addToIndustryBucket(buckets, industry.label, industry.emoji, industry.color, amt * 0.5);
    }
  }

  const industrySlices = finalizeBuckets(buckets, 1000, 6);

  return NextResponse.json({
    found: true,
    name: normalizeName(rawName),
    candidateId,
    party,
    raised,
    indivT,
    pacT,
    industrySlices,
  });
}
