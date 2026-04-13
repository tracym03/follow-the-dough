'use client';

import { useEffect, useState } from 'react';
import BillCard, { detectBillTopic } from '@/components/bills/BillCard';
import PizzaChart from '@/components/candidates/PizzaChart';
import { fmt } from '@/lib/utils';

// Per-state campaign finance search URLs
const STATE_FINANCE_SEARCH: Record<string, (name: string) => string> = {
  CA: (n) => `https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=${encodeURIComponent(n)}`,
  NY: (n) => `https://publicreporting.elections.ny.gov/Candidate/Index?candidateName=${encodeURIComponent(n)}`,
  TX: ()  => `https://www.ethics.state.tx.us/search/cf/CandidateSearch.php`,
  FL: (n) => `https://efts.dos.state.fl.us/public/index.html#/searchresults?searchtype=candidates&query=${encodeURIComponent(n)}`,
};

const STATE_FINANCE_LABELS: Record<string, string> = {
  CA: 'Cal-Access (CA campaign finance)',
  NY: 'NY Board of Elections',
  TX: 'Texas Ethics Commission',
  FL: 'Florida Division of Elections',
};

function LegFundingSection({ name, state, chamber }: { name: string; state: string; chamber: 'upper' | 'lower' }) {
  const [open, setOpen]       = useState(false);
  const [data, setData]       = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fecChamber = chamber === 'upper' ? 'S' : 'H';
  const financeUrl = STATE_FINANCE_SEARCH[state]?.(name);
  const financeLabel = STATE_FINANCE_LABELS[state] || 'State campaign finance';

  function toggle() {
    if (!open && !data && !loading) {
      setLoading(true);
      fetch(`/api/sponsor?name=${encodeURIComponent(name)}&state=${state}&chamber=${fecChamber}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => setData({ found: false }))
        .finally(() => setLoading(false));
    }
    setOpen(v => !v);
  }

  const slices: any[] = data?.industrySlices || [];
  const raised: number = data?.raised ?? 0;
  const indivPct = raised > 0 ? Math.round(((data?.indivT ?? 0) / raised) * 100) : 0;
  const pacPct   = raised > 0 ? Math.round(((data?.pacT   ?? 0) / raised) * 100) : 0;

  return (
    <div className="border-t border-lb mt-3">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-0 py-2 text-left transition-colors ${open ? 'text-amber' : 'text-mid hover:text-brown'}`}
      >
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span className="text-[13px] font-semibold">Who funds them?</span>
        </div>
        <span className="text-[11px] font-mono">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="pt-2">
          {loading && (
            <div className="flex items-center gap-2 py-2 text-[13px] text-mid">
              <div className="w-3 h-3 border-2 border-amber/20 border-t-amber rounded-full animate-spin shrink-0" />
              Looking up FEC filings…
            </div>
          )}

          {!loading && data?.found && (
            <>
              <div className="flex gap-2 flex-wrap mb-3">
                {raised > 0 && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-amber/20 text-brown">
                    💵 {fmt(raised)} raised
                  </span>
                )}
                {indivPct > 0 && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    👤 {indivPct}% individual
                  </span>
                )}
                {pacPct > 0 && (
                  <span className="text-[12px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                    🏛 {pacPct}% PAC
                  </span>
                )}
              </div>
              {slices.length >= 2 ? (
                <PizzaChart title={`${name} — Industry Funders`} slices={slices} />
              ) : (
                <p className="text-[12px] text-mid italic mb-2">Not enough PAC data to break down by industry.</p>
              )}
              <div className="flex gap-3 flex-wrap mt-2 pt-2 border-t border-lb text-[12px]">
                <a href={`https://www.fec.gov/data/candidate/${data.candidateId}/?cycle=2024&tab=receipts`}
                  target="_blank" rel="noopener noreferrer" className="text-amber">FEC record ↗</a>
                <a href={`https://www.opensecrets.org/members-of-congress/summary?name=${encodeURIComponent(name)}`}
                  target="_blank" rel="noopener noreferrer" className="text-amber">OpenSecrets ↗</a>
              </div>
            </>
          )}

          {!loading && data && !data.found && (
            <div className="text-[12px] text-mid leading-relaxed">
              <p className="mb-2">
                No federal FEC record found — state legislators file with their state, not the FEC.
              </p>
              <div className="flex flex-col gap-1.5">
                {financeUrl && (
                  <a href={financeUrl} target="_blank" rel="noopener noreferrer"
                    className="text-amber underline">
                    💰 Search {financeLabel} ↗
                  </a>
                )}
                <a href={`https://www.opensecrets.org/states/legislators.php?state=${state}`}
                  target="_blank" rel="noopener noreferrer" className="text-amber underline">
                  💰 OpenSecrets — {state} state legislators ↗
                </a>
                <a href={`https://ballotpedia.org/${name.replace(/ /g, '_')}`}
                  target="_blank" rel="noopener noreferrer" className="text-mid underline">
                  Ballotpedia profile ↗
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const STATE_OPTIONS = [
  { code: 'CA', name: 'California', emoji: '🌴', financeUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/' },
  { code: 'NY', name: 'New York',   emoji: '🗽', financeUrl: 'https://publicreporting.elections.ny.gov/' },
  { code: 'TX', name: 'Texas',      emoji: '⭐', financeUrl: 'https://www.ethics.state.tx.us/search/cf/CandidateSearch.php' },
  { code: 'FL', name: 'Florida',    emoji: '🌊', financeUrl: 'https://dos.myflorida.com/elections/candidates-committees/' },
];

const SUPPORTED_STATES = STATE_OPTIONS.map(s => s.code);

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

export default function StateTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  // Governor data
  const [govData, setGovData]       = useState<any>(null);
  const [govLoading, setGovLoading] = useState(true);

  // State legislators
  const [legData, setLegData]       = useState<any>(null);
  const [legLoading, setLegLoading] = useState(true);
  const [legError, setLegError]     = useState('');

  // State bills
  const userStateSupported = SUPPORTED_STATES.includes(state);
  const defaultBillState   = userStateSupported ? state : 'CA';
  const [selectedState, setSelectedState] = useState(defaultBillState);
  const [filter, setFilter]               = useState('All');
  const [billsData, setBillsData]         = useState<any>(null);
  const [billsLoading, setBillsLoading]   = useState(true);
  const [billsError, setBillsError]       = useState('');

  useEffect(() => {
    fetch(`/api/stateraces?state=${state}`)
      .then(r => r.json())
      .then(setGovData)
      .catch(() => null)
      .finally(() => setGovLoading(false));

    fetch(`/api/statelegislators?zip=${zip}`)
      .then(r => r.json())
      .then(json => { if (json.error) throw new Error(json.error); setLegData(json); })
      .catch((e: any) => setLegError(e.message))
      .finally(() => setLegLoading(false));
  }, [state, zip]);

  useEffect(() => {
    setBillsLoading(true);
    setBillsError('');
    setBillsData(null);
    setFilter('All');
    fetch(`/api/bills/statebills?state=${selectedState}`)
      .then(r => r.json())
      .then(json => { if (json.error) throw new Error(json.error); setBillsData(json); })
      .catch((e: any) => setBillsError(e.message))
      .finally(() => setBillsLoading(false));
  }, [selectedState]);

  const stateInfo     = STATE_OPTIONS.find(s => s.code === selectedState) ?? STATE_OPTIONS[0];
  const bills         = billsData?.bills ?? [] as any[];
  const filteredBills = filter === 'All'
    ? bills
    : bills.filter((b: any) => detectBillTopic(b.title ?? '')?.label === filter);

  return (
    <div>
      {/* Meta bar */}
      <div className="bg-brown text-gold text-[12px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span>State Government</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">

        {/* ── TIER 1: Governor Race ── */}
        <TierLabel num={1} label="Governor Race · 2026" />

        {govLoading ? (
          <div className="py-6 text-center">
            <div className="w-6 h-6 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mx-auto mb-2" />
            <div className="text-[12px] text-mid tracking-widest uppercase">Loading state races…</div>
          </div>
        ) : !govData?.hasGovRace ? (
          <div className="bg-lb border border-amber/30 rounded px-4 py-3 mb-4 text-[13px] text-mid">
            No governor race in {stateName} in 2026.{' '}
            <a href={`https://www.opensecrets.org/races/summary?cycle=2026&id=${state}G`}
              target="_blank" rel="noopener noreferrer"
              className="text-amber underline">Check OpenSecrets for {stateName} state races ↗</a>
          </div>
        ) : (
          <FlowCard
            title={`${stateName} Governor · 2026`}
            sub={govData.govCandidates?.some((c: any) => c.note?.includes('Incumbent')) ? 'Incumbent running' : 'Open race'}
            icon="🏛️"
            accentColor="#2d6a4f"
            defaultOpen={true}
          >
            <div className="px-4 py-3">
              {govData.govCandidates?.length > 0 ? (
                <>
                  <div className="text-[11px] tracking-[3px] uppercase text-mid mb-3">🗳️ Known 2026 Candidates</div>
                  {govData.govCandidates.map((c: any, i: number) => {
                    const droppedOut = c.note === 'Dropped out';
                    return (
                    <div key={i} className={`py-2 border-b border-dashed border-lb last:border-0 ${droppedOut ? 'opacity-50' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className={`text-[15px] font-bold ${droppedOut ? 'line-through text-mid' : 'text-ink'}`}>{c.name}</div>
                          {c.title && <div className="text-[12px] text-mid mt-0.5">{c.title}</div>}
                          {c.raisedFmt && !droppedOut && (
                            <div className="text-[12px] font-display text-amber mt-1">
                              💰 {c.raisedFmt} raised
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {c.party && (
                            <span className={`text-[11px] tracking-widest uppercase px-2 py-0.5 rounded-full
                              ${c.party.includes('Dem') ? 'bg-blue-100 text-ftdblue' :
                                c.party.includes('Rep') ? 'bg-red-100 text-ftdred' : 'bg-lb text-mid'}`}>
                              {c.party}
                            </span>
                          )}
                          {c.note && <span className={`text-[11px] italic ${droppedOut ? 'text-ftdred' : 'text-amber'}`}>{c.note}</span>}
                        </div>
                      </div>
                    </div>);
                  })}
                  <div className="mt-3 pt-2 border-t border-lb flex flex-col gap-1.5">
                    <div className="text-[11px] text-mid">Follow the money for this race:</div>
                    {govData.financeDb && (
                      <a href={govData.financeDb.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[12px] text-ftdgreen border border-ftdgreen rounded px-2 py-1 w-fit hover:bg-green-50">
                        ↗ {govData.financeDb.name} — {stateName} official campaign finance
                      </a>
                    )}
                    <a href={`https://www.opensecrets.org/races/summary?cycle=2026&id=${state}G`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-[12px] text-amber border border-amber rounded px-2 py-1 w-fit hover:bg-yellow-50">
                      ↗ OpenSecrets · {stateName} Governor 2026
                    </a>
                  </div>
                  {govData.dataNote && <div className="text-[11px] text-mid italic mt-2">{govData.dataNote}</div>}
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded p-3 text-[13px] leading-relaxed text-brown">
                  <p className="mb-2 text-mid">Governor race data coming soon. Check these sources:</p>
                  <div className="flex flex-col gap-2">
                    <a href={`https://www.opensecrets.org/races/summary?cycle=2026&id=${state}G`}
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-amber border border-amber rounded px-2 py-1 w-fit hover:bg-yellow-50">
                      ↗ {stateName} Governor race on OpenSecrets
                    </a>
                    {govData.financeDb && (
                      <a href={govData.financeDb.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1 text-ftdgreen border border-ftdgreen rounded px-2 py-1 w-fit hover:bg-green-50">
                        ↗ {govData.financeDb.name}
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </FlowCard>
        )}

        {/* Senate race notice */}
        {govData?.hasSenateRace && (
          <div className="bg-lb border border-amber/40 px-4 py-3 mb-3 text-[13px] text-brown">
            <strong className="font-display text-[15px] tracking-wider block mb-1">
              📋 {stateName} has a U.S. Senate seat up in 2026
            </strong>
            <p className="text-mid mb-2">Senate candidates appear in the Federal tab once they register with the FEC.</p>
            <a href={`https://www.fec.gov/data/candidates/?state=${state}&office=S&election_year=2026`}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] tracking-widest uppercase text-amber border-b border-dashed border-amber">
              ↗ All registered {stateName} Senate candidates on FEC.gov
            </a>
          </div>
        )}

        <FlowArrow />

        {/* ── TIER 2: State Legislature ── */}
        <TierLabel num={2} label="State Legislature" />

        {legLoading ? (
          <div className="py-6 text-center">
            <div className="w-6 h-6 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mx-auto mb-2" />
            <div className="text-[12px] text-mid tracking-widest uppercase">Finding your state legislators…</div>
          </div>
        ) : legError ? (
          <div className="bg-lb border border-amber/30 rounded px-4 py-3 mb-4 text-[13px] text-mid">
            Could not load legislators.{' '}
            <a href={`https://openstates.org/${state.toLowerCase()}/legislators/`}
              target="_blank" rel="noopener noreferrer" className="text-amber underline">
              Find them on OpenStates ↗
            </a>
          </div>
        ) : legData?.legislators?.length > 0 ? (
          <>
            {/* Group by chamber */}
            {(['upper', 'lower'] as const).map(chamber => {
              const members = legData.legislators.filter((l: any) => l.chamber === chamber);
              if (members.length === 0) return null;
              const chamberLabel = chamber === 'upper' ? 'State Senate' : 'State Assembly / House';
              const chamberIcon  = chamber === 'upper' ? '🏛️' : '🏛️';
              return (
                <div key={chamber} className="mb-3">
                  <div className="text-[11px] tracking-[3px] uppercase text-mid mb-2">
                    {chamberLabel} · Your District
                  </div>
                  {members.map((leg: any, i: number) => (
                    <FlowCard
                      key={i}
                      title={leg.title || (chamber === 'upper' ? 'State Senator' : 'State Assembly Member')}
                      sub={`${leg.name} · ${leg.party}${leg.district ? ` · District ${leg.district}` : ''}`}
                      icon={chamberIcon}
                      accentColor="#1565c0"
                    >
                      <div className="px-4 py-3 text-[13px] text-brown leading-relaxed">
                        <div className="flex items-start gap-3 mb-3">
                          {leg.image && (
                            <img src={leg.image} alt={leg.name}
                              className="w-14 h-14 object-cover rounded border border-lb shrink-0" />
                          )}
                          <div>
                            <div className="font-semibold text-[15px] text-ink">{leg.name}</div>
                            <div className="text-[12px] text-mid">{leg.party}</div>
                            {leg.district && <div className="text-[12px] text-mid">District {leg.district}</div>}
                            {leg.email && (
                              <a href={`mailto:${leg.email}`} className="text-[12px] text-amber underline block mt-0.5">
                                {leg.email}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {leg.url && (
                            <a href={leg.url} target="_blank" rel="noopener noreferrer"
                              className="text-[12px] px-2 py-1 border border-amber text-amber rounded hover:bg-amber/10">
                              ↗ OpenStates profile
                            </a>
                          )}
                          <a href={`https://ballotpedia.org/${leg.name.replace(/ /g, '_')}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-[12px] px-2 py-1 border border-lb text-mid rounded hover:bg-lb">
                            ↗ Ballotpedia
                          </a>
                        </div>
                        <LegFundingSection name={leg.name} state={state} chamber={chamber} />
                      </div>
                    </FlowCard>
                  ))}
                </div>
              );
            })}
          </>
        ) : (
          <div className="bg-lb border border-amber/30 rounded px-4 py-3 mb-4 text-[13px] text-mid">
            No legislators found for this ZIP.{' '}
            <a href={`https://openstates.org/${state.toLowerCase()}/legislators/`}
              target="_blank" rel="noopener noreferrer" className="text-amber underline">
              Search on OpenStates ↗
            </a>
          </div>
        )}

        <FlowArrow />

        {/* ── TIER 3: State Bills ── */}
        <TierLabel num={3} label="State Bills" />

        {/* Not yet available for unsupported states */}
        {!userStateSupported && (
          <div className="bg-lb border border-amber/50 border-l-4 border-l-amber px-4 py-3 mb-4 text-[13px] leading-relaxed text-brown">
            <div className="font-semibold text-[14px] mb-1">📜 State bills for {stateName} aren&apos;t live yet</div>
            <p className="text-mid mb-2">
              We have live tracking for CA, NY, TX, and FL. Browse those below, or view {stateName}&apos;s bills directly:
            </p>
            <div className="flex gap-2 flex-wrap">
              <a href={`https://openstates.org/${state.toLowerCase()}/bills/`}
                target="_blank" rel="noopener noreferrer"
                className="text-[13px] px-2 py-1 border border-amber text-amber rounded hover:bg-amber/10">
                ↗ OpenStates — {stateName} Bills
              </a>
              <a href="https://www.ncsl.org/research/about-state-legislatures/legislative-websites.aspx"
                target="_blank" rel="noopener noreferrer"
                className="text-[13px] px-2 py-1 border border-mid text-mid rounded hover:bg-lb">
                ↗ {stateName} Legislature Website
              </a>
            </div>
          </div>
        )}

        {/* State selector */}
        <div className="mb-4">
          <div className="text-[12px] tracking-[3px] uppercase text-mid mb-2">Select state:</div>
          <div className="flex gap-2 flex-wrap">
            {STATE_OPTIONS.map(s => (
              <button
                key={s.code}
                onClick={() => setSelectedState(s.code)}
                className={`text-[13px] px-3 py-1.5 rounded border font-semibold transition-colors ${
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
        <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2 mb-4 text-[13px] leading-relaxed text-brown">
          <strong>About sponsor funding:</strong> For state-level campaign finance, check{' '}
          <a href={stateInfo.financeUrl} target="_blank" rel="noopener noreferrer" className="text-amber underline">
            {stateInfo.name}&apos;s official campaign finance database ↗
          </a>
        </div>

        {/* Topic filter chips */}
        <div className="mb-4">
          <div className="text-[12px] tracking-[3px] uppercase text-mid mb-2">Filter by topic:</div>
          <div className="flex gap-1.5 flex-wrap">
            {TOPIC_FILTERS.map(t => (
              <button
                key={t.label}
                onClick={() => setFilter(t.label)}
                className={`text-[13px] px-2.5 py-1 rounded-full border transition-colors ${
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
          <h2 className="font-display text-[17px] tracking-[3px] text-brown">
            {stateInfo.emoji} {stateInfo.name} — {filter === 'All' ? 'All Bills' : `${filter} Bills`}
          </h2>
          {!billsLoading && (
            <span className="text-[12px] tracking-widest px-2 py-0.5 rounded-full bg-amber text-ink">
              {filteredBills.length}
            </span>
          )}
          <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
        </div>

        {billsLoading ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="w-6 h-6 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-3" />
            <div className="font-display text-xl text-amber">Loading {stateInfo.name} Bills…</div>
          </div>
        ) : billsError ? (
          <div className="bg-red-50 border border-ftdred p-3 text-red-800 text-[13px] mb-4">⚠ {billsError}</div>
        ) : filteredBills.length === 0 ? (
          <div className="text-center py-8 text-mid text-[13px] font-mono">
            No {filter === 'All' ? '' : `${filter} `}bills found.
            {filter !== 'All' && (
              <button onClick={() => setFilter('All')} className="block mx-auto mt-2 text-amber underline">
                Show all bills
              </button>
            )}
          </div>
        ) : (
          filteredBills.map((bill: any, i: number) => <BillCard key={i} bill={bill} />)
        )}

        {!billsLoading && (
          <div className="text-center mt-6 space-y-2">
            <a href={`https://openstates.org/${selectedState.toLowerCase()}/bills/`}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] tracking-[3px] uppercase text-amber block">
              Browse all {stateInfo.name} bills on OpenStates ↗
            </a>
            <a href={stateInfo.financeUrl}
              target="_blank" rel="noopener noreferrer"
              className="text-[12px] tracking-[3px] uppercase text-mid block">
              {stateInfo.name} campaign finance database ↗
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
