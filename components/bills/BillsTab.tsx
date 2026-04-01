'use client';

import { useEffect, useState } from 'react';
import BillCard, { detectBillTopic } from './BillCard';
import PizzaChart from '@/components/candidates/PizzaChart';

// ── Real lobbying spend by industry, 2024 (Source: OpenSecrets.org) ──────────
// opensecrets.org/federal-lobbying/overview
// 2024 was a federal election year — lobbying spend reached a record ~$4.5B total
const LOBBYING_OVERVIEW = [
  { label: 'Healthcare & Pharma',    emoji: '🏥', value: 770_000_000, color: '#27ae60',
    note: 'Hospitals, pharma companies & insurance giants spent more lobbying Congress than any other sector. 2024 was driven by fights over drug pricing, Medicare negotiation, and ACA coverage. Major spenders: PhRMA, American Hospital Association, Blue Cross Blue Shield.' },
  { label: 'Finance & Wall Street',  emoji: '🏦', value: 680_000_000, color: '#3498db',
    note: 'Banks, private equity & hedge funds lobbied heavily in 2024 against new SEC regulations and Basel III capital requirements. Major spenders: American Bankers Association, Goldman Sachs, JPMorgan Chase, BlackRock.' },
  { label: 'Tech & Communications',  emoji: '💻', value: 420_000_000, color: '#9b59b6',
    note: 'Tech lobbying hit a record in 2024, driven by AI regulation debates, antitrust cases against Google & Amazon, and Section 230 battles. Major spenders: Amazon, Google/Alphabet, Meta, Apple, Microsoft.' },
  { label: 'Energy & Oil',           emoji: '🛢️', value: 310_000_000, color: '#795548',
    note: 'Oil, gas & utilities lobby heavily against climate regulations and for favorable tax treatment. LNG export fights and Inflation Reduction Act implementation drove 2024 activity. Major spenders: ExxonMobil, Chevron, American Petroleum Institute.' },
  { label: 'Defense Contractors',    emoji: '🛡️', value: 175_000_000, color: '#2c3e50',
    note: 'Defense firms lobby for Pentagon budget increases — often above what the military requests. Ukraine and Israel aid packages drove additional 2024 lobbying activity. Major spenders: Lockheed Martin, Boeing, Raytheon/RTX, Northrop Grumman.' },
  { label: 'Agriculture & Food',     emoji: '🌾', value: 155_000_000, color: '#8d6e63',
    note: 'Agribusiness lobbied intensely in 2024 around the Farm Bill reauthorization. Subsidies mostly benefit large industrial farms over small family farms. Major spenders: American Farm Bureau, Cargill, Archer Daniels Midland.' },
  { label: 'Ideology & Single Issue',emoji: '🌐', value: 140_000_000, color: '#1565c0',
    note: 'Includes foreign policy lobbying (AIPAC spent $25M+ in 2024 elections alone, plus registered lobbying), gun rights (NRA), anti-abortion and pro-choice groups, and other ideological organizations.' },
  { label: 'Labor & Unions',         emoji: '👷', value: 55_000_000,  color: '#2d6a4f',
    note: 'Labor unions lobby for worker protections, minimum wage increases, and unionization rights. Despite representing millions of workers, unions are outspent by corporate interests by more than 12 to 1 in 2024.' },
];

// ── Topic filter chips ────────────────────────────────────────────────────────
const TOPIC_FILTERS = [
  { label: 'All',              emoji: '📋' },
  { label: 'Healthcare & Pharma', emoji: '🏥' },
  { label: 'Defense & Military',  emoji: '🛡️' },
  { label: 'Finance & Banking',   emoji: '🏦' },
  { label: 'Energy & Climate',    emoji: '🛢️' },
  { label: 'Technology',          emoji: '💻' },
  { label: 'Housing & Real Estate', emoji: '🏘️' },
  { label: 'Education',           emoji: '🎓' },
  { label: 'Agriculture',         emoji: '🌾' },
  { label: 'Immigration',         emoji: '🌎' },
];

