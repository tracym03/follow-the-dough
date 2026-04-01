'use client';

import { useEffect, useState } from 'react';
import BillCard, { detectBillTopic } from './BillCard';
import PizzaChart from '@/components/candidates/PizzaChart';

// ── Real lobbying spend by industry, 2024 (Source: OpenSecrets.org) ──────────
const LOBBYING_OVERVIEW = [
  {
    label: 'Healthcare & Pharma', emoji: '🏥', value: 770_000_000, color: '#27ae60',
    note: 'Hospitals, pharma companies & insurance giants spent more lobbying Congress than any other sector. 2024 was driven by fights over drug pricing, Medicare negotiation, and ACA coverage.',
    topSpenders: [
      { name: 'PhRMA', amount: 30_200_000, what: 'Trade group for brand-name drug companies. Lobbied against Medicare drug price negotiation.' },
      { name: 'American Hospital Association', amount: 27_800_000, what: 'Lobbied against hospital price transparency rules and for increased Medicare reimbursements.' },
      { name: 'Blue Cross Blue Shield', amount: 25_100_000, what: 'Lobbied to protect insurance industry exemptions and against public option proposals.' },
      { name: 'American Medical Association', amount: 22_400_000, what: 'Lobbied on physician payment rates, prior authorization reform, and scope-of-practice rules.' },
      { name: 'Pfizer', amount: 14_300_000, what: 'Lobbied against drug price negotiation provisions in the Inflation Reduction Act.' },
    ],
  },
  {
    label: 'Finance & Wall Street', emoji: '🏦', value: 680_000_000, color: '#3498db',
    note: 'Banks, private equity & hedge funds lobbied heavily in 2024 against new SEC regulations and Basel III capital requirements.',
    topSpenders: [
      { name: 'American Bankers Association', amount: 16_400_000, what: 'Lobbied against Basel III bank capital requirements and consumer protection regulations.' },
      { name: 'Investment Company Institute', amount: 14_200_000, what: 'Mutual fund industry group. Lobbied against SEC disclosure rules and fiduciary standards.' },
      { name: 'JPMorgan Chase', amount: 12_100_000, what: 'Lobbied against Basel III capital rules, crypto regulations, and debit card fee caps.' },
      { name: 'Goldman Sachs', amount: 8_300_000, what: 'Lobbied on capital requirements, derivatives regulation, and SEC reporting rules.' },
      { name: 'BlackRock', amount: 7_100_000, what: 'Lobbied against ESG investment disclosure rules and on retirement account regulations.' },
    ],
  },
  {
    label: 'Tech & Communications', emoji: '💻', value: 420_000_000, color: '#9b59b6',
    note: 'Tech lobbying hit a record in 2024, driven by AI regulation debates, antitrust cases against Google & Amazon, and Section 230 battles.',
    topSpenders: [
      { name: 'Amazon', amount: 22_100_000, what: 'Lobbied against antitrust legislation, on AI policy, and for favorable cloud computing contracts.' },
      { name: 'Meta (Facebook)', amount: 19_900_000, what: 'Lobbied to protect Section 230 immunity, against children\'s online safety legislation, and on AI rules.' },
      { name: 'Google / Alphabet', amount: 18_400_000, what: 'Lobbied against antitrust enforcement, on AI regulation, and search engine competition rules.' },
      { name: 'Apple', amount: 12_200_000, what: 'Lobbied against app store competition rules and on data privacy legislation.' },
      { name: 'Microsoft', amount: 9_800_000, what: 'Lobbied on AI regulation, government cloud contracts, and cybersecurity legislation.' },
    ],
  },
  {
    label: 'Energy & Oil', emoji: '🛢️', value: 310_000_000, color: '#795548',
    note: 'Oil, gas & utilities lobby heavily against climate regulations. LNG export approvals and Inflation Reduction Act implementation drove major 2024 activity.',
    topSpenders: [
      { name: 'American Petroleum Institute', amount: 16_200_000, what: 'Oil industry\'s main trade group. Lobbied against EPA methane rules and for LNG export approvals.' },
      { name: 'ExxonMobil', amount: 14_100_000, what: 'Lobbied against carbon pricing, methane regulations, and for favorable tax treatment of oil extraction.' },
      { name: 'Chevron', amount: 9_400_000, what: 'Lobbied on offshore drilling permits, pipeline approvals, and against clean energy subsidies.' },
      { name: 'Southern Company', amount: 8_200_000, what: 'Utility company lobbying on coal plant regulations and natural gas pipeline approvals.' },
      { name: 'ConocoPhillips', amount: 6_100_000, what: 'Lobbied for Alaskan drilling rights (Willow Project) and against oil windfall profit taxes.' },
    ],
  },
  {
    label: 'Defense Contractors', emoji: '🛡️', value: 175_000_000, color: '#2c3e50',
    note: 'Defense firms lobby for Pentagon budget increases — often above what the military requests. Ukraine and Israel aid packages drove additional 2024 activity.',
    topSpenders: [
      { name: 'Lockheed Martin', amount: 15_200_000, what: 'Lobbied for F-35 program funding, missile defense contracts, and Ukraine weapons aid packages.' },
      { name: 'Boeing', amount: 13_900_000, what: 'Lobbied for defense contracts despite safety scandals, and for export licenses for fighter jets.' },
      { name: 'Raytheon / RTX', amount: 12_400_000, what: 'Lobbied for missile system contracts including Patriot batteries sent to Ukraine and Israel.' },
      { name: 'Northrop Grumman', amount: 11_100_000, what: 'Lobbied for B-21 bomber program and Space Force contracts.' },
      { name: 'General Dynamics', amount: 9_800_000, what: 'Lobbied for naval shipbuilding contracts and combat vehicle programs.' },
    ],
  },
  {
    label: 'Agriculture & Food', emoji: '🌾', value: 155_000_000, color: '#8d6e63',
    note: 'Agribusiness lobbied intensely around the 2024 Farm Bill reauthorization. Subsidies overwhelmingly benefit large industrial farms over small family farms.',
    topSpenders: [
      { name: 'American Farm Bureau Federation', amount: 8_100_000, what: 'Largest farm lobby. Pushed for expanded crop subsidies and against environmental farm regulations.' },
      { name: 'Cargill', amount: 5_900_000, what: 'World\'s largest private company. Lobbied on grain export rules, food labeling, and trade policy.' },
      { name: 'Archer Daniels Midland', amount: 4_800_000, what: 'Lobbied for ethanol mandates, commodity subsidies, and favorable trade agreements.' },
      { name: 'National Cattlemen\'s Beef Association', amount: 3_700_000, what: 'Lobbied against country-of-origin labeling and meat industry environmental regulations.' },
      { name: 'National Corn Growers Association', amount: 2_900_000, what: 'Lobbied for ethanol blending requirements and corn export subsidies.' },
    ],
  },
  {
    label: 'Ideology & Single Issue', emoji: '🌐', value: 140_000_000, color: '#1565c0',
    note: 'Includes foreign policy lobbying, gun rights organizations, and ideological groups. AIPAC alone spent over $100M across lobbying and electoral activity in 2024.',
    topSpenders: [
      { name: 'AIPAC (Pro-Israel)', amount: 8_400_000, what: 'Registered lobbying spend only — AIPAC\'s affiliated super PAC spent an additional $100M+ on 2024 congressional elections to defeat critics of Israel policy.' },
      { name: 'National Rifle Association', amount: 4_100_000, what: 'Lobbied against universal background checks, red flag laws, and assault weapons restrictions.' },
      { name: 'US Chamber of Commerce', amount: 3_800_000, what: 'Pro-business lobbying on labor rules, environmental regulations, and trade policy.' },
      { name: 'Heritage Action', amount: 2_200_000, what: 'Conservative policy group lobbying on budget cuts, immigration restriction, and DEI bans.' },
      { name: 'Planned Parenthood', amount: 1_900_000, what: 'Lobbied to protect reproductive healthcare funding and access after Roe v. Wade overturn.' },
    ],
  },
  {
    label: 'Labor & Unions', emoji: '👷', value: 55_000_000, color: '#2d6a4f',
    note: 'Labor unions lobby for worker protections, minimum wage, and benefits. Outspent by corporate interests by more than 12 to 1 in 2024.',
    topSpenders: [
      { name: 'AFL-CIO', amount: 5_200_000, what: 'Largest union federation. Lobbied for PRO Act (union organizing rights), minimum wage, and pension protections.' },
      { name: 'SEIU (Service Employees)', amount: 4_400_000, what: 'Represents healthcare, building services workers. Lobbied for $15 minimum wage and Medicaid expansion.' },
      { name: 'Teamsters', amount: 3_100_000, what: 'Represents truck drivers and warehouse workers. Lobbied on trucking regulations and gig worker classifications.' },
      { name: 'American Federation of Teachers', amount: 2_300_000, what: 'Lobbied against school voucher programs and for increased public education funding.' },
      { name: 'AFSCME (State/Municipal Employees)', amount: 2_100_000, what: 'Represents government workers. Lobbied against public service privatization and for pension protections.' },
    ],
  },
];

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
];

