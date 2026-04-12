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

  const houseCands       = (candData?.candidates || []).filter((d: any) => d.c?.office === 'H');
  const senateCands      = (candData?.candidates || []).filter((d: any) => d.c?.office === 'S');
  const houseIncumbents  = houseCands.filter((d: any) => d.c?.incumbent_challenge === 'I');
  const houseChallengers = houseCands.filter((d: any) => d.c?.incumbent_challenge !== 'I');
  const senateIncumbents  = senateCands.filter((d: any) => d.c?.incumbent_challenge === 'I');
  const senateChallengers = senateCands.filter((d: any) => d.c?.incumbent_challenge !== 'I');

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
            {/* ── House ── */}
            {houseCands.length > 0 && (
              <>
                <div className="text-[11px] tracking-[3px] uppercase text-mid mb-2 mt-1">
                  🏛 U.S. House · District {candData?.district || '?'}
                </div>
                {houseIncumbents.map((d: any, i: number) => (
                  <FlowCard
                    key={`hi-${i}`}
                    title={`Your House Rep · District ${candData?.district || '?'}`}
                    sub={`${d.c?.name} · ${partyLabel(d.c?.party)} — tap to see funding breakdown`}
                    icon="🏛️"
                    accentColor="#c9a84c"
                  >
                    <CandidateCard data={d} electionYear={candData?.electionYear || 2024} />
                  </FlowCard>
                ))}
                {houseChallengers.map((d: any, i: number) => (
                  <FlowCard
                    key={`hc-${i}`}
                    title={`House Challenger · District ${candData?.district || '?'}`}
                    sub={`${d.c?.name} · ${partyLabel(d.c?.party)} — tap to see funding breakdown`}
                    icon="🗳️"
                    accentColor="#9e9e9e"
                  >
                    <CandidateCard data={d} electionYear={candData?.electionYear || 2024} />
                  </FlowCard>
                ))}
              </>
            )}

            {/* ── Senate ── */}
            {senateCands.length > 0 && (
              <>
                <div className="text-[11px] tracking-[3px] uppercase text-mid mb-2 mt-4">
                  🏛 U.S. Senate · {stateName}
                </div>
                {senateCands.map((d: any, i: number) => {
                  const isInc = d.c?.incumbent_challenge === 'I';
                  return (
                    <FlowCard
                      key={`s-${i}`}
                      title={isInc ? `Your U.S. Senator` : `Senate Candidate`}
                      sub={`${d.c?.name} · ${partyLabel(d.c?.party)} — tap to see funding breakdown`}
                      icon="🏛️"
                      accentColor={isInc ? '#c9a84c' : '#9e9e9e'}
                    >
                      <CandidateCard data={d} electionYear={candData?.electionYear || 2024} />
                    </FlowCard>
                  );
                })}
                <div className="text-[11px] text-mid italic px-1 mb-3">
                  Senators serve staggered 6-year terms — only those who ran in {candData?.electionYear || 2024} appear here.{' '}
                  <a href={`https://www.senate.gov/states/${stateName.replace(/ /g, '_')}/intro.htm`}
                    target="_blank" rel="noopener noreferrer" className="text-amber underline">
                    See all {stateName} senators ↗
                  </a>
                </div>
              </>
            )}

            {/* No candidates at all */}
            {houseCands.length === 0 && senateCands.length === 0 && (
              <div className="text-center py-6 bg-lb border border-amber/40 rounded mb-4">
                <div className="font-display text-xl text-amber mb-1">No FEC Filings Found</div>
                <p className="text-[13px] text-mid px-4">
                  No candidates found for {stateName}. Try a different ZIP or check{' '}
                  <a href={`https://www.fec.gov/data/candidates/?state=${state}`}
                    target="_blank" rel="noopener noreferrer" className="text-amber underline">FEC.gov</a>.
                </p>
              </div>
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
