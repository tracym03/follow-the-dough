import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const LDA_BASE = 'https://lda.senate.gov/api/v1';

const getLobbyingData = unstable_cache(
  async (keywords: string) => {
    const url = new URL(`${LDA_BASE}/filings/`);
    url.searchParams.set('search', keywords);
    url.searchParams.set('filing_year', '2025');
    url.searchParams.set('page_size', '8');

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

    return { found: lobbyists.length > 0, keywords, lobbyists };
  },
  ['lobbying'],
  { revalidate: 86400 } // cache 24 hours
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get('keywords') || '';
  if (!keywords) return NextResponse.json({ found: false, lobbyists: [] });

  try {
    const data = await getLobbyingData(keywords.substring(0, 80));
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ found: false, keywords, lobbyists: [], error: e.message });
  }
}
