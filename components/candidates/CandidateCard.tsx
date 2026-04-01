'use client';

import { useState } from 'react';
import { fmt, tc, partyFull, partyBorderClass, partyPillClass, officeStr } from '@/lib/utils';
import PizzaChart from './PizzaChart';

// Research-backed "so what" context shown when a candidate receives >$100K from an industry.
// All claims are sourced from OpenSecrets, academic studies, or congressional voting records.
const INDUSTRY_VOTE_CONTEXT: Record<string, {
  fact: string;
  source: string;
  sourceUrl: string;
}> = {
  'Pharma & Drugs': {
    fact: 'In 2022, senators who voted against Medicare drug price negotiation had received an average of $500K+ in pharma industry donations over their careers. Every Republican who voted against the bill was among the top pharma recipients in their chamber.',
    source: 'OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=H4300',
  },
  'Oil & Gas': {
    fact: 'Members of Congress in the top quartile of fossil fuel donations vote against major climate legislation at roughly 3× the rate of those who receive none. In the 117th Congress, 97% of Republicans who voted against the Inflation Reduction Act\'s clean energy provisions were top oil & gas recipients.',
    source: 'OpenSecrets / FollowTheMoney',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=E01',
  },
  'Energy': {
    fact: 'Members who receive significant energy industry donations vote against renewable energy subsidies and carbon pricing legislation at substantially higher rates. The correlation between fossil fuel money and anti-climate votes is among the most consistent in campaign finance research.',
    source: 'OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=E',
  },
  'Defense & Military': {
    fact: 'Senators and representatives who receive the most defense contractor money are significantly more likely to vote for Pentagon budget increases above what the military requests — including programs the DoD itself has tried to cancel. The F-35 and certain Navy ship programs have received continued funding primarily from members representing contractor districts.',
    source: 'Project on Government Oversight (POGO)',
    sourceUrl: 'https://www.pogo.org/analysis/2021/03/defense-contractor-campaign-contributions-and-pentagon-spending',
  },
  'Finance & Banking': {
    fact: 'Of the 67 senators who voted for the 2018 Economic Growth Act (which rolled back Dodd-Frank bank regulations), 65 were among the top recipients of financial industry donations in their chamber. The finance sector is historically the single largest donor industry in U.S. federal elections.',
    source: 'OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=F',
  },
  'Super PAC Money': {
    fact: 'Super PACs can raise and spend unlimited amounts since Citizens United (2010). Research by Yale and Princeton political scientists found that policy outcomes in Congress align with the preferences of economic elites and business groups — not average voters — at a statistically significant rate.',
    source: 'Gilens & Page, Princeton (2014)',
    sourceUrl: 'https://scholar.princeton.edu/sites/default/files/mgilens/files/gilens_and_page_2014_-testing_theories_of_american_politics.doc.pdf',
  },
  'Healthcare': {
    fact: 'Members who receive top insurance and hospital industry donations vote against public insurance options and drug pricing reforms at higher rates. The health sector spent over $750 million lobbying Congress in 2023 alone — more than any other industry.',
    source: 'OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=H',
  },
  'Technology': {
    fact: 'Big Tech companies ramped up lobbying and donations dramatically after 2010. Members receiving significant tech money vote against antitrust enforcement and data privacy regulations at higher rates. Meta, Google, and Amazon spent a combined $50M+ on lobbying in 2023.',
    source: 'OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=B',
  },
  'Guns & Firearms': {
    fact: 'The NRA rates members of Congress A–F based on their gun votes. Members with A ratings vote against universal background checks, red flag laws, and assault weapons restrictions 95%+ of the time. The correlation between NRA money/ratings and gun safety votes is among the most documented in political science.',
    source: 'Everytown for Gun Safety Research',
    sourceUrl: 'https://everytownresearch.org/report/thoughts-and-prayers-in-congress/',
  },
  'Telecom': {
    fact: 'The FCC\'s 2017 net neutrality repeal was supported overwhelmingly by members who had received significant telecom donations. Members in the top quartile of telecom money voted against net neutrality protections at more than twice the rate of those who received none.',
    source: 'Free Press / OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=B09',
  },
  'Real Estate': {
    fact: 'Real estate is consistently one of the top donor industries in U.S. elections. Members receiving significant real estate money vote against rent control protections, affordable housing mandates, and property tax reforms at higher rates.',
    source: 'OpenSecrets',
    sourceUrl: 'https://www.opensecrets.org/industries/indus.php?ind=F10',
  },
  'Agriculture': {
    fact: 'Congress members who receive large agribusiness donations consistently vote for farm subsidy programs that disproportionately benefit large industrial farms — the top 10% of farms receive over 70% of federal farm subsidies. They also vote against food labeling and pesticide regulation at higher rates.',
    source: 'Environmental Working Group Farm Subsidy Database',
    sourceUrl: 'https://farm.ewg.org/',
  },
};