function LobbyingOverview() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const total = LOBBYING_OVERVIEW.reduce((s, i) => s + i.value, 0);
  const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(0)}M`;

  return (
    <div className="bg-white border border-amber/50 border-l-4 border-l-amber mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${open ? 'bg-amber/10' : 'hover:bg-lb/50'}`}
      >
        <div>
          <div className="font-display text-[15px] tracking-wider text-brown">
            🏛️ Who Lobbies Congress? — 2024 Totals
          </div>
          <div className="text-[9px] text-mid mt-0.5">
            Federal law requires all lobbyists to register. Total spend: {fmt(total)} in 2024 — tap to see the breakdown
          </div>
        </div>
        <span className="text-[10px] text-amber font-mono shrink-0 ml-2">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2 mb-4 text-[10px] leading-relaxed text-brown">
            <strong>What this shows:</strong> Total amount spent lobbying Congress in 2023, broken down by industry.
            This is <em>not</em> campaign donations — this is money paid to registered lobbyists to directly
            influence legislation. Source:{' '}
            <a href="https://www.opensecrets.org/federal-lobbying/overview" target="_blank"
              rel="noopener noreferrer" className="text-amber underline">OpenSecrets.org</a>
          </div>

          {/* Dough chart */}
          <PizzaChart
            title="2023 Federal Lobbying by Industry"
            slices={LOBBYING_OVERVIEW.map(i => ({ label: i.label, emoji: i.emoji, value: i.value, color: i.color }))}
          />

          {/* Bar breakdown */}
          <div className="mt-4 space-y-2">
            {LOBBYING_OVERVIEW.map((item, i) => {
              const pct = Math.round((item.value / total) * 100);
              const isActive = active === i;
              return (
                <div key={i}
                  className={`cursor-pointer rounded border px-3 py-2 transition-colors ${isActive ? 'border-amber bg-amber/5' : 'border-lb hover:border-amber/40'}`}
                  onClick={() => setActive(isActive ? null : i)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base shrink-0">{item.emoji}</span>
                      <span className="text-[11px] font-semibold text-ink truncate">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] text-mid">{pct}%</span>
                      <span className="font-display text-[14px] text-amber">{fmt(item.value)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-lb rounded mt-1.5">
                    <div className="h-full rounded transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                  </div>
                  {isActive && (
                    <p className="text-[9px] text-brown leading-relaxed mt-2 pt-2 border-t border-lb">
                      {item.note}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[8px] text-mid pt-2 border-t border-lb">
            Data: OpenSecrets.org 2024 federal lobbying totals ·{' '}
            <a href="https://www.opensecrets.org/federal-lobbying" target="_blank" rel="noopener noreferrer" className="text-amber">
              Full database ↗
            </a>
            {' '}· Note: Labor unions are outspent by corporate interests by more than 10 to 1.
          </div>
        </div>
      )}
    </div>
  );
}

export default function BillsTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [topicFilter, setTopicFilter] = useState('All');

  useEffect(() => {
    async function load() {
      try {
        const res  = await fetch(`/api/bills?state=${state}&stateName=${encodeURIComponent(stateName)}`);
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [state, stateName]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-7 h-7 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
      <div className="font-display text-2xl text-amber">Loading Bills...</div>
      <div className="text-[9px] tracking-widest uppercase text-mid mt-2">Fetching Congress.gov data...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-2 border-ftdred p-4 my-4 text-red-800 text-sm">
      ⚠ Could not load bills: {error}
    </div>
  );

  const allBills: any[] = data?.bills || [];

  // Filter bills by selected topic
  const filteredBills = topicFilter === 'All'
    ? allBills
    : allBills.filter(bill => {
        const topic = detectBillTopic(bill.title || '');
        return topic?.label === topicFilter;
      });

  return (
    <div>
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span>{allBills.length} bills · 119th Congress</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* Overall lobbying overview — always visible */}
        <LobbyingOverview />

        {/* Topic filter chips */}
        <div className="mb-4">
          <div className="text-[8px] tracking-[3px] uppercase text-mid mb-2">Filter by topic:</div>
          <div className="flex gap-1.5 flex-wrap">
            {TOPIC_FILTERS.map(t => (
              <button
                key={t.label}
                onClick={() => setTopicFilter(t.label)}
                className={`text-[9px] px-2.5 py-1 rounded-full border transition-colors ${
                  topicFilter === t.label
                    ? 'bg-amber text-ink border-amber font-semibold'
                    : 'bg-white border-lb text-mid hover:border-amber/60'
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bills section header */}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl tracking-[3px] text-brown">
            {topicFilter === 'All' ? `Bills from ${stateName} Members` : `${topicFilter} Bills`}
          </h2>
          <span className="bg-ftdgreen text-white text-[8px] tracking-widest px-2 py-0.5 rounded-full">
            {filteredBills.length}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-ftdgreen to-transparent" />
        </div>

        {filteredBills.length === 0 ? (
          <div className="text-center py-8 text-mid text-[10px] font-mono">
            No {topicFilter} bills found from {stateName} members in this cycle.
            <button onClick={() => setTopicFilter('All')} className="block mx-auto mt-2 text-amber underline">
              Show all bills
            </button>
          </div>
        ) : (
          filteredBills.map((bill: any, i: number) => (
            <BillCard key={i} bill={bill} />
          ))
        )}

        <div className="text-center mt-4">
          <a href={`https://www.congress.gov/members?q=%7B%22congress%22%3A%22119%22%2C%22state%22%3A%22${state}%22%7D`}
            target="_blank" rel="noopener noreferrer"
            className="text-[9px] tracking-[3px] uppercase text-ftdgreen">
            All {stateName} members on Congress.gov ↗
          </a>
        </div>
      </div>
    </div>
  );
}
