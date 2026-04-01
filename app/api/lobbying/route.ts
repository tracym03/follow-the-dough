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

function buildSlicesAndLobbyists(filings: any[]) {
  // ── Build issue-code dough chart ─────────────────────────────────────────
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
  const seenClients = new Set<string>();
  const lobbyists = filings
    .filter(f => {
      const client = (f.client?.name || '').trim().toUpperCase();
      if (!client || seenClients.has(client)) return false;
      seenClients.add(client);
      return true;
    })
    .slice(0, 8)
    .map((f: any) => {
      const issueCodes = (f.lobbying_activities || [])
        .map((a: any) => ISSUE_CODE_MAP[a.general_issue_code]?.label || a.general_issue_code_display || '')
        .filter(Boolean);
      const uniqueIssues = [...new Set(issueCodes)].slice(0, 3).join(', ');
      // Pull out specific issues text for more detail
      const specificIssues = (f.lobbying_activities || [])
        .map((a: any) => (a.description || '').substring(0, 120))
        .filter(Boolean)
        .slice(0, 2);
      return {
        client: f.client?.name || 'Unknown',
        registrant: f.registrant?.name || '',
        topics: uniqueIssues,
        specificIssues,
        period: f.filing_period_display || f.filing_year || '',
      };
    });

  return { industrySlices, lobbyists };
}

// ── Cached fetch by bill number (specific — always try this first) ──────────
function fetchByBillNumber(billId: string) {
  return unstable_cache(
    async () => {
      // LDA lets you search the free-text specific issues field for bill numbers
      // Try multiple formats: "HR 1234", "H.R. 1234", "H.R.1234"
      const variants = [
        billId,                                      // e.g. "HR 1234"
        billId.replace(/^HR /, 'H.R. '),             // "H.R. 1234"
        billId.replace(/^S /, 'S. '),                // "S. 567"
        billId.replace(' ', ''),                     // "HR1234"
      ];

      for (const variant of variants) {
        const url = new URL(`${LDA_BASE}/filings/`);
        url.searchParams.set('filing_specific_lobbying_issues', variant);
        url.searchParams.set('filing_year', '2025');
        url.searchParams.set('page_size', '25');

        const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
        if (!r.ok) continue;
        const data = await r.json();
        const filings: any[] = data.results || [];
        if (filings.length >= 2) return filings;
      }
      return [];
    },
    [`lobbying-bill-${billId}`],
    { revalidate: 86400 }
  )();
}

// ── Cached fetch by keywords (fallback) ──────────────────────────────────────
// KEY FIX: cache key includes the keywords so each bill gets its own cache entry
function fetchByKeywords(keywords: string) {
  const safeKey = keywords.replace(/[^a-z0-9-]/gi, '-').substring(0, 60);
  return unstable_cache(
    async () => {
      const url = new URL(`${LDA_BASE}/filings/`);
      url.searchParams.set('search', keywords);
      url.searchParams.set('filing_year', '2025');
      url.searchParams.set('page_size', '20');

      const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
      if (!r.ok) throw new Error(`LDA ${r.status}`);
      const data = await r.json();
      return data.results || [];
    },
    [`lobbying-kw-${safeKey}`],
    { revalidate: 86400 }
  )();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const keywords = (searchParams.get('keywords') || '').substring(0, 80);
  const billId = searchParams.get('billId') || '';   // e.g. "HR 1234" or "S 567"

  if (!keywords && !billId) {
    return NextResponse.json({ found: false, lobbyists: [], industrySlices: [] });
  }

  try {
    let filings: any[] = [];
    let searchedByBill = false;

    // 1️⃣ Try bill-number-specific search first — much more accurate
    if (billId) {
      filings = await fetchByBillNumber(billId);
      searchedByBill = filings.length >= 2;
    }

    // 2️⃣ Fall back to keyword search if no bill-specific results
    if (!searchedByBill && keywords) {
      filings = await fetchByKeywords(keywords);
    }

    const { industrySlices, lobbyists } = buildSlicesAndLobbyists(filings);

    return NextResponse.json({
      found: lobbyists.length > 0,
      keywords,
      billId,
      searchedByBill,
      lobbyists,
      industrySlices,
    });
  } catch (e: any) {
    return NextResponse.json({ found: false, keywords, billId, lobbyists: [], industrySlices: [], error: e.message });
  }
}