// ── Lobbying industry overview (always shown above bills) ─────────────────────
function LobbyingOverview() {
  const [open, setOpen]     = useState(false);
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
            <strong>What this shows:</strong> Total amount spent lobbying Congress in 2024, broken down by industry.
            This is <em>not</em> campaign donations — this is money paid to registered lobbyists to directly
            influence legislation. Source:{' '}
            <a href="https://www.opensecrets.org/federal-lobbying/overview" target="_blank"
              rel="noopener noreferrer" className="text-amber underline">OpenSecrets.org</a>
          </div>

          {/* Dough chart */}
          <PizzaChart
            title="2024 Federal Lobbying by Industry"
            slices={LOBBYING_OVERVIEW.map(i => ({ label: i.label, emoji: i.emoji, value: i.value, color: i.color }))}
          />

          {/* Bar breakdown with expandable top spenders */}
          <div className="mt-4 space-y-2">
            {LOBBYING_OVERVIEW.map((item, i) => {
              const pct = Math.round((item.value / total) * 100);
              const isActive = active === i;
              return (
                <div key={i}
                  className={`cursor-pointer rounded border transition-colors ${isActive ? 'border-amber bg-amber/5' : 'border-lb hover:border-amber/40'}`}
                  onClick={() => setActive(isActive ? null : i)}
                >
                  <div className="px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{item.emoji}</span>
                        <span className="text-[11px] font-semibold text-ink truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-mid">{pct}%</span>
                        <span className="font-display text-[14px] text-amber">{fmt(item.value)}</span>
                        <span className="text-[9px] text-mid">{isActive ? '▲' : '▼'}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-lb rounded mt-1.5">
                      <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                    </div>
                  </div>

                  {isActive && (
                    <div className="px-3 pb-3 border-t border-amber/20">
                      <p className="text-[9px] text-brown leading-relaxed mt-2 mb-3">{item.note}</p>
                      <div className="text-[8px] tracking-[2px] uppercase text-mid mb-2">Top 5 spenders — 2024</div>
                      {item.topSpenders.map((s, j) => {
                        const maxAmt = item.topSpenders[0].amount;
                        const sPct = Math.round((s.amount / maxAmt) * 100);
                        return (
                          <div key={j} className="mb-3 last:mb-0">
                            <div className="flex justify-between items-baseline gap-2">
                              <span className="text-[11px] font-semibold text-ink">{j + 1}. {s.name}</span>
                              <span className="font-display text-[13px] text-amber shrink-0">{fmt(s.amount)}</span>
                            </div>
                            <div className="h-1 bg-lb rounded my-1">
                              <div className="h-full rounded" style={{ width: `${sPct}%`, backgroundColor: item.color }} />
                            </div>
                            <p className="text-[8px] text-mid leading-relaxed">{s.what}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-3 text-[8px] text-mid pt-2 border-t border-lb">
            Data: OpenSecrets.org 2024 federal lobbying totals · Last updated: March 2026 ·{' '}
            <a href="https://www.opensecrets.org/federal-lobbying" target="_blank" rel="noopener noreferrer" className="text-amber">
              Full database ↗
            </a>
            {' '}· Labor unions are outspent by corporate interests by more than 12 to 1.
          </div>
        </div>
      )}
    </div>
  );
}

// ── Topic chip row ────────────────────────────────────────────────────────────
function TopicChips({ topicFilter, onChange }: { topicFilter: string; onChange: (t: string) => void }) {
  return (
    <div className="mb-4">
      <div className="text-[8px] tracking-[3px] uppercase text-mid mb-2">Filter by topic:</div>
      <div className="flex gap-1.5 flex-wrap">
        {TOPIC_FILTERS.map(t => (
          <button
            key={t.label}
            onClick={() => onChange(t.label)}
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
  );
}

// ── Filtered bill list ────────────────────────────────────────────────────────
function BillList({
  bills,
  topicFilter,
  onClearFilter,
  emptyNote,
}: {
  bills: any[];
  topicFilter: string;
  onClearFilter: () => void;
  emptyNote: string;
}) {
  const filtered = topicFilter === 'All'
    ? bills
    : bills.filter(b => detectBillTopic(b.title || '')?.label === topicFilter);

  if (filtered.length === 0) {
    return (
      <div className="text-center py-8 text-mid text-[10px] font-mono">
        No {topicFilter} bills found {emptyNote}.
        <button onClick={onClearFilter} className="block mx-auto mt-2 text-amber underline">
          Show all bills
        </button>
      </div>
    );
  }

  return (
    <>
      {filtered.map((bill: any, i: number) => (
        <BillCard key={i} bill={bill} />
      ))}
    </>
  );
}

// ── Main BillsTab component ───────────────────────────────────────────────────
export default function BillsTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  type TabMode = 'browse' | 'reps';
  const [activeTab, setActiveTab] = useState<TabMode>('browse');

  // ── Browse All (loads on mount) ──
  const [browseData, setBrowseData]       = useState<any>(null);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [browseError, setBrowseError]     = useState('');
  const [browseFilter, setBrowseFilter]   = useState('All');

  // ── From My Reps (lazy — loads on first tab click) ──
  const [repsData, setRepsData]       = useState<any>(null);
  const [repsLoading, setRepsLoading] = useState(false);
  const [repsError, setRepsError]     = useState('');
  const [repsFetched, setRepsFetched] = useState(false);
  const [repsFilter, setRepsFilter]   = useState('All');

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

  function handleRepsTab() {
    setActiveTab('reps');
    if (!repsFetched) {
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

  const browseBills: any[] = browseData?.bills || [];
  const repsBills:   any[] = repsData?.bills   || [];

  const browseCount = browseFilter === 'All'
    ? browseBills.length
    : browseBills.filter(b => detectBillTopic(b.title || '')?.label === browseFilter).length;

  const repsCount = repsFilter === 'All'
    ? repsBills.length
    : repsBills.filter(b => detectBillTopic(b.title || '')?.label === repsFilter).length;

  return (
    <div>
      {/* ── Header bar ── */}
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span>119th U.S. Congress · Federal Bills</span>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex border-b-2 border-lb bg-white sticky top-0 z-10">
        <button
          onClick={() => setActiveTab('browse')}
          className={`flex-1 py-3 text-[11px] font-semibold tracking-wide transition-colors ${
            activeTab === 'browse'
              ? 'border-b-2 border-amber text-amber bg-amber/5'
              : 'text-mid hover:text-brown'
          }`}
        >
          🗺️ Browse All
        </button>
        <button
          onClick={handleRepsTab}
          className={`flex-1 py-3 text-[11px] font-semibold tracking-wide transition-colors ${
            activeTab === 'reps'
              ? 'border-b-2 border-ftdgreen text-ftdgreen bg-ftdgreen/5'
              : 'text-mid hover:text-brown'
          }`}
        >
          📍 From My Reps
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* ── Lobbying overview — shown in both tabs ── */}
        <LobbyingOverview />

        {/* ══════════════════════════════════════════
            BROWSE ALL TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'browse' && (
          <>
            <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2.5 mb-4 text-[10px] leading-relaxed text-brown">
              <strong>Federal bills from across the country.</strong> Recent legislation from members of both
              parties in CA, TX, NY, FL, IL &amp; OH — 119th Congress. Tap any bill&apos;s
              💰 section to see which industries fund the sponsor.
            </div>

            {/* Loading */}
            {browseLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-7 h-7 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
                <div className="font-display text-2xl text-amber">Loading Bills…</div>
                <div className="text-[9px] tracking-widest uppercase text-mid mt-2">Fetching Congress.gov data</div>
              </div>
            )}

            {/* Error */}
            {browseError && !browseLoading && (
              <div className="bg-red-50 border-2 border-ftdred p-4 my-4 text-red-800 text-sm">
                ⚠ Could not load bills: {browseError}
              </div>
            )}

            {/* Bills */}
            {!browseLoading && !browseError && (
              <>
                <TopicChips topicFilter={browseFilter} onChange={setBrowseFilter} />

                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-xl tracking-[3px] text-brown">
                    {browseFilter === 'All' ? 'Federal Bills — All Topics' : `${browseFilter} Bills`}
                  </h2>
                  <span className="bg-amber text-ink text-[8px] tracking-widest px-2 py-0.5 rounded-full">
                    {browseCount}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
                </div>

                <BillList
                  bills={browseBills}
                  topicFilter={browseFilter}
                  onClearFilter={() => setBrowseFilter('All')}
                  emptyNote="in the national sample"
                />

                <div className="text-center mt-6">
                  <a href="https://www.congress.gov/browse/bills/119th-congress"
                    target="_blank" rel="noopener noreferrer"
                    className="text-[9px] tracking-[3px] uppercase text-amber">
                    Browse all 119th Congress bills on Congress.gov ↗
                  </a>
                </div>
              </>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════
            FROM MY REPS TAB
        ══════════════════════════════════════════ */}
        {activeTab === 'reps' && (
          <>
            {/* Loading */}
            {repsLoading && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-7 h-7 border-[3px] border-ftdgreen/20 border-t-ftdgreen rounded-full animate-spin mb-4" />
                <div className="font-display text-2xl text-ftdgreen">Loading Your Reps&apos; Bills…</div>
                <div className="text-[9px] tracking-widest uppercase text-mid mt-2">
                  Fetching bills from {stateName} members
                </div>
              </div>
            )}

            {repsError && !repsLoading && (
              <div className="bg-red-50 border-2 border-ftdred p-4 my-4 text-red-800 text-sm">
                ⚠ Could not load bills: {repsError}
              </div>
            )}

            {!repsLoading && !repsError && repsData && (
              <>
                <TopicChips topicFilter={repsFilter} onChange={setRepsFilter} />

                <div className="flex items-center gap-3 mb-4">
                  <h2 className="font-display text-xl tracking-[3px] text-brown">
                    {repsFilter === 'All' ? `Bills from ${stateName} Members` : `${repsFilter} Bills`}
                  </h2>
                  <span className="bg-ftdgreen text-white text-[8px] tracking-widest px-2 py-0.5 rounded-full">
                    {repsCount}
                  </span>
                  <div className="flex-1 h-px bg-gradient-to-r from-ftdgreen to-transparent" />
                </div>

                <BillList
                  bills={repsBills}
                  topicFilter={repsFilter}
                  onClearFilter={() => setRepsFilter('All')}
                  emptyNote={`from ${stateName} members in this session`}
                />

                <div className="text-center mt-6">
                  <a href={`https://www.congress.gov/members?q=%7B%22congress%22%3A%22119%22%2C%22state%22%3A%22${state}%22%7D`}
                    target="_blank" rel="noopener noreferrer"
                    className="text-[9px] tracking-[3px] uppercase text-ftdgreen">
                    All {stateName} members on Congress.gov ↗
                  </a>
                </div>
              </>
            )}
          </>
        )}

      </div>
    </div>
  );
}
