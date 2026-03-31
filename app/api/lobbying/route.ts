import { NextRequest, NextResponse } from 'next/server';

const LDA_BASE = 'https://lda.senate.gov/api/v1';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = searchParams.get('keywords') || '';

  if (!keywords) return NextResponse.json({ results: [] });

  try {
    // Search LDA filings by keyword — completely free, no key needed
    const url = new URL(`${LDA_BASE}/filings/`);
    url.searchParams.set('search', keywords);
    url.searchParams.set('filing_year', '2025');
    url.searchParams.set('page_size', '8');

    const r = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 3600 },
    });

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
      url: f.url || '',
    }));

    return NextResponse.json({ found: lobbyists.length > 0, keywords, lobbyists });
  } catch (e: any) {
    return NextResponse.json({ found: false, keywords, lobbyists: [], error: e.message });
  }
}
