'use client';

import { useState } from 'react';
import { fmt, tc, partyFull, partyBorderClass, partyPillClass, officeStr } from '@/lib/utils';

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
  const { c, t, ind, employers, pac, bundlers } = data;
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

  return (
    <div className={`bg-white border border-lb border-l-4 ${borderCls} mb-3 hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#c8934a] transition-all`}>

      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex justify-between items-start gap-3">
        <div>
          <div className="font-display text-xl tracking-wide leading-none">{tc(c.name)}</div>
          <div className="text-[9px] tracking-widest uppercase text-mid mt-1">{officeStr(c.office, c.state, c.district)}</div>
        </div>
        <div className="text-right shrink-0">
          <span className={`inline-block text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full mb-1 ${pillCls}`}>{partyFull(party)}</span>
          <div className="font-display text-lg text-brown">{fmt(raised)}</div>
          <div className="text-[8px] tracking-widest uppercase text-mid">raised</div>
          {spent > 0 && <div className="text-[9px] text-mid">{fmt(spent)} spent</div>}
        </div>
      </div>

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
