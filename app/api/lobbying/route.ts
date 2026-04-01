import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { mapToIndustry, addToIndustryBucket, finalizeBuckets } from '@/lib/industryKeywords';

const LDA_BASE = 'https://lda.senate.gov/api/v1';

const getLobbyingData = unstable_cache(
  async (keywords: string) => {
    const url = new URL(`${LDA_BASE}/filings/`);
    url.searchParams.set('search', keywords);
    url.searchParams.set('filing_year', '2025');
    url.searchParams.set('page_size', '20'); // fetch more to get better industry coverage

    const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`LDA ${r.status}`);
    const data = await r.json();
    const filings: any[] = data.results || [];

    const lobbyists = filings.slice(0, 6).map((f: any) => ({
      registrant: f.registrant?.name || 'Unknown Firm',
      client: f.client?.name || '',
      amount: f.income || f.expenses || null,
      issues: (f.lobbying_activities || [])
        .slice(0, 2)
        .map((a: any) => a.general_issue_code_display || a.description || '')
        .filter(Boolean)
        .join('; '),
      period: f.period_display || '',
    }));

    // Build industry pizza from ALL fetched filings (not just top 6)
    const buckets = new Map<string, any>();
    for (const f of filings) {
      const clientName = f.client?.name || '';
      const registrantName = f.registrant?.name || '';
      const amount = (f.income || f.expenses || 0) as number;

      // Try client name first, then registrant
      const industry = mapToIndustry(clientName) || mapToIndustry(registrantName);
      if (industry && amount > 0) {
        addToIndustryBucket(buckets, industry.label, industry.emoji, industry.color, amount);
      } else if (amount > 0) {
        // Count unidentified filings as "Other Interest Groups"
        addToIndustryBucket(buckets, 'Other Interest Groups', '💼', '#854d0e', amount);
      }
    }
    const industrySlices = finalizeBuckets(buckets, 0, 7);

    return { found: lobbyists.length > 0, keywords, lobbyists, industrySlices };
  },
  ['lobbying-v2'],
  { revalidate: 86400 }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get('keywords') || '';
  if (!keywords) return NextResponse.json({ found: false, lobbyists: [], industrySlices: [] });

  try {
    const data = await getLobbyingData(keywords.substring(0, 80));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ found: false, keywords, lobbyists: [], industrySlices: [], error: e.message });
  }
}
