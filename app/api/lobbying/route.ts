import { NextRequest, NextResponse } from 'next/server';

const LDA_BASE = 'https://lda.senate.gov/api/v1';

const ISSUE_CODE_MAP: Record<string, { label: string; emoji: string; color: string }> = {
  HEA: { label: 'Healthcare', emoji: '🏥', color: '#27ae60' },
  PHR: { label: 'Pharma & Drugs', emoji: '💊', color: '#e74c3c' },
  DEF: { label: 'Defense & Military', emoji: '🛡️', color: '#2c3e50' },
  BUD: { label: 'Budget & Spending', emoji: '💰', color: '#c8934a' },
  TAX: { label: 'Taxation', emoji: '🏦', color: '#3498db' },
  ENV: { label: 'Environment', emoji: '🌿', color: '#16a085' },
  ENG: { label: 'Energy', emoji: '⚡', color: '#f39c12' },
  TRA: { label: 'Transportation', emoji: '🚗', color: '#8e44ad' },
  FIN: { label: 'Finance & Banking', emoji: '🏦', color: '#2980b9' },
  HOU: { label: 'Housing', emoji: '🏘️', color: '#e67e22' },
  IMM: { label: 'Immigration', emoji: '🌎', color: '#1abc9c' },
  LBR: { label: 'Labor & Workforce', emoji: '👷', color: '#2d6a4f' },
  EDU: { label: 'Education', emoji: '🎓', color: '#9b59b6' },
  AGR: { label: 'Agriculture', emoji: '🌾', color: '#8d6e63' },
  TEC: { label: 'Technology', emoji: '💻', color: '#5b21b6' },
  MAN: { label: 'Manufacturing', emoji: '🏭', color: '#607d8b' },
  SMB: { label: 'Small Business', emoji: '🏪', color: '#f39c12' },
  TOR: { label: 'Tort & Legal', emoji: '⚖️', color: '#d35400' },
  GOV: { label: 'Government Reform', emoji: '🏛️', color: '#1a6bb5' },
  FOR: { label: 'Foreign Policy', emoji: '🌐', color: '#16a085' },
  DIS: { label: 'Disaster Relief', emoji: '🆘', color: '#c0392b' },
  AVI: { label: 'Aviation', emoji: '✈️', color: '#2980b9' },
  AER: { label: 'Aerospace', emoji: '🚀', color: '#34495e' },
  WAS: { label: 'Waste & Recycling', emoji: '♻️', color: '#27ae60' },
  INT: { label: 'Intelligence', emoji: '🔍', color: '#2c3e50' },
  TRD: { label: 'Trade', emoji: '📦', color: '#e67e22' },
  URB: { label: 'Urban Development', emoji: '🏙️', color: '#8e44ad' },
  VET: { label: 'Veterans', emoji: '🎖️', color: '#c8934a' },
};

// Use Next.js fetch cache — unique URL = unique cache entry, no shared state
async function ldaFetch(params: Record<string, string>): Promise<any[]> {
  const url = new URL(`${LDA_BASE}/filings/`);
  url.searchParams.set('filing_year', '2025');
  url.searchParams.set('page_size', '25');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  try {
    const r = await fetch(url.toString(), {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // cache 24hrs per unique URL
    });
    if (!r.ok) return [];
    const data = await r.json();
    return data.results || [];
  } catch {
    return [];
  }
}

function buildResult(filings: any[], searchedByBill: boolean, billId: string, keywords: string) {
  // ── Dough chart: count lobbying activities per issue code ─────────────────
  const issueCounts = new Map<string, number>();
  for (const f of filings) {
    for (const act of (f.lobbying_activities || [])) {
      const code = act.general_issue_code as string;
      if (code) issueCounts.set(code, (issueCounts.get(code) || 0) + 1);
    }
  }

  const industrySlices = [...issueCounts.entries()]
    .map(([code, count]) => {
      const m = ISSUE_CODE_MAP[code] || { label: code, emoji: '💼', color: '#854d0e' };
      return { ...m, value: count };
    })
    .sort((a, b) => b.value - a.value)
    .slice(0, 7);

  // ── Lobbyist list: deduplicated by client name ────────────────────────────
  const seenClients = new Set<string>();
  const lobbyists = filings
    .filter(f => {
      const key = (f.client?.name || '').trim().toUpperCase();
      if (!key || seenClients.has(key)) return false;
      seenClients.add(key);
      return true;
    })
    .slice(0, 8)
    .map((f: any) => {
      const codes = (f.lobbying_activities || [])
        .map((a: any) => ISSUE_CODE_MAP[a.general_issue_code]?.label || '')
        .filter(Boolean);
      const topics = [...new Set(codes)].slice(0, 3).join(', ');
      return {
        client: f.client?.name || 'Unknown',
        registrant: f.registrant?.name || '',
        topics,
        period: f.filing_period_display || String(f.filing_year || ''),
      };
    });

  return { found: lobbyists.length > 0, searchedByBill, billId, keywords, lobbyists, industrySlices };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = (searchParams.get('keywords') || '').substring(0, 80).trim();
  const billId   = (searchParams.get('billId')   || '').trim(); // e.g. "HR 1234"

  if (!keywords && !billId) {
    return NextResponse.json({ found: false, lobbyists: [], industrySlices: [] });
  }

  // 1️⃣ Try bill-number search first — searches lobbyist filings that mention
  //    this specific bill number in their "specific issues" description text
  if (billId) {
    const variants = [
      billId,
      billId.replace(/^HR /, 'H.R. '),
      billId.replace(/^S /, 'S. '),
      billId.replace(' ', ''),
    ];

    for (const variant of variants) {
      const filings = await ldaFetch({ filing_specific_lobbying_issues: variant });
      if (filings.length >= 2) {
        return NextResponse.json(buildResult(filings, true, billId, keywords));
      }
    }
  }

  // 2️⃣ Fall back to keyword topic search
  if (keywords) {
    const filings = await ldaFetch({ search: keywords });
    return NextResponse.json(buildResult(filings, false, billId, keywords));
  }

  return NextResponse.json({ found: false, lobbyists: [], industrySlices: [] });
}
