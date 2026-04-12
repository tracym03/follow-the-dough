'use client';

import { useEffect, useState } from 'react';
import BillCard, { detectBillTopic } from './BillCard';

const STATE_OPTIONS = [
  { code: 'CA', name: 'California', emoji: '🌴', financeUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/' },
  { code: 'NY', name: 'New York',   emoji: '🗽', financeUrl: 'https://publicreporting.elections.ny.gov/' },
  { code: 'TX', name: 'Texas',      emoji: '⭐', financeUrl: 'https://www.ethics.state.tx.us/search/cf/CandidateSearch.php' },
  { code: 'FL', name: 'Florida',    emoji: '🌊', financeUrl: 'https://dos.myflorida.com/elections/candidates-committees/' },
];

const TOPIC_FILTERS = [
  { label: 'All',                   emoji: '📋' },
  { label: 'Healthcare & Pharma',   emoji: '🏥' },
  { label: 'Finance & Banking',     emoji: '🏦' },
  { label: 'Energy & Climate',      emoji: '🛢️' },
  { label: 'Technology',            emoji: '💻' },
  { label: 'Housing & Real Estate', emoji: '🏘️' },
  { label: 'Education',             emoji: '🎓' },
  { label: 'Agriculture',           emoji: '🌾' },
  { label: 'Immigration',           emoji: '🌎' },
];

export default function StateBillsTab({ state }: { state: string }) {
  const defaultState = (['CA', 'NY', 'TX', 'FL'] as string[]).includes(state) ? state : 'CA';
  const [selectedState, setSelectedState] = useState(defaultState);
  const [filter, setFilter]               = useState('All');
  const [data, setData]                   = useState<any>(null);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    setData(null);
    setFilter('All');
    fetch(`/api/bills/statebills?state=${selectedState}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) throw new Error(json.error);
        setData(json);
      })
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedState]);

  const stateInfo     = STATE_OPTIONS.find(s => s.code === selectedState)!;
  const bills         = data?.bills ?? [] as any[];
  const filteredBills = filter === 'All'
    ? bills
    : bills.filter((b: any) => detectBillTopic(b.title ?? '')?.label === filter);

  return (
    <div>
      {/* Header bar */}
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>State Legislature Bills</span>
        <span>{data?.session ? `Session: ${data.session}` : 'Most Recent Session'}</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* State selector */}
        <div className="mb-5">
          <div className="text-[8px] tracking-[3px] uppercase text-mid mb-2">Select state:</div>
          <div className="flex gap-2 flex-wrap">
            {STATE_OPTIONS.map(s => (
              <button
                key={s.code}
                onClick={() => setSelectedState(s.code)}
                className={`text-[11px] px-3 py-1.5 rounded border font-semibold transition-colors ${
                  selectedState === s.code
                    ? 'bg-brown text-gold border-brown'
                    : 'bg-white text-mid border-lb hover:border-amber/60 hover:text-ink'
                }`}
              >
                {s.emoji} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Sponsor funding note */}
        <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2 mb-5 text-[9px] leading-relaxed text-brown">
          <strong>About sponsor funding:</strong> State legislators rarely appear in federal FEC records unless
          they&apos;ve also run for Congress. For state-level campaign finance, check{' '}
          <a href={stateInfo.financeUrl} target="_blank" rel="noopener noreferrer" className="text-amber underline">
            {stateInfo.name}&apos;s official campaign finance database ↗
          </a>
        </div>

        {/* Topic filter chips */}
        <div className="mb-4">
          <div className="text-[8px] tracking-[3px] uppercase text-mid mb-2">Filter by topic:</div>
          <div className="flex gap-1.5 flex-wrap">
            {TOPIC_FILTERS.map(t => (
              <button
                key={t.label}
                onClick={() => setFilter(t.label)}
                className={`text-[9px] px-2.5 py-1 rounded-full border transition-colors ${
                  filter === t.label
                    ? 'bg-amber text-ink border-amber font-semibold'
                    : 'bg-white border-lb text-mid hover:border-amber/60'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl tracking-[3px] text-brown">
            {stateInfo.emoji} {stateInfo.name} — {filter === 'All' ? 'All Bills' : `${filter} Bills`}
          </h2>
          {!loading && (
            <span className="text-[8px] tracking-widest px-2 py-0.5 rounded-full bg-amber text-ink">
              {filteredBills.length}
            </span>
          )}
          <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-7 h-7 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
            <div className="font-display text-2xl text-amber">Loading {stateInfo.name} Bills…</div>
            <div className="text-[9px] tracking-widest uppercase text-mid mt-2">Fetching OpenStates data</div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="bg-red-50 border-2 border-ftdred p-4 my-4 text-red-800 text-sm">
            ⚠ Could not load bills: {error}
          </div>
        )}

        {/* Bills */}
        {!loading && !error && (
          filteredBills.length === 0 ? (
            <div className="text-center py-8 text-mid text-[10px] font-mono">
              No {filter === 'All' ? '' : `${filter} `}bills found.
              {filter !== 'All' && (
                <button onClick={() => setFilter('All')} className="block mx-auto mt-2 text-amber underline">
                  Show all bills
                </button>
              )}
            </div>
          ) : (
            filteredBills.map((bill: any, i: number) => (
              <BillCard key={i} bill={bill} />
            ))
          )
        )}

        {/* Footer */}
        {!loading && (
          <div className="text-center mt-6 space-y-2">
            <a href={`https://openstates.org/${selectedState.toLowerCase()}/bills/`}
              target="_blank" rel="noopener noreferrer"
              className="text-[9px] tracking-[3px] uppercase text-amber block">
              Browse all {stateInfo.name} bills on OpenStates ↗
            </a>
            <a href={stateInfo.financeUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-[9px] tracking-[3px] uppercase text-mid block">
              {stateInfo.name} campaign finance database ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
