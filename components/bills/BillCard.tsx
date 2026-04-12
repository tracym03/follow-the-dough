'use client';

import { useState } from 'react';
import { billStatusClass, fmt } from '@/lib/utils';
import PizzaChart from '@/components/candidates/PizzaChart';

// ── Detect what industry a bill touches based on its title ────────────────────
const BILL_TOPIC_PATTERNS: { pattern: RegExp; label: string; emoji: string; industryKeys: string[] }[] = [
  {
    pattern: /health|medic|drug|pharm|hospital|patient|mental|opioid|care act|insurance coverage/i,
    label: 'Healthcare & Pharma', emoji: '🏥',
    industryKeys: ['pharma', 'healthcare', 'health'],
  },
  {
    pattern: /defense|military|weapon|armed|pentagon|army|navy|air force|national security|veteran/i,
    label: 'Defense & Military', emoji: '🛡️',
    industryKeys: ['defense', 'military', 'aerospace'],
  },
  {
    pattern: /bank|financial|wall street|loan|credit|securities|dodd|mortgage|lending|hedge/i,
    label: 'Finance & Banking', emoji: '🏦',
    industryKeys: ['finance', 'banking', 'investment'],
  },
  {
    pattern: /tax|revenue|irs|income tax|capital gain|estate tax|tariff/i,
    label: 'Taxation', emoji: '🏦',
    industryKeys: ['finance', 'banking'],
  },
  {
    pattern: /oil|gas|petroleum|pipeline|fossil|coal|carbon|emission|climate|clean energy|renewable|solar|wind power/i,
    label: 'Energy & Climate', emoji: '🛢️',
    industryKeys: ['oil', 'gas', 'energy'],
  },
  {
    pattern: /tech|internet|data privacy|ai |artificial intelligence|social media|cyber|algorithm|platform/i,
    label: 'Technology', emoji: '💻',
    industryKeys: ['tech', 'technology'],
  },
  {
    pattern: /housing|rent|eviction|affordable|hud |homeowner|foreclosure|real estate/i,
    label: 'Housing & Real Estate', emoji: '🏘️',
    industryKeys: ['real estate', 'housing'],
  },
  {
    pattern: /gun|firearm|second amendment|assault weapon/i,
    label: 'Guns & Firearms', emoji: '🔫',
    industryKeys: ['guns', 'nra', 'firearms'],
  },
  {
    pattern: /farm|agriculture|food safety|crop|livestock|dairy|rural|usda/i,
    label: 'Agriculture', emoji: '🌾',
    industryKeys: ['agriculture', 'farm'],
  },
  {
    pattern: /telecom|broadband|cable|spectrum|broadcast|net neutrality|fcc/i,
    label: 'Telecom & Media', emoji: '📡',
    industryKeys: ['telecom', 'media'],
  },
  {
    pattern: /education|school|college|student loan|university|teacher|pell/i,
    label: 'Education', emoji: '🎓',
    industryKeys: ['education'],
  },
  {
    pattern: /immigr|asylum|border|visa|daca|citizenship|undocumented/i,
    label: 'Immigration', emoji: '🌎',
    industryKeys: [],
  },
  {
    pattern: /israel|foreign aid|ukraine|nato|middle east|aipac/i,
    label: 'Foreign Policy', emoji: '🌐',
    industryKeys: ['pro-israel', 'foreign'],
  },
];

export function detectBillTopic(title: string) {
  for (const t of BILL_TOPIC_PATTERNS) {
    if (t.pattern.test(title)) return t;
  }
  return null;
}

// Check if sponsor's top industry funders overlap with the bill's topic
function getConflictSentence(
  billTopic: ReturnType<typeof detectBillTopic>,
  sponsorName: string,
  industrySlices: any[]
): { conflict: boolean; sentence: string } | null {
  if (!billTopic || !industrySlices?.length) return null;

  // Check each of the sponsor's top 3 industries against the bill's industry keys
  const topSlices = industrySlices.slice(0, 3);
  for (const slice of topSlices) {
    const sliceLabel = slice.label.toLowerCase();
    const hasConflict = billTopic.industryKeys.some(
      key => sliceLabel.includes(key) || key.includes(sliceLabel.split(' ')[0])
    );
    if (hasConflict) {
      const pct = Math.round(
        (slice.value / industrySlices.reduce((s: number, sl: any) => s + sl.value, 0)) * 100
      );
      return {
        conflict: true,
        sentence: `${slice.emoji} ${pct}% of ${sponsorName.split(',')[0].split(' ').pop()}'s identifiable funding comes from ${slice.label} — the same industry this bill regulates.`,
      };
    }
  }
  return {
    conflict: false,
    sentence: `No obvious funding conflict detected. ${sponsorName.split(',')[0].split(' ').pop()}'s top donors don't appear to have a direct stake in this bill's outcome.`,
  };
}

