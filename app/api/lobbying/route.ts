import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const LDA_BASE = 'https://lda.senate.gov/api/v1';

// Official LDA issue codes → plain English categories for voters
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

const getLobbyingData = unstable_cache(
  async (keywords: string) => {
    const url = new URL(`${LDA_BASE}/filings/`);
    url.searchParams.set('search', keywords);
    url.searchParams.set('filing_year', '2025');
    url.searchParams.set('page_size', '20');

    const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(`LDA ${r.status}`);
    const data = await r.json();
    const filings: any[] = data.results || [];

    // ── Build issue-code dough chart ─────────────────────────────────────────
    // Count lobbying activities per issue area — income is rarely filed,
    // so we use activity count as a proxy for lobbying intensity
    const issueCounts = new Map<string, number>();
    for (const f of filings) {
      for (const activity of (f.lobbying_activities || [])) {
        const code = activity.general_issue_code as string;
        if (code) issueCounts.set(code, (issueCounts.get(code) || 0) + 1);
      }
    }

    const industrySlices = [...issueCounts.entries()]
      .map(([code, count]) => {
        const mapped = ISSUE_CODE_MAP[code] || { label: code, emoji: '💼', color: '#854d0e' };
        return { ...mapped, value: count };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 7);

    // ── Simplified client list ────────────────────────────────────────────────
    // Show CLIENT (who paid for lobbying) + what topics they lobbied on
    // Deduplicate by client name so the same company doesn't appear 5 times
    const seenClients = new Set<string>();
    const lobbyists = filings
      .filter(f => {
        const client = f.client?.name || '';
        if (seenClients.has(client)) return false;
        seenClients.add(client);
        return true;
      })
      .slice(0, 8)
      .map((f: any) => {
        const issueCodes = (f.lobbying_activities || [])
          .map((a: any) => ISSUE_CODE_MAP[a.general_issue_code]?.label || a.general_issue_code_display || '')
          .filter(Boolean);
        // Deduplicate issue labels
        const uniqueIssues = [...new Set(issueCodes)].slice(0, 3).join(', ');
        return {
          client: f.client?.name || 'Unknown',
          registrant: f.registrant?.name || '',
          topics: uniqueIssues,
          period: f.filing_period_display || f.filing_year || '',
        };
      });

    return { found: lobbyists.length > 0, keywords, lobbyists, industrySlices };
  },
  ['lobbying-v3'],
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
