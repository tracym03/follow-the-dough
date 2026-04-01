'use client';

import { useState } from 'react';
import { billStatusClass, fmt } from '@/lib/utils';
import PizzaChart from '@/components/candidates/PizzaChart';

function SponsorFundingSection({
  sponsorName, sponsorState, sponsorChamber, sponsorParty,
}: {
  sponsorName: string; sponsorState: string; sponsorChamber: string; sponsorParty: string;
}) {
  const [data, setData]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]     = useState(false);

  function toggle() {
    if (!open && !data && !loading) {
      setLoading(true);
      const params = new URLSearchParams({
        name: sponsorName,
        state: sponsorState,
        chamber: sponsorChamber,
      });
      fetch(`/api/sponsor?${params.toString()}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => setData({ found: false }))
        .finally(() => setLoading(false));
    }
    setOpen(v => !v);
  }

  const slices: any[] = data?.industrySlices || [];
  const raised: number = data?.raised ?? 0;
  const indivT: number = data?.indivT ?? 0;
  const pacT: number   = data?.pacT ?? 0;
  const indivPct = raised > 0 ? Math.round((indivT / raised) * 100) : 0;
  const pacPct   = raised > 0 ? Math.round((pacT   / raised) * 100) : 0;

  const partyColor = sponsorParty === 'D' ? 'text-ftdblue' : sponsorParty === 'R' ? 'text-ftdred' : 'text-mid';

  return (
    <div className="border-t border-lb">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${open ? 'bg-amber/10' : 'hover:bg-lb/50'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">💰</span>
          <div>
            <div className="text-[11px] font-semibold text-brown">Who funds the bill's sponsor?</div>
            <div className="text-[9px] text-mid">
              See which industries bankroll <span className={`font-medium ${partyColor}`}>{sponsorName}</span>
            </div>
          </div>
        </div>
        <span className="text-[10px] text-amber font-mono shrink-0">{open ? '▲ hide' : '▼ show'}</span>
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* Loading */}
          {loading && (
            <div className="flex items-center gap-2 py-3 text-[9px] text-mid">
              <div className="w-3 h-3 border-2 border-amber/20 border-t-amber rounded-full animate-spin shrink-0" />
              Looking up FEC filings for {sponsorName}...
            </div>
          )}

          {/* Not found */}
          {!loading && data && !data.found && (
            <div className="py-2 text-[9px] text-mid italic">
              No FEC filings found for {sponsorName}. They may not have raised federal campaign funds yet.{' '}
              <a
                href={`https://www.fec.gov/data/candidates/?q=${encodeURIComponent(sponsorName)}&office=${sponsorChamber}`}
                target="_blank" rel="noopener noreferrer"
                className="text-amber underline"
              >
                Search FEC.gov directly ↗
              </a>
            </div>
          )}

          {/* Funding data */}
          {!loading && data?.found && (
            <>
              {/* Summary row */}
              <div className="flex gap-2 flex-wrap mb-3 mt-1">
                {raised > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber/20 text-brown">
                    💵 {fmt(raised)} raised (2024 cycle)
                  </span>
                )}
                {indivPct > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    👤 {indivPct}% individual donors
                  </span>
                )}
                {pacPct > 0 && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-100 text-ftdpurple">
                    🏛 {pacPct}% PAC money
                  </span>
                )}
              </div>

              {/* Industry dough chart */}
              {slices.length >= 2 ? (
                <>
                  <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2 mb-3 text-[9px] text-brown leading-relaxed">
                    <strong>What this means:</strong> These are the industries that donate most to{' '}
                    {sponsorName}. When this sponsor introduces or votes on legislation, these are the
                    funders who have a financial interest in the outcome.
                  </div>
                  <PizzaChart title={`${sponsorName} — Top Industry Funders`} slices={slices} />
                </>
              ) : (
                <p className="text-[9px] text-mid italic">
                  Not enough itemized PAC data to identify industries yet.{' '}
                  <a
                    href={`https://www.opensecrets.org/members-of-congress/summary?cid=&cycle=2024`}
                    target="_blank" rel="noopener noreferrer" className="text-amber underline"
                  >
                    Check OpenSecrets ↗
                  </a>
                </p>
              )}

              <div className="text-[8px] text-mid mt-2 pt-2 border-t border-lb flex gap-3 flex-wrap">
                <a
                  href={`https://www.fec.gov/data/candidate/${data.candidateId}/?cycle=2024&tab=receipts`}
                  target="_blank" rel="noopener noreferrer" className="text-amber"
                >
                  Full FEC record ↗
                </a>
                <a
                  href={`https://www.opensecrets.org/members-of-congress/summary?name=${encodeURIComponent(sponsorName)}`}
                  target="_blank" rel="noopener noreferrer" className="text-amber"
                >
                  OpenSecrets profile ↗
                </a>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function buildCongressUrl(type: string, number: string, congress: number): string {
  const typeMap: Record<string, string> = {
    'HR': 'house-bill',
    'S': 'senate-bill',
    'HJRES': 'house-joint-resolution',
    'SJRES': 'senate-joint-resolution',
    'HCONRES': 'house-concurrent-resolution',
    'SCONRES': 'senate-concurrent-resolution',
    'HRES': 'house-simple-resolution',
    'SRES': 'senate-simple-resolution',
  };
  const typeSlug = typeMap[type?.toUpperCase()] || 'house-bill';
  return `https://www.congress.gov/bill/${congress}th-congress/${typeSlug}/${number}`;
}

export default function BillCard({ bill }: { bill: any }) {
  const num = `${bill.type || ''} ${bill.number || ''}`.trim() || 'Bill';
  const congress = bill.congress || 119;
  const url = buildCongressUrl(bill.type || 'HR', bill.number || '', congress);
  const action = bill.latestAction || '';
  const actionDate = bill.actionDate || '';
  const statusCls = billStatusClass(action);

  return (
    <div className="bg-white border border-lb border-l-4 border-l-ftdgreen mb-3 hover:-translate-x-px hover:-translate-y-px hover:shadow-[3px_3px_0_#2d6a4f] transition-all">
      <div className="px-4 py-3">
        <div className="font-display text-[12px] tracking-[3px] text-amber mb-1">{num} · {congress}th Congress</div>
        <div className="text-[12px] font-medium leading-snug mb-1">
          {bill.title?.substring(0, 130)}{(bill.title?.length || 0) > 130 ? '…' : ''}
        </div>
        {bill.sponsor && (
          <div className="text-[9px] text-mid mt-1">
            Sponsored by <strong className="text-ink">{bill.sponsor}</strong>
          </div>
        )}
        {action && (
          <span className={`inline-flex items-center text-[8px] tracking-[1.5px] uppercase px-2 py-0.5 rounded-full mt-2 ${statusCls}`}>
            {actionDate ? `${actionDate} — ` : ''}{action.substring(0, 90)}{action.length > 90 ? '…' : ''}
          </span>
        )}
      </div>

      {bill.sponsorName && (
        <SponsorFundingSection
          sponsorName={bill.sponsorName}
          sponsorState={bill.sponsorState || ''}
          sponsorChamber={bill.sponsorChamber || 'H'}
          sponsorParty={bill.sponsorParty || ''}
        />
      )}

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase text-ftdgreen border-b border-dashed border-ftdgreen opacity-70 hover:opacity-100 mx-4 mb-3 mt-2"
      >
        ↗ Full bill on Congress.gov
      </a>
    </div>
  );
}