function SponsorFundingSection({
  sponsorName, sponsorState, sponsorChamber, sponsorParty, billTitle,
}: {
  sponsorName: string; sponsorState: string; sponsorChamber: string;
  sponsorParty: string; billTitle: string;
}) {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);

  const billTopic = detectBillTopic(billTitle);

  function toggle() {
    if (!open && !data && !loading) {
      setLoading(true);
      const params = new URLSearchParams({ name: sponsorName, state: sponsorState, chamber: sponsorChamber });
      fetch(`/api/sponsor?${params.toString()}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => setData({ found: false }))
        .finally(() => setLoading(false));
    }
    setOpen(v => !v);
  }

  const slices: any[]  = data?.industrySlices || [];
  const raised: number = data?.raised ?? 0;
  const indivT: number = data?.indivT ?? 0;
  const pacT: number   = data?.pacT ?? 0;
  const indivPct = raised > 0 ? Math.round((indivT / raised) * 100) : 0;
  const pacPct   = raised > 0 ? Math.round((pacT   / raised) * 100) : 0;
  // Always compute a conflict result when we have sponsor data — never hide this section
  const conflict = data?.found
    ? (slices.length > 0
        ? getConflictSentence(billTopic, sponsorName, slices)
        : {
            conflict: false,
            sentence: `FEC data found but PAC donor names couldn't be matched to specific industries automatically. Tap the OpenSecrets link below for the full picture.`,
            noData: true,
          })
    : null;
  const partyColor = sponsorParty === 'D' ? 'text-ftdblue' : sponsorParty === 'R' ? 'text-ftdred' : 'text-mid';

  return (
    <div className="border-t border-lb">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${open ? 'bg-amber/10' : 'hover:bg-lb/50'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">💰</span>
          <div>
            <div className="text-[11px] font-semibold text-brown">Who funds the bill&apos;s sponsor?</div>
            <div className="text-[9px] text-mid">
              See which industries bankroll <span className={`font-medium ${partyColor}`}>{sponsorName}</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-amber font-mono shrink-0">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {loading && (
            <div className="flex items-center gap-2 py-3 text-[9px] text-mid">
              <div className="w-3 h-3 border-2 border-amber/20 border-t-amber rounded-full animate-spin shrink-0" />
              Looking up FEC filings for {sponsorName}...
            </div>
          )}

          {!loading && data && !data.found && (
            <p className="py-2 text-[9px] text-mid italic">
              No FEC filings found for {sponsorName}.{' '}
              <a href={`https://www.fec.gov/data/candidates/?q=${encodeURIComponent(sponsorName)}&office=${sponsorChamber}`}
                target="_blank" rel="noopener noreferrer" className="text-amber underline">
                Search FEC.gov ↗
              </a>
            </p>
          )}

          {!loading && data?.found && (
            <>
              {/* ── Conflict check — always shown when we have data ── */}
              {conflict && (
                <div className={`mt-1 mb-3 px-3 py-2.5 rounded border text-[11px] leading-snug ${
                  conflict.conflict
                    ? 'bg-red-50 border-red-300 text-red-800 font-medium'
                    : (conflict as any).noData
                    ? 'bg-lb border-lb text-mid'
                    : 'bg-green-50 border-green-300 text-green-800 font-medium'
                }`}>
                  {conflict.conflict ? '⚠️ Potential conflict: ' : (conflict as any).noData ? '🔍 ' : '✓ '}
                  {conflict.sentence}
                </div>
              )}

              {/* ── Summary pills ── */}
              <div className="flex gap-2 flex-wrap mb-3">
                {raised > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber/20 text-brown">
                    💵 {fmt(raised)} raised (2024)
                  </span>
                )}
                {indivPct > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    👤 {indivPct}% individual
                  </span>
                )}
                {pacPct > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-ftdpurple">
                    🏛 {pacPct}% PAC money
                  </span>
                )}
              </div>

              {/* ── Industry dough chart ── */}
              {slices.length >= 2 ? (
                <>
                  <p className="text-[9px] text-brown leading-relaxed mb-2">
                    <strong>Top industry funders</strong> — these industries have a financial interest in how {sponsorName.split(',')[0]} votes:
                  </p>
                  <PizzaChart title={`${sponsorName} — Industry Funders`} slices={slices} />
                </>
              ) : (
                <p className="text-[9px] text-mid italic">
                  Not enough PAC data to identify industries.{' '}
                  <a href={`https://www.opensecrets.org/members-of-congress/summary?name=${encodeURIComponent(sponsorName)}`}
                    target="_blank" rel="noopener noreferrer" className="text-amber underline">
                    Check OpenSecrets ↗
                  </a>
                </p>
              )}

              <div className="text-[8px] text-mid mt-2 pt-2 border-t border-lb flex gap-3 flex-wrap">
                <a href={`https://www.fec.gov/data/candidate/${data.candidateId}/?cycle=2024&tab=receipts`}
                  target="_blank" rel="noopener noreferrer" className="text-amber">Full FEC record ↗</a>
                <a href={`https://www.opensecrets.org/members-of-congress/summary?name=${encodeURIComponent(sponsorName)}`}
                  target="_blank" rel="noopener noreferrer" className="text-amber">OpenSecrets profile ↗</a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildCongressUrl(type: string, number: string, congress: number): string {
  const typeMap: Record<string, string> = {
    'HR': 'house-bill', 'S': 'senate-bill',
    'HJRES': 'house-joint-resolution', 'SJRES': 'senate-joint-resolution',
    'HCONRES': 'house-concurrent-resolution', 'SCONRES': 'senate-concurrent-resolution',
    'HRES': 'house-simple-resolution', 'SRES': 'senate-simple-resolution',
  };
  return `https://www.congress.gov/bill/${congress}th-congress/${typeMap[type?.toUpperCase()] || 'house-bill'}/${number}`;
}

