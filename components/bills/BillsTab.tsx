'use client';

import { useEffect, useState } from 'react';
import BillCard, { detectBillTopic } from './BillCard';
import LobbyingOverview from './LobbyingOverview';

// ── National spotlight bills ──────────────────────────────────────────────────
// Hardcoded high-profile bills shown regardless of ZIP — updated as bills move
const SPOTLIGHT_BILLS: Array<{ bill: any; why: string; conflict: string }> = [
  {
    bill: {
      number: '139',
      type: 'HR',
      congress: 119,
      title: 'Sunshine Protection Act of 2025',
      sponsor: 'Rep. Vern Buchanan (R-FL)',
      sponsorName: 'Vern Buchanan',
      sponsorState: 'FL',
      sponsorParty: 'R',
      sponsorChamber: 'H',
      latestAction: 'Passed House 308–117 — now before Senate',
      actionDate: '2026-07-14',
    },
    why: 'Would make daylight saving time permanent nationwide. Passed the House 308–117 on July 14, 2026 with broad bipartisan support — now heads to the Senate.',
    conflict: 'Sponsor Rep. Vern Buchanan (R-FL) built a $100M+ fortune owning 15+ auto dealerships across Florida. Car dealerships profit directly from longer evening daylight — consumers browse and test-drive after work. His top career donor industry is real estate (19%+ of career contributions), which benefits from extended evening foot traffic in shopping centers and commercial properties. Energy angle: modern research (NBER 2011, Nature Energy 2018) shows permanent DST actually increases electricity consumption in hot southern climates like Florida, where longer evenings spike air-conditioning use — meaning utilities that sell more power quietly benefit too.',
  },
  {
    bill: {
      number: '8800',
      type: 'HR',
      congress: 119,
      title: 'National Defense Authorization Act for Fiscal Year 2027',
      sponsor: 'Rep. Mike Rogers (R-AL)',
      sponsorName: 'Mike Rogers',
      sponsorState: 'AL',
      sponsorParty: 'R',
      sponsorChamber: 'H',
      latestAction: 'Passed House 219–206 — now before Senate',
      actionDate: '2026-07-22',
    },
    why: 'The $1.15T defense policy bill passed the House 219–206 on July 22, 2026. Section 219 directs the Pentagon to integrate U.S. and Israeli military research and development; Section 622 expands intelligence-sharing with Israel. An amendment from Reps. Thomas Massie (R-KY) and Ro Khanna (D-CA) to strip Section 219 was blocked from a floor vote by the Rules Committee.',
    conflict: 'Sponsor Rep. Mike Rogers (R-AL), chairman of the House Armed Services Committee, has taken $22,900 from AIPAC’s PAC and $11,200 from NORPAC over his career (FEC records) — but the bigger money is from defense contractors: $107,500 from Raytheon/RTX, $94,000 from Lockheed Martin, $93,500 from Northrop Grumman, $80,500 from Boeing and $30,000 from L3Harris, the same companies that build the missile-defense and munitions systems this bill’s Israel R&D-integration section would fund. Rogers’ own district includes Huntsville/Redstone Arsenal, Alabama’s missile-defense corridor, giving his home-district industry a direct stake in expanded joint U.S.-Israel weapons development.',
  },
  {
    bill: {
      number: '9716',
      type: 'HR',
      congress: 119,
      title: 'Protecting Rights in Video and Equipment Acquired Discovery (PRIVACY) Act',
      sponsor: 'Rep. Keith Self (R-TX)',
      sponsorName: 'Keith Self',
      sponsorState: 'TX',
      sponsorParty: 'R',
      sponsorChamber: 'H',
      latestAction: 'Referred to House Judiciary & Oversight Committees',
      actionDate: '2026-07-15',
    },
    why: 'Introduced July 15, 2026 by Rep. Keith Self (R-TX), with Reps. Eli Crane (R-AZ) and Andrew Clyde (R-GA) as cosponsors. Would require federal agencies to get a warrant before querying local police surveillance networks — including Flock Safety’s automated license-plate readers, now deployed by 5,000+ agencies in 49 states — caps data retention at 30 days, and bars federal funds from buying the systems. Referred to Judiciary and Oversight; no committee vote yet.',
    conflict: 'Flock Safety, the company this bill would rein in, has spent $1.5M+ on federal lobbying since Q4 2024 across five D.C. firms (Mercury Public Affairs, BGR Government Affairs, Cornerstone Government Affairs, Carlough Solutions, Modern Fortis) lobbying the House, Senate and White House on “homeland security” issues (Senate LDA filings). One of its lobbyists, Erskine Wells of BGR, previously served as Deputy Chief of Staff and Legislative Assistant to Sen. Roger Wicker (R-MS) — now chairman of the Senate Armed Services Committee. A similar bipartisan effort to restrict police license-plate-reader programs (the Perry–García Highway Bill amendment) was blocked at committee markup in May 2026 as this lobbying campaign ramped up.',
  },
];

