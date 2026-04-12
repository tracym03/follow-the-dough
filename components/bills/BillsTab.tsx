'use client';

import { useEffect, useState } from 'react';
import BillCard, { detectBillTopic } from './BillCard';
import LobbyingOverview from './LobbyingOverview';

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