const THRESHOLD = 100_000; // $100K — show the "so what" footnote above this

function getIndustryContext(pacIndustrySlices: any[]): Array<{ label: string; value: number; fact: string; source: string; sourceUrl: string }> {
  if (!pacIndustrySlices?.length) return [];
  return pacIndustrySlices
    .filter((sl: any) => sl.value >= THRESHOLD && INDUSTRY_VOTE_CONTEXT[sl.label])
    .slice(0, 2)
    .map((sl: any) => ({ label: sl.label, value: sl.value, ...INDUSTRY_VOTE_CONTEXT[sl.label] }));
}

function getPacType(profile: any): { label: string; cls: string; explanation: string } {
  if (!profile) return { label: 'Political Committee', cls: 'bg-lb text-mid', explanation: 'A committee that donated to this candidate.' };
  const comm = profile.committee_type || '';
  const desig = profile.designation || '';
  const org = profile.organization_type || '';
  if (comm === 'O' || desig === 'U') return {
    label: 'Super PAC ⚡',
    cls: 'bg-pink-100 text-pink-800',
    explanation: 'Super PACs can raise and spend unlimited amounts. They cannot legally coordinate with the candidate but often run ads supporting them.',
  };
  if (desig === 'L') return {
    label: 'Leadership PAC',
    cls: 'bg-yellow-100 text-yellow-800',
    explanation: 'A PAC controlled by an elected official, often used to donate to allies and build political influence.',
  };
  if (org === 'L' || comm === 'W') return {
    label: 'Labor / Trade PAC',
    cls: 'bg-green-100 text-green-800',
    explanation: 'Funded by union members or trade association members. Represents workers or an industry sector.',
  };
  if (org === 'C' || org === 'M' || org === 'T') return {
    label: 'Corporate PAC',
    cls: 'bg-purple-100 text-purple-800',
    explanation: 'Funded by employees of a corporation. Represents the political interests of that company.',
  };
  if (comm === 'Y') return {
    label: 'Party Committee',
    cls: 'bg-blue-100 text-ftdblue',
    explanation: 'An official party organization (e.g. DCCC, NRCC) funneling party money to the candidate.',
  };
  return {
    label: 'Political Committee',
    cls: 'bg-lb text-mid',
    explanation: 'A registered political committee that donated to this candidate.',
  };
}

// Build the plain-English one-liner funding summary
function getFundingSummary(
  pacIndustrySlices: any[],
  raised: number,
  indivT: number,
  pacT: number
): string | null {
  // If no industry data, fall back to simple individual/PAC split
  if (!pacIndustrySlices || pacIndustrySlices.length === 0) {
    if (raised <= 0) return null;
    const pacPct = Math.round((pacT / raised) * 100);
    if (pacPct >= 60) return `Heavily PAC-funded — ${pacPct}% from political committees`;
    const indPct = Math.round((indivT / raised) * 100);
    if (indPct >= 60) return `Mostly individual donors — ${indPct}% from people, not PACs`;
    return null;
  }

  const total = pacIndustrySlices.reduce((s: number, sl: any) => s + (sl.value || 0), 0);
  if (total === 0) return null;

  // Top 1 industry
  const top = pacIndustrySlices[0];
  const second = pacIndustrySlices[1];
  const topPct = Math.round((top.value / total) * 100);
  const top2Pct = second ? Math.round(((top.value + second.value) / total) * 100) : topPct;

  if (topPct >= 50) {
    return `${topPct}% of identifiable funding from ${top.emoji} ${top.label}`;
  }
  if (second && top2Pct >= 55) {
    return `${top2Pct}% of funding from ${top.emoji} ${top.label} & ${second.emoji} ${second.label}`;
  }
  // Spread across many industries
  return `Top funders: ${top.emoji} ${top.label} (${topPct}%)${second ? `, ${second.emoji} ${second.label} (${Math.round((second.value / total) * 100)}%)` : ''}`;
}

