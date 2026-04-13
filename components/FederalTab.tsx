'use client';

import { useEffect, useState } from 'react';
import CandidateCard from '@/components/candidates/CandidateCard';
import BillCard, { detectBillTopic } from '@/components/bills/BillCard';
import LobbyingOverview from '@/components/bills/LobbyingOverview';

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

function FlowCard({ title, sub, icon, accentColor = '#c9a84c', children, defaultOpen = false }: {
  title: string; sub?: string; icon?: string; accentColor?: string;
  children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-lb border-l-4 mb-3" style={{ borderLeftColor: accentColor }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-lb/50 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && <span className="text-xl shrink-0">{icon}</span>}
          <div className="min-w-0">
            <div className="font-display text-[15px] tracking-wide text-brown">{title}</div>
            {sub && <div className="text-[12px] text-mid mt-0.5">{sub}</div>}
          </div>
        </div>
        <span className="text-[11px] text-amber font-mono shrink-0 ml-3">{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && <div className="border-t border-lb">{children}</div>}
    </div>
  );
}

// Compact card for the representative grid — matches mockup style
function RepCard({ office, name, party, raised, accentColor, isSelected, onClick }: {
  office: string; name: string; party: string; raised: number;
  accentColor: string; isSelected: boolean; onClick: () => void;
}) {
  const fmt = (n: number) => n >= 1e6 ? `$${(n / 1e6).toFixed(1)}M` : n > 0 ? `$${Math.round(n / 1000)}K` : '—';
  const partyColor = party === 'DEM' ? 'bg-blue-100 text-ftdblue' : party === 'REP' ? 'bg-red-100 text-ftdred' : 'bg-lb text-mid';
  const partyName  = party === 'DEM' ? 'Dem' : party === 'REP' ? 'Rep' : party || '?';
  return (
    <button
      onClick={onClick}
      className={`w-full text-left bg-white border border-lb border-l-4 p-3 transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-amber/60' : ''}`}
      style={{ borderLeftColor: accentColor }}
    >
      <div className="text-[10px] tracking-[2px] uppercase text-mid mb-1">{office}</div>
      <div className="font-display text-[14px] text-brown leading-tight mb-1">{name}</div>
      <div className="flex items-center justify-between gap-1">
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${partyColor}`}>{partyName}</span>
        <span className="font-display text-[13px] text-amber">{fmt(raised)}</span>
      </div>
      <div className="text-[10px] text-amber/70 mt-1.5 text-right">{isSelected ? '▲ hide' : '▼ tap to see funding'}</div>
    </button>
  );
}

function TierLabel({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-3 mb-4 mt-2">
      <div className="bg-brown text-gold text-[11px] tracking-[3px] uppercase px-3 py-1.5 border border-amber/50 whitespace-nowrap shrink-0">
        {num} · {label}
      </div>
      <div className="flex-1 h-px bg-gradient-to-r from-amber/30 to-transparent" />
    </div>
  );
}

function FlowArrow() {
  return (
    <div className="flex flex-col items-center my-4">
      <div className="w-px h-5 bg-amber/30" />
      <span className="text-amber/50 text-[10px] leading-none">▼</span>
    </div>
  );
}

function partyLabel(party: string) {
  if (party === 'DEM') return 'Democrat';
  if (party === 'REP') return 'Republican';
  return party || 'Unaffiliated';
}

export default function FederalTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  // Candidates
  const [candData, setCandData]       = useState<any>(null);
  const [candLoading, setCandLoading] = useState(true);
  const [candError, setCandError]     = useState('');
  const [selectedRepId, setSelectedRepId] = useState<string | null>(null);

  // Bills
  const [filter, setFilter]               = useState('All');
  const [browseData, setBrowseData]       = useState<any>(null);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError]     = useState('');
  const [repsData, setRepsData]           = useState<any>(null);
  const [repsLoading, setRepsLoading]     = useState(false);
  const [repsError, setRepsError]         = useState('');
  const [repsFetched, setRepsFetched]     = useState(false);

  useEffect(() => {
    fetch(`/api/candidates?state=${state}&zip=${zip}`)
      .then(r => r.json())
      .then(json => { if (json.error) throw new Error(json.error); setCandData(json); })
      .catch((e: any) => setCandError(e.message))
      .finally(() => setCandLoading(false));

    fetch('/api/bills/topics')
      .then(r => r.json())
      .then(json => { if (json.error) throw new Error(json.error); setBrowseData(json); })
      .catch((e: any) => setBrowseError(e.message))
      .finally(() => setBrowseLoading(false));
  }, [zip, state]);

  function handleFilterChange(label: string) {
    setFilter(label);
    if (label === 'From My Reps' && !repsFetched) {
      setRepsFetched(true);
      setRepsLoading(true);
      fetch(`/api/bills?state=${state}&stateName=${encodeURIComponent(stateName)}`)
        .then(r => r.json())
        .then(json => { if (json.error) throw new Error(json.error); setRepsData(json); })
        .catch((e: any) => setRepsError(e.message))
        .finally(() => setRepsLoading(false));
    }
  }

  const houseCands  = (candData?.candidates || []).filter((d: any) => d.c?.office === 'H');
  const senateCands = (candData?.candidates || []).filter((d: any) => d.c?.office === 'S');

  // Minimum receipts a challenger must have raised to appear (filters out $0 ghost filers)
  const CHALLENGER_MIN = 50_000;

  // House: top candidate by receipts (the winner/leading candidate, regardless of incumbent status)
  const houseLeaders     = houseCands.slice(0, 1);
  const houseLeaderIds   = new Set(houseLeaders.map((d: any) => d.c?.candidate_id));
  const houseChallengers = houseCands.filter((d: any) =>
    !houseLeaderIds.has(d.c?.candidate_id) && (d.t?.receipts ?? 0) >= CHALLENGER_MIN
  );

  // Senate: show one senator per seat — pick the top-funded candidate from each distinct _senCycle.
  // US senators serve staggered 6-year terms so we query year, year-2, AND year-4.
  // e.g. CA 2026: Schiff (_senCycle=2024), Padilla (_senCycle=2022) → both senators shown.
  const electionYear = candData?.electionYear || 2024;
  const senCycleGroups = new Map<number, any>();
  for (const d of senateCands) {
    const cycle = d.c?._senCycle as number;
    if (cycle !== undefined && !senCycleGroups.has(cycle)) senCycleGroups.set(cycle, d);
  }
  const senateLeaders  = Array.from(senCycleGroups.values()).slice(0, 2);
  const senateLeaderIds   = new Set(senateLeaders.map((d: any) => d.c?.candidate_id));

  // Senate challengers: only current-cycle filers (actual 2026 candidates, not prior-cycle holdovers)
  // with meaningful fundraising — excludes Porter/Garvey (2024 cycle) and $0 filers
  const senateChallengers = senateCands.filter((d: any) =>
    !senateLeaderIds.has(d.c?.candidate_id) &&
    d.c?._senCycle === electionYear &&
    (d.t?.receipts ?? 0) >= CHALLENGER_MIN
  );

  const isReps        = filter === 'From My Reps';
  const browseBills   = browseData?.bills ?? [] as any[];
  const repsBills     = repsData?.bills ?? [] as any[];
  const activeBills   = isReps ? repsBills : browseBills;
  const filteredBills = (filter === 'All' || isReps)
    ? activeBills
    : activeBills.filter((b: any) => detectBillTopic(b.title ?? '')?.label === filter);

  const allChips = [
    { label: 'All', emoji: '📋' },
    { label: 'From My Reps', emoji: '📍' },
    ...TOPIC_FILTERS.filter(t => t.label !== 'All'),
  ];

  const billsLoading = isReps ? repsLoading : browseLoading;
  const billsError   = isReps ? repsError   : browseError;

  return (
    <div>
      {/* Meta bar */}
      <div className="bg-brown text-gold text-[12px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span className={`font-display text-sm ${candData?.usingFallback ? 'text-amber' : 'text-gold'}`}>
          {candData?.electionYear || 2026} Federal
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* Fallback banner */}
        {candData?.usingFallback && (
          <div className="bg-yellow-50 border border-yellow-300 border-l-4 border-l-amber p-3 mb-4 text-[13px] leading-relaxed text-brown">
            <strong className="font-display text-[15px] tracking-wider block mb-1">📅 Showing 2024 Fundraising Data</strong>
            It&apos;s early in the 2026 cycle. These representatives are still in office and these donors still have influence.
            The app will switch to 2026 live data as candidates begin filing.
          </div>
        )}

        {/* ── TIER 1: Your Representatives ── */}
        <TierLabel num={1} label="Your Federal Representatives" />

        {candLoading ? (
          <div className="py-8 text-center">
            <div className="w-6 h-6 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mx-auto mb-2" />
            <div className="text-[12px] text-mid tracking-widest uppercase">Loading representatives…</div>
          </div>
        ) : candError ? (
          <div className="bg-red-50 border border-ftdred p-3 text-red-800 text-[13px] mb-4">⚠ {candError}</div>
        ) : (
          <>
            {/* ── Currently serving: compact grid ── */}
            {(houseLeaders.length > 0 || senateLeaders.length > 0) && (
              <>
                {/* Rep grid: senators + house rep side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
                  {senateLeaders.map((d: any, i: number) => {
                    const id = d.c?.candidate_id || `sl-${i}`;
                    return (
                      <RepCard
                        key={id}
                        office="U.S. Senator"
                        name={d.c?.name || ''}
                        party={d.c?.party || ''}
                        raised={d.t?.receipts ?? 0}
                        accentColor="#1565c0"
                        isSelected={selectedRepId === id}
                        onClick={() => setSelectedRepId(selectedRepId === id ? null : id)}
                      />
                    );
                  })}
                  {houseLeaders.map((d: any, i: number) => {
                    const id = d.c?.candidate_id || `hl-${i}`;
                    return (
                      <RepCard
                        key={id}
                        office={`House Rep · District ${candData?.district || '?'}`}
                        name={d.c?.name || ''}
                        party={d.c?.party || ''}
                        raised={d.t?.receipts ?? 0}
                        accentColor="#c9a84c"
                        isSelected={selectedRepId === id}
                        onClick={() => setSelectedRepId(selectedRepId === id ? null : id)}
                      />
                    );
                  })}
                </div>

                {/* Expanded panel — shows full CandidateCard for selected rep */}
                {selectedRepId && (() => {
                  const allReps = [...senateCands, ...houseCands];
                  const selected = allReps.find((d: any) => d.c?.candidate_id === selectedRepId);
                  if (!selected) return null;
                  return (
                    <div className="mb-4 border border-amber/30 rounded overflow-hidden">
                      <CandidateCard data={selected} electionYear={candData?.electionYear || 2024} />
                    </div>
                  );
                })()}
              </>
            )}

            {/* No currently-serving found */}
            {houseLeaders.length === 0 && senateLeaders.length === 0 && (
              <div className="text-center py-6 bg-lb border border-amber/40 rounded mb-4">
                <div className="font-display text-xl text-amber mb-1">No FEC Filings Found</div>
                <p className="text-[13px] text-mid px-4">
                  No candidates found for {stateName}. Try a different ZIP or check{' '}
                  <a href={`https://www.fec.gov/data/candidates/?state=${state}`}
                    target="_blank" rel="noopener noreferrer" className="text-amber underline">FEC.gov</a>.
                </p>
              </div>
            )}

            {/* Challengers — only show when using live 2026 data */}
            {candData?.usingFallback ? (
              <div className="bg-lb border border-amber/30 rounded px-4 py-3 text-[13px] text-mid">
                <strong className="text-brown block mb-1">2026 challengers not yet filed</strong>
                It&apos;s early in the cycle — no challengers have registered significant fundraising with
                the FEC yet. Check back closer to the 2026 election, or see who has filed so far:
                <a
                  href={`https://www.fec.gov/data/candidates/?state=${state}&election_year=2026`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-amber underline block mt-1.5">
                  View 2026 {stateName} candidates on FEC.gov ↗
                </a>
              </div>
            ) : (houseChallengers.length > 0 || senateChallengers.length > 0) && (
              <>
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px bg-lb" />
                  <span className="text-[10px] tracking-[2px] uppercase text-mid shrink-0">who wants their seats in 2026?</span>
                  <div className="flex-1 h-px bg-lb" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {[...houseChallengers, ...senateChallengers].map((d: any, i: number) => {
                    const id = d.c?.candidate_id || `ch-${i}`;
                    const isSen = d.c?.office === 'S';
                    return (
                      <RepCard
                        key={id}
                        office={isSen ? 'Senate Challenger' : `House Challenger · District ${candData?.district || '?'}`}
                        name={d.c?.name || ''}
                        party={d.c?.party || ''}
                        raised={d.t?.receipts ?? 0}
                        accentColor="#9e9e9e"
                        isSelected={selectedRepId === id}
                        onClick={() => setSelectedRepId(selectedRepId === id ? null : id)}
                      />
                    );
                  })}
                </div>
                {selectedRepId && (() => {
                  const challengers = [...houseChallengers, ...senateChallengers];
                  const selected = challengers.find((d: any) => d.c?.candidate_id === selectedRepId);
                  if (!selected) return null;
                  return (
                    <div className="mb-4 border border-lb rounded overflow-hidden">
                      <CandidateCard data={selected} electionYear={candData?.electionYear || 2024} />
                    </div>
                  );
                })()}
              </>
            )}
          </>
        )}

        <div className="text-center mt-1 mb-2">
          <a href={`https://www.fec.gov/data/candidates/?state=${state}&election_year=2026`}
            target="_blank" rel="noopener noreferrer"
            className="text-[11px] tracking-[3px] uppercase text-amber">
            All {stateName} 2026 candidates on FEC.gov ↗
          </a>
        </div>

        <FlowArrow />

        {/* ── TIER 2: Federal Bills ── */}
        <TierLabel num={2} label="Federal Bills Before Congress" />

        {/* Topic chips */}
        <div className="mb-4">
          <div className="text-[12px] tracking-[3px] uppercase text-mid mb-2">Filter by topic:</div>
          <div className="flex gap-1.5 flex-wrap">
            {allChips.map(t => {
              const isActive   = filter === t.label;
              const isRepsChip = t.label === 'From My Reps';
              return (
                <button
                  key={t.label}
                  onClick={() => handleFilterChange(t.label)}
                  className={`text-[13px] px-2.5 py-1 rounded-full border transition-colors ${
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

        {/* Bills header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-[17px] tracking-[3px] text-brown">
            {filter === 'All'  ? 'All Federal Bills'
              : isReps         ? `Bills from ${stateName} Members`
              :                  `${filter} Bills`}
          </h2>
          {!billsLoading && (
            <span className={`text-[12px] tracking-widest px-2 py-0.5 rounded-full ${isReps ? 'bg-ftdgreen text-white' : 'bg-amber text-ink'}`}>
              {filteredBills.length}
            </span>
          )}
          <div className={`flex-1 h-px bg-gradient-to-r ${isReps ? 'from-ftdgreen' : 'from-amber'} to-transparent`} />
        </div>

        {billsLoading ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className={`w-6 h-6 border-[3px] rounded-full animate-spin mb-3 ${isReps ? 'border-ftdgreen/20 border-t-ftdgreen' : 'border-amber/20 border-t-amber'}`} />
            <div className={`font-display text-xl ${isReps ? 'text-ftdgreen' : 'text-amber'}`}>
              {isReps ? `Loading ${stateName} Bills…` : 'Loading Bills…'}
            </div>
          </div>
        ) : billsError ? (
          <div className="bg-red-50 border border-ftdred p-3 text-red-800 text-[13px] mb-4">⚠ {billsError}</div>
        ) : isReps && repsData?.noStateMembers ? (
          <div className="bg-lb border border-amber/40 rounded px-4 py-3 text-[13px] text-brown">
            <strong className="block mb-1">Congress API returned no {stateName} members</strong>
            <p className="text-mid mb-2">
              The free demo API key doesn&apos;t support state filtering reliably. To see real bills from your representatives, add a free personal key from{' '}
              <a href="https://api.congress.gov/sign-up/" target="_blank" rel="noopener noreferrer" className="text-amber underline">api.congress.gov/sign-up</a>
              {' '}and set <code className="bg-white/60 px-1 rounded">CONGRESS_API_KEY</code> in your Vercel environment variables.
            </p>
            <a href={`https://www.congress.gov/members?q=%7B%22congress%22%3A%22119%22%2C%22state%22%3A%22${state}%22%7D`}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] text-ftdgreen underline">
              Browse {stateName} members on Congress.gov ↗
            </a>
          </div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-8 text-mid text-[13px] font-mono">
            No {filter === 'From My Reps' ? stateName : filter} bills found.
            <button onClick={() => setFilter('All')} className="block mx-auto mt-2 text-amber underline">
              Show all bills
            </button>
          </div>
        ) : (
          filteredBills.map((bill: any, i: number) => <BillCard key={i} bill={bill} />)
        )}

        {!billsLoading && (
          <div className="text-center mt-4 mb-2">
            {isReps ? (
              <a href={`https://www.congress.gov/members?q=%7B%22congress%22%3A%22119%22%2C%22state%22%3A%22${state}%22%7D`}
                target="_blank" rel="noopener noreferrer"
                className="text-[12px] tracking-[3px] uppercase text-ftdgreen">
                All {stateName} members on Congress.gov ↗
              </a>
            ) : (
              <a href="https://www.congress.gov/browse/bills/119th-congress"
                target="_blank" rel="noopener noreferrer"
                className="text-[12px] tracking-[3px] uppercase text-amber">
                Browse all 119th Congress bills ↗
              </a>
            )}
          </div>
        )}

        <FlowArrow />

        {/* ── TIER 3: Lobbying ── */}
        <TierLabel num={3} label="Who's Lobbying Congress?" />

        <LobbyingOverview embedded={true} />

      </div>
    </div>
  );
}
