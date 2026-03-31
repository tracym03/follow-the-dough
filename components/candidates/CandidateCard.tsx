'use client';

import { useState } from 'react';
import { fmt, tc, partyFull, partyBorderClass, partyPillClass, officeStr } from '@/lib/utils';

function getPacType(profile: any): { label: string; cls: string } {
  if (!profile) return { label: 'Committee', cls: 'bg-lb text-mid' };
  const comm = profile.committee_type || '';
  const desig = profile.designation || '';
  const org = profile.organization_type || '';
  if (comm === 'O' || desig === 'U') return { label: 'Super PAC ⚡', cls: 'bg-pink-100 text-pink-800' };
  if (desig === 'L') return { label: 'Leadership PAC', cls: 'bg-yellow-100 text-yellow-800' };
  if (org === 'L' || comm === 'W') return { label: 'Labor / Trade PAC', cls: 'bg-green-100 text-green-800' };
  if (org === 'C' || org === 'M' || org === 'T') return { label: 'Corporate PAC', cls: 'bg-purple-100 text-purple-800' };
  if (comm === 'Y') return { label: 'Party Committee', cls: 'bg-blue-100 text-ftdblue' };
  return { label: 'Political Committee', cls: 'bg-lb text-mid' };
}

function getRealFunder(p: any): { funder: string; pacAlias: string | null; hasCorp: boolean } {
  const connOrg = p.profile?.connected_organization_name;
  const pacName = tc(p.contributor_name || 'Unknown Committee');
  if (connOrg && connOrg.trim() !== '') return { funder: tc(connOrg), pacAlias: pacName, hasCorp: true };
  return { funder: pacName, pacAlias: null, hasCorp: false };
}

export default function CandidateCard({ data }: { data: any }) {
  const [showMore, setShowMore] = useState(false);
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

      {/* Individual / PAC split pills */}
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
          <span className="text-[8px] tracking-[3px] uppercase text-mid">✦ Individual donors (FEC Schedule A)</span>
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">$200+ = public</span>
        </div>
        {top5.length === 0 && <p className="text-[9px] text-mid uppercase tracking-wide opacity-70">No itemized donations on file</p>}
        {top5.map((d: any, i: number) => {
          const amt = d.contribution_receipt_amount;
          const pct = Math.min(100, Math.round((amt / maxD) * 100));
          const name = tc(d.contributor_name || 'Unknown');
          const emp = d.contributor_employer ? tc(d.contributor_employer) : '';
          const loc = [d.contributor_city ? tc(d.contributor_city) : '', d.contributor_state || ''].filter(Boolean).join(', ');
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
              return (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <div className="font-display text-xs text-lb w-4 text-center shrink-0">{5 + i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{tc(d.contributor_name || 'Unknown')}</div>
                    {d.contributor_employer && <div className="text-[9px] text-mid truncate">{tc(d.contributor_employer)}</div>}
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
              {showMore ? '▲ Fewer donors' : `▼ More donors (+${more.length})`}
            </button>
          </>
        )}
      </div>

      {/* Top employers */}
      {employers?.length > 0 && (
        <div className="border-t border-lb px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[8px] tracking-[3px] uppercase text-mid">🏢 Top Employers Funding This Campaign</span>
          </div>
          {employers.slice(0, 6).map((e: any, i: number) => {
            const pct = Math.min(100, Math.round(((e.total || 0) / (employers[0]?.total || 1)) * 100));
            return (
              <div key={i} className="bg-purple-50 border border-purple-200 border-l-2 border-l-ftdpurple px-2 py-2 mb-1.5 rounded-sm">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="text-[11px] font-bold">{tc(e.employer || 'Unknown')}</div>
                    {e.count && <div className="text-[8px] text-mid">{e.count} donor{e.count !== 1 ? 's' : ''}</div>}
                  </div>
                  <div className="font-display text-[15px] text-ftdpurple">${((e.total || 0) / 1000).toFixed(0)}K</div>
                </div>
                <div className="h-[3px] bg-purple-200 rounded">
                  <div className="h-full bg-ftdpurple rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          <div className="text-[8px] text-mid mt-1">Employees donated as individuals — public record under federal law.</div>
        </div>
      )}

      {/* PAC money */}
      {pac?.length > 0 && (
        <div className="border-t border-lb px-4 py-3">
          <div className="text-[8px] tracking-[3px] uppercase text-mid mb-2">🏛 PAC & Committee Contributions</div>
          {pac.slice(0, 5).map((p: any, i: number) => {
            const amt = p.total || p.contribution_receipt_amount || 0;
            const pct = Math.min(100, Math.round((amt / (pac[0]?.contribution_receipt_amount || 1)) * 100));
            const { funder, pacAlias, hasCorp } = getRealFunder(p);
            const ptype = getPacType(p.profile);
            const st = p.profile?.state || '';
            return (
              <div key={i} className="bg-purple-50 border border-purple-200 border-l-[3px] border-l-ftdpurple px-3 py-2 mb-2 rounded-sm">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <div>
                    <div className={`text-[11px] ${hasCorp ? 'font-bold' : ''}`}>{hasCorp ? '🏢 ' : ''}{funder}</div>
                    {hasCorp && pacAlias && <div className="text-[9px] text-mid mt-0.5">via PAC: {pacAlias}</div>}
                  </div>
                  <div className="font-display text-[17px] text-ftdpurple shrink-0">{fmt(amt)}</div>
                </div>
                <div className="flex gap-1 flex-wrap mb-1">
                  <span className={`text-[8px] px-2 py-0.5 rounded-full ${ptype.cls}`}>{ptype.label}</span>
                  {st && <span className="text-[8px] px-2 py-0.5 rounded-full bg-lb text-mid">📍 {st}</span>}
                </div>
                {p.pacDonors?.length > 0 && (
                  <div className="mt-1 pt-1 border-t border-purple-200">
                    <div className="text-[8px] tracking-widest uppercase text-ftdpurple mb-1">💼 This PAC&apos;s top funders:</div>
                    {p.pacDonors.map((d: any, j: number) => (
                      <div key={j} className="flex justify-between items-baseline gap-2 mb-1">
                        <div>
                          <div className="text-[10px] font-bold">{d.isOrg ? '🏛 ' : '👤 '}{tc(d.name)}</div>
                          {!d.isOrg && d.employer && <div className="text-[8px] text-mid">{tc(d.employer)}</div>}
                        </div>
                        <span className="font-display text-[13px] text-ftdpurple whitespace-nowrap">{fmt(d.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="h-[3px] bg-purple-200 rounded mt-1">
                  <div className="h-full bg-ftdpurple rounded" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ActBlue / WinRed bundler note */}
      {bundlers?.length > 0 && (
        <div className="px-4 pb-3 text-[9px] text-mid border-t border-lb pt-2">
          ℹ️ Also received bundled small donations via {bundlers.map((b: any) => tc(b.contributor_name)).join(' / ')} — these are aggregated small donors, not single-source money.
        </div>
      )}

      {/* FEC link */}
      <a
        href={`https://www.fec.gov/data/candidate/${cid}/?cycle=2024&tab=receipts`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase text-amber border-b border-dashed border-amber opacity-70 hover:opacity-100 mx-4 mb-3"
      >
        ↗ All donations on FEC.gov
      </a>
    </div>
  );
}