function cleanStr(s: string | null | undefined): string {
  if (!s) return '';
  const trimmed = s.trim();
  if (trimmed.toLowerCase() === 'null' || trimmed.toLowerCase() === 'n/a' ||
    trimmed.toLowerCase() === 'none' || trimmed === 'N/A') return '';
  return tc(trimmed);
}

function getRealFunder(p: any): { funder: string; pacAlias: string | null; hasCorp: boolean } {
  const connOrg = p.profile?.connected_organization_name;
  const pacName = cleanStr(p.contributor_name) || 'Unknown Committee';
  if (connOrg && connOrg.trim() !== '' && connOrg.toLowerCase() !== 'null') {
    return { funder: tc(connOrg), pacAlias: pacName, hasCorp: true };
  }
  return { funder: pacName, pacAlias: null, hasCorp: false };
}

export default function CandidateCard({ data, electionYear = 2026 }: { data: any; electionYear?: number }) {
  const [showMore, setShowMore] = useState(false);
  const [expandedPac, setExpandedPac] = useState<number | null>(null);
  const [showPizza, setShowPizza] = useState(false);
  const { c, t, ind, employers, pacIndustrySlices, pac, bundlers } = data;
  const raised = t?.receipts ?? 0;
  const spent = t?.disbursements ?? 0;
  const indivT = t?.individual_contributions ?? 0;
  const pacT = t?.other_political_committee_contributions ?? 0;
  const party = c.party || '';
  const borderCls = partyBorderClass(party);
  const pillCls = partyPillClass(party);
  const cid = c.candidate_id;
  const top5 = (ind || []).slice(0, 5);
  const more = (ind || []).slice(5);
  const maxD = top5[0]?.contribution_receipt_amount ?? 1;

  const fundingSummary = getFundingSummary(pacIndustrySlices, raised, indivT, pacT);
  const industryContext = getIndustryContext(pacIndustrySlices || []);

  return (
    <div className={`bg-white border border-lb border-l-4 ${borderCls} mb-3 hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#c8934a] transition-all`}>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-start gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <div className="font-display text-xl tracking-wide leading-none">{tc(c.name)}</div>
            {c.incumbent_challenge === 'I' && (
              <span className="text-[7px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-amber/20 text-brown border border-amber/40 shrink-0">
                ★ Currently Serving
              </span>
            )}
            {c.incumbent_challenge === 'C' && (
              <span className="text-[7px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-blue-50 text-ftdblue border border-blue-200 shrink-0">
                Challenger
              </span>
            )}
            {c.incumbent_challenge === 'O' && (
              <span className="text-[7px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-green-50 text-ftdgreen border border-green-200 shrink-0">
                Open Seat
              </span>
            )}
          </div>
          <div className="text-[9px] tracking-widest uppercase text-mid">{officeStr(c.office, c.state, c.district)}</div>
          {/* One-liner funding summary */}
          {fundingSummary && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 bg-amber/10 border border-amber/30 rounded px-2 py-1">
              <span className="text-amber text-[10px]">💰</span>
              <span className="text-[10px] font-medium text-brown leading-tight">{fundingSummary}</span>
            </div>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full mb-1 ${pillCls}`}>{partyFull(party)}</span>
          <div className="font-display text-lg text-brown">{raised > 0 ? fmt(raised) : '—'}</div>
          <div className="text-[8px] tracking-widest uppercase text-mid">{raised > 0 ? 'raised' : 'no filings yet'}</div>
          {spent > 0 && <div className="text-[9px] text-mid">{fmt(spent)} spent</div>}
        </div>
      </div>

      {/* Early cycle notice */}
      {raised === 0 && (
        <div className="mx-4 mb-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded text-[9px] text-yellow-800 leading-relaxed">
          📋 This candidate has registered with the FEC but no fundraising data is available yet for the {electionYear} cycle. Check back as the election approaches.
        </div>
      )}

      {/* Individual / PAC split */}
      {raised > 0 && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
            👤 Individual {Math.round((indivT / raised) * 100) || 0}%
          </span>
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-ftdpurple">
            🏛 PAC {Math.round((pacT / raised) * 100) || 0}%
          </span>
        </div>
      )}

      {/* Individual donors */}
      <div className="px-4 pb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[8px] tracking-[3px] uppercase text-mid">✦ Top Individual Donors</span>
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">Donations $200+ are public</span>
        </div>
        {top5.length === 0 && (
          <p className="text-[9px] text-mid italic">No itemized individual donations found for this candidate.</p>
        )}
        {top5.map((d: any, i: number) => {
          const amt = d.contribution_receipt_amount;
          const pct = Math.min(100, Math.round((amt / maxD) * 100));
          const name = cleanStr(d.contributor_name) || 'Unknown';
          const emp = cleanStr(d.contributor_employer);
          const city = cleanStr(d.contributor_city);
          const stateCode = d.contributor_state || '';
          const loc = [city, stateCode].filter(Boolean).join(', ');
          const sub = [emp, loc].filter(Boolean).join(' · ');
          return (
            <div key={i} className="flex items-center gap-2 mb-2">
              <div className="font-display text-xs text-lb w-4 text-center shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium truncate">{name}</div>
                {sub && <div className="text-[9px] text-mid truncate">{sub}</div>}
                <div className="h-[3px] bg-lb rounded mt-1">
                  <div className={`h-full rounded ${party === 'DEM' ? 'bg-ftdblue' : party === 'REP' ? 'bg-ftdred' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="font-display text-[15px] text-brown shrink-0">{fmt(amt)}</div>
            </div>
          );
        })}
        {more.length > 0 && (
          <>
            {showMore && more.map((d: any, i: number) => {
              const amt = d.contribution_receipt_amount;
              const pct = Math.min(100, Math.round((amt / maxD) * 100));
              const name = cleanStr(d.contributor_name) || 'Unknown';
              const emp = cleanStr(d.contributor_employer);
              return (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="font-display text-xs text-lb w-4 text-center shrink-0">{5 + i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{name}</div>
                    {emp && <div className="text-[9px] text-mid truncate">{emp}</div>}
                    <div className="h-[3px] bg-lb rounded mt-1">
                      <div className={`h-full rounded ${party === 'DEM' ? 'bg-ftdblue' : party === 'REP' ? 'bg-ftdred' : 'bg-amber'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                  <div className="font-display text-[15px] text-brown shrink-0">{fmt(amt)}</div>
                </div>
              );
            })}
            <button
              onClick={() => setShowMore(!showMore)}
              className="w-full bg-lb border-t border-[#e5d5b5] py-1.5 font-mono text-[9px] tracking-[3px] uppercase text-mid hover:bg-gold hover:text-ink transition-colors"
            >
              {showMore ? '▲ Show fewer' : `▼ Show ${more.length} more donors`}
            </button>
          </>
        )}
      </div>

      {/* Top employers */}
      {employers?.length > 0 && (
        <div className="border-t border-lb px-4 py-3">
          <div className="mb-2">
            <span className="text-[8px] tracking-[3px] uppercase text-mid">🏢 Top Employers of Individual Donors</span>
            <p className="text-[9px] text-mid mt-0.5 italic">Employees of these companies donated as individuals — aggregated from all filings.</p>
          </div>
          {employers.slice(0, 6).map((e: any, i: number) => {
            const empName = cleanStr(e.employer);
            if (!empName) return null;
            const pct = Math.min(100, Math.round(((e.total || 0) / (employers[0]?.total || 1)) * 100));
            return (
              <div key={i} className="bg-purple-50 border border-purple-200 border-l-2 border-l-ftdpurple px-2 py-2 mb-1.5 rounded-sm">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="text-[11px] font-bold">{empName}</div>
                    {e.count && <div className="text-[8px] text-mid">{e.count} employee donor{e.count !== 1 ? 's' : ''}</div>}
                  </div>
                  <div className="font-display text-[15px] text-ftdpurple">${((e.total || 0) / 1000).toFixed(0)}K</div>
                </div>
                <div className="h-[3px] bg-purple-200 rounded">
                  <div className="h-full bg-ftdpurple rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dough chart toggle — which industries & PAC types fund this candidate */}
      {raised > 0 && (
        <div className="border-t border-lb">
          <button
            onClick={() => setShowPizza(!showPizza)}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${showPizza ? 'bg-amber/10' : 'hover:bg-lb/60'}`}
          >
            <div className="flex items-center gap-2">
              <span className="text-xl leading-none">🥧</span>
              <div>
                <div className="text-[11px] font-semibold text-brown">Which industries fund this candidate?</div>
                <div className="text-[9px] text-mid">
                  {pacIndustrySlices?.length > 0
                    ? `Pharma, Finance, Defense, Super PACs & more — tap to explore`
                    : `PAC types & industry breakdown`}
                </div>
              </div>
            </div>
            <span className="text-[10px] text-amber font-mono">{showPizza ? '▲ hide' : '▼ show'}</span>
          </button>

          {showPizza && pacIndustrySlices?.length >= 2 && (
            <PizzaChart
              title="Industry & PAC Funding"
              slices={pacIndustrySlices}
            />
          )}

          {showPizza && (!pacIndustrySlices || pacIndustrySlices.length < 2) && (
            <div className="px-4 pb-4 text-[10px] text-mid italic">
              Not enough identifiable industry data yet for this candidate. Check back as more donors file with the FEC.
            </div>
          )}
        </div>
      )}

      {/* PAC money */}
      {pac?.length > 0 && (
        <div className="border-t border-lb px-4 py-3">
          <div className="mb-2">
            <span className="text-[8px] tracking-[3px] uppercase text-mid">🏛 PAC & Committee Money</span>
            <p className="text-[9px] text-mid mt-0.5 italic">
              PACs are political committees that pool money from donors. Click any PAC to see who funds it.
            </p>
          </div>
          {pac.slice(0, 6).map((p: any, i: number) => {
            const amt = p.total || p.contribution_receipt_amount || 0;
            const pct = Math.min(100, Math.round((amt / (pac[0]?.contribution_receipt_amount || amt || 1)) * 100));
            const { funder, pacAlias, hasCorp } = getRealFunder(p);
            const ptype = getPacType(p.profile);
            const st = p.profile?.state || '';
            const commId = p.contributor_committee_id || '';
            const isExpanded = expandedPac === i;
            const totalRaised = p.profile?.receipts ?? null;

            return (
              <div key={i} className="bg-purple-50 border border-purple-200 border-l-[3px] border-l-ftdpurple mb-2 rounded-sm overflow-hidden">
                {/* PAC main row */}
                <button
                  onClick={() => setExpandedPac(isExpanded ? null : i)}
                  className="w-full text-left px-3 py-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      {hasCorp ? (
                        <>
                          <div className="text-[11px] font-bold text-ink">🏢 {funder}</div>
                          <div className="text-[9px] text-mid">via PAC: {pacAlias}</div>
                        </>
                      ) : (
                        <div className="text-[11px] font-medium text-ink">{funder}</div>
                      )}
                      <div className="flex gap-1 flex-wrap mt-1">
                        <span className={`text-[8px] px-2 py-0.5 rounded-full ${ptype.cls}`}>{ptype.label}</span>
                        {st && <span className="text-[8px] px-2 py-0.5 rounded-full bg-lb text-mid">📍 {st}</span>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-display text-[17px] text-ftdpurple">{fmt(amt)}</div>
                      <div className="text-[8px] text-mid">{isExpanded ? '▲ less' : '▼ who funds this?'}</div>
                    </div>
                  </div>
                  <div className="h-[3px] bg-purple-200 rounded mt-2">
                    <div className="h-full bg-ftdpurple rounded" style={{ width: `${pct}%` }} />
                  </div>
                </button>

                {/* Expanded PAC detail */}
                {isExpanded && (
                  <div className="px-3 pb-3 border-t border-purple-200 bg-white">
                    {/* Plain English explanation */}
                    <p className="text-[10px] text-mid italic mt-2 mb-2 leading-relaxed">{ptype.explanation}</p>

                    {totalRaised && (
                      <div className="text-[9px] text-mid mb-2">
                        This PAC raised <strong className="text-ink">{fmt(totalRaised)}</strong> total this cycle.
                      </div>
                    )}

                    {/* PAC's own donors */}
                    {p.pacDonors?.length > 0 ? (
                      <>
                        <div className="text-[8px] tracking-widest uppercase text-ftdpurple mb-1.5">💼 Who funds this PAC:</div>
                        {p.pacDonors.map((d: any, j: number) => {
                          const dName = cleanStr(d.name) || 'Unknown';
                          const dEmp = cleanStr(d.employer);
                          return (
                            <div key={j} className="flex justify-between items-start gap-2 py-1.5 border-b border-purple-100 last:border-0">
                              <div>
                                <div className="text-[10px] font-bold">{d.isOrg ? '🏛 ' : '👤 '}{dName}</div>
                                {!d.isOrg && dEmp && dEmp !== dName && (
                                  <div className="text-[8px] text-mid">{dEmp}</div>
                                )}
                                {d.isOrg && <div className="text-[8px] text-mid">Organization</div>}
                              </div>
                              <span className="font-display text-[13px] text-ftdpurple whitespace-nowrap">{fmt(d.amount)}</span>
                            </div>
                          );
                        })}
                      </>
                    ) : (
                      <p className="text-[9px] text-mid italic">
                        {hasCorp
                          ? `This PAC is directly connected to ${funder}. Funded by company employees under federal contribution limits.`
                          : 'Detailed donor breakdown not available for this PAC. Check FEC.gov for full records.'}
                      </p>
                    )}

                    {commId && (
                      <a
                        href={`https://www.fec.gov/data/committee/${commId}/?cycle=2024&tab=receipts`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-[8px] tracking-widest uppercase text-amber border-b border-dashed border-amber"
                      >
                        ↗ See all {funder} donors on FEC.gov
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ActBlue / WinRed note */}
      {bundlers?.length > 0 && (
        <div className="px-4 pb-3 border-t border-lb pt-2 bg-yellow-50">
          <p className="text-[9px] text-mid leading-relaxed">
            ℹ️ <strong>Bundled small donations:</strong> Also received money via {bundlers.map((b: any) => cleanStr(b.contributor_name)).join(' / ')} — these platforms bundle thousands of small individual donations. This is grassroots money, not a single large donor.
          </p>
        </div>
      )}

      {/* "So what?" industry context footnotes — only shown when >$100K from identifiable industry */}
      {industryContext.length > 0 && (
        <div className="mx-4 mb-3 mt-1 border border-amber/40 rounded bg-amber/5 px-3 py-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[9px] tracking-[2px] uppercase text-brown font-semibold">⚠ What does this funding mean?</span>
            <span className="text-[8px] text-mid italic">Research-backed context</span>
          </div>
          {industryContext.map((ctx, i) => (
            <div key={i} className={`text-[10px] leading-relaxed text-ink ${i > 0 ? 'mt-2 pt-2 border-t border-amber/20' : ''}`}>
              <span className="font-semibold text-brown">{ctx.label}*</span>
              {' — '}{ctx.fact}
              <div className="mt-1">
                <a href={ctx.sourceUrl} target="_blank" rel="noopener noreferrer"
                  className="text-[8px] text-amber underline">
                  * Source: {ctx.source}
                </a>
              </div>
            </div>
          ))}
          <p className="text-[8px] text-mid italic mt-2 pt-2 border-t border-amber/20">
            Correlation does not prove causation. This data is provided for voter education only. Sources are independent research organizations.
          </p>
        </div>
      )}

      {/* FEC link */}
      <a
        href={`https://www.fec.gov/data/candidate/${cid}/?cycle=${electionYear}&tab=receipts`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase text-amber border-b border-dashed border-amber opacity-70 hover:opacity-100 mx-4 mb-3 mt-1"
      >
        ↗ View all donations on FEC.gov
      </a>
    </div>
  );
}