function SpotlightEntry({ item }: { item: typeof SPOTLIGHT_BILLS[0] }) {
  return (
    <div className="mb-5 border-2 border-amber rounded overflow-hidden shadow-sm">
      <div className="bg-amber/10 border-b border-amber px-4 py-3">
        <div className="text-[14px] tracking-[2px] uppercase text-amber font-semibold mb-1">📌 Why Follow the Dough is watching</div>
        <p className="text-[16px] text-brown leading-snug">{item.why}</p>
      </div>
      <div className="bg-red-50 border-b border-red-200 px-4 py-3">
        <div className="text-[14px] tracking-[2px] uppercase text-ftdred font-semibold mb-1">⚠️ Potential conflicts of interest</div>
        <p className="text-[16px] text-red-800 leading-snug">{item.conflict}</p>
      </div>
      <BillCard bill={item.bill} />
    </div>
  );
}

// ── Topic filter chips ────────────────────────────────────────────────────────
const TOPIC_FILTERS = [
  { label: 'All',                   emoji: '📋' },
  { label: 'Healthcare & Pharma',   emoji: '🏥' },
  { label: 'Defense & Military',    emoji: '🛡️' },
  { label: 'Finance & Banking',     emoji: '🏦' },
  { label: 'Energy & Climate',      emoji: '🛢️' },
  { label: 'Technology',            emoji: '💻' },
  { label: 'Housing & Real Estate', emoji: '🏘️' },
  { label: 'Education',             emoji: '🎓' },
  { label: 'Agriculture',           emoji: '🌾' },
  { label: 'Immigration',           emoji: '🌎' },
  { label: 'Foreign Policy',        emoji: '🌐' },
  { label: 'Environment',           emoji: '🌿' },
  { label: 'Civil Liberties',       emoji: '🗽' },
];