export default function BillCard({ bill }: { bill: any }) {
  const num       = `${bill.type || ''} ${bill.number || ''}`.trim() || 'Bill';
  const congress  = bill.congress || 119;
  const url       = bill.stateUrl || buildCongressUrl(bill.type || 'HR', bill.number || '', congress);
  const action    = bill.latestAction || '';
  const actionDate = bill.actionDate || '';
  const statusCls = billStatusClass(action);
  const topic     = detectBillTopic(bill.title || '');

  return (
    <div className="bg-white border border-lb border-l-4 border-l-ftdgreen mb-3 hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#2d6a4f] transition-all">
      <div className="px-4 py-3">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="font-display text-[12px] tracking-[3px] text-amber">
            {num} · {bill.isStateBill ? `${bill.stateCode || bill.sponsorState} Legislature` : `${congress}th Congress`}
          </div>
          {/* Topic badge */}
          {topic && (
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-lb border border-amber/40 text-brown shrink-0 whitespace-nowrap">
              {topic.emoji} {topic.label}
            </span>
          )}
        </div>
        <div className="text-[12px] font-medium leading-snug mb-1">
          {bill.title?.substring(0, 130)}{(bill.title?.length || 0) > 130 ? '…' : ''}
        </div>
        {bill.sponsor && (
          <div className="text-[9px] text-mid mt-1">
            Sponsored by <strong className="text-ink">{bill.sponsor}</strong>
            {bill.sponsorState && <span className="ml-1 text-mid">· {bill.sponsorState}</span>}
          </div>
        )}
        {action && (
          <span className={`inline-flex items-center text-[8px] tracking-[1.5px] uppercase px-2 py-0.5 rounded-full mt-2 ${statusCls}`}>
            {actionDate ? `${actionDate} — ` : ''}{action.substring(0, 90)}{action.length > 90 ? '…' : ''}
          </span>
        )}
      </div>

      {bill.sponsorName && (
        <SponsorFundingSection
          sponsorName={bill.sponsorName}
          sponsorState={bill.sponsorState || ''}
          sponsorChamber={bill.sponsorChamber || 'H'}
          sponsorParty={bill.sponsorParty || ''}
          billTitle={bill.title || ''}
        />
      )}

      <a href={url} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase text-ftdgreen border-b border-dashed border-ftdgreen opacity-70 hover:opacity-100 mx-4 mb-3 mt-2">
        ↗ {bill.isStateBill ? 'Full bill on OpenStates.org' : 'Full bill on Congress.gov'}
      </a>
    </div>
  );
}