// ── Main BillsTab component ───────────────────────────────────────────────────
export default function BillsTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  // Single filter: 'All', 'From My Reps', or a topic label
  const [filter, setFilter] = useState('All');

  // National bills — loads on mount
  const [browseData, setBrowseData]       = useState<any>(null);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError]     = useState('');

  // State rep bills — lazy, loads first time chip is tapped
  const [repsData, setRepsData]       = useState<any>(null);
  const [repsLoading, setRepsLoading] = useState(false);
  const [repsError, setRepsError]     = useState('');
  const [repsFetched, setRepsFetched] = useState(false);

  useEffect(() => {
    fetch('/api/bills/topics')
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setBrowseData(json);
      })
      .catch((e: any) => setBrowseError(e.message))
      .finally(() => setBrowseLoading(false));
  }, []);

  function handleFilterChange(label: string) {
    setFilter(label);
    if (label === 'From My Reps' && !repsFetched) {
      setRepsFetched(true);
      setRepsLoading(true);
      fetch(`/api/bills?state=${state}&stateName=${encodeURIComponent(stateName)}`)
        .then(r => r.json())
        .then(json => {
          if (json.error) throw new Error(json.error);
          setRepsData(json);
        })
        .catch((e: any) => setRepsError(e.message))
        .finally(() => setRepsLoading(false));
    }
  }

  const isReps       = filter === 'From My Reps';
  const browseBills  = browseData?.bills ?? [] as any[];
  const repsBills    = repsData?.bills   ?? [] as any[];
  const activeBills  = isReps ? repsBills : browseBills;

  const filteredBills = (filter === 'All' || isReps)
    ? activeBills
    : activeBills.filter((b: any) => detectBillTopic(b.title ?? '')?.label === filter);

  // Chips: All · From My Reps · <topics>
  const allChips = [
    { label: 'All',          emoji: '📋' },
    { label: 'From My Reps', emoji: '📍' },
    ...TOPIC_FILTERS.filter(t => t.label !== 'All'),
  ];

  const isLoading = isReps ? repsLoading : browseLoading;
  const hasError  = isReps ? repsError   : browseError;

  return (
    <div>
      {/* Header bar */}
      <div className="bg-brown text-gold text-[17px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span>119th U.S. Congress · Federal Bills</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* National Spotlight */}
        {SPOTLIGHT_BILLS.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-display text-xl tracking-[3px] text-brown">🔦 National Spotlight</h2>
              <span className="text-[15px] px-2 py-0.5 rounded-full bg-amber text-ink font-semibold">{SPOTLIGHT_BILLS.length}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
            </div>
            <p className="text-[16px] text-mid mb-4">High-profile bills worth tracking — shown regardless of your ZIP code.</p>
            {SPOTLIGHT_BILLS.map((item, i) => (
              <SpotlightEntry key={i} item={item} />
            ))}
          </div>
        )}

        {/* Lobbying overview */}
        <LobbyingOverview />

        {/* Unified chip row: All · From My Reps · Healthcare · ... */}
        <div className="mb-4">
          <div className="text-[16px] tracking-[3px] uppercase text-mid mb-2">Filter by topic:</div>
          <div className="flex gap-1.5 flex-wrap">
            {allChips.map(t => {
              const isActive   = filter === t.label;
              const isRepsChip = t.label === 'From My Reps';
              return (
                <button
                  key={t.label}
                  onClick={() => handleFilterChange(t.label)}
                  className={`text-[17px] px-2.5 py-1 rounded-full border transition-colors ${
                    isActive
                      ? isRepsChip
                        ? 'bg-ftdgreen text-white border-ftdgreen font-semibold'
                        : 'bg-amber text-ink border-amber font-semibold'
                      : 'bg-white border-lb text-mid hover:border-amber/60'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl tracking-[3px] text-brown">
            {filter === 'All'          ? 'Federal Bills — All Topics'
            : isReps                   ? `Bills from ${stateName} Members`
            :                           `${filter} Bills`}
          </h2>
          {!isLoading && (
            <span className={`text-[16px] tracking-widest px-2 py-0.5 rounded-full ${isReps ? 'bg-ftdgreen text-white' : 'bg-amber text-ink'}`}>
              {filteredBills.length}
            </span>
          )}
          <div className={`flex-1 h-px bg-gradient-to-r ${isReps ? 'from-ftdgreen' : 'from-amber'} to-transparent`} />
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className={`w-7 h-7 border-[3px] rounded-full animate-spin mb-4 ${isReps ? 'border-ftdgreen/20 border-t-ftdgreen' : 'border-amber/20 border-t-amber'}`} />
            <div className={`font-display text-2xl ${isReps ? 'text-ftdgreen' : 'text-amber'}`}>
              {isReps ? `Loading ${stateName} Bills…` : 'Loading Bills…'}
            </div>
            <div className="text-[17px] tracking-widest uppercase text-mid mt-2">Fetching Congress.gov data</div>
          </div>
        )}

        {/* Error */}
        {!isLoading && hasError && (
          <div className="bg-red-50 border-2 border-ftdred p-4 my-4 text-red-800 text-sm">
            ⚠ Could not load bills: {hasError}
          </div>
        )}

        {/* Bills */}
        {!isLoading && !hasError && (
          filteredBills.length === 0 ? (
            <div className="text-center py-8 text-mid text-[16px] font-mono">
              No {filter === 'From My Reps' ? stateName : filter} bills found.
              <button onClick={() => setFilter('All')} className="block mx-auto mt-2 text-amber underline">
                Show all bills
              </button>
            </div>
          ) : (
            filteredBills.map((bill: any, i: number) => (
              <BillCard key={i} bill={bill} />
            ))
          )
        )}

        {/* Footer */}
        {!isLoading && (
          <div className="text-center mt-6">
            {isReps ? (
              <a href={`https://www.congress.gov/members?q=%7B%22congress%22%3A%22119%22%2C%22state%22%3A%22${state}%22%7D`}
                target="_blank" rel="noopener noreferrer"
                className="text-[17px] tracking-[3px] uppercase text-ftdgreen">
                All {stateName} members on Congress.gov ↗
              </a>
            ) : (
              <a href="https://www.congress.gov/browse/bills/119th-congress"
                target="_blank" rel="noopener noreferrer"
                className="text-[17px] tracking-[3px] uppercase text-amber">
                Browse all 119th Congress bills on Congress.gov ↗
              </a>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
