'use client';

import { useEffect, useState } from 'react';
import { billStatusClass } from '@/lib/utils';

function LobbySection({ billTitle, billNumber }: { billTitle: string; billNumber: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const keywords = `${billNumber} ${billTitle}`.substring(0, 80);
        const res = await fetch(`/api/lobbying?keywords=${encodeURIComponent(keywords)}`);
        const json = await res.json();
        setData(json);
      } catch {
        setData({ found: false });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [billTitle, billNumber]);

  if (loading) return (
    <div className="flex items-center gap-2 py-2 text-[9px] text-mid font-mono">
      <div className="w-3 h-3 border-2 border-amber/20 border-t-amber rounded-full animate-spin shrink-0" />
      Searching federal lobbying registry...
    </div>
  );

  if (!data?.found || !data?.lobbyists?.length) return (
    <p className="text-[9px] text-mid italic py-1">
      No lobbying filings found{data?.keywords ? ` for "${data.keywords.substring(0, 40)}"` : ''} in LDA database.
    </p>
  );

  return (
    <div>
      <div className="text-[8px] tracking-widest uppercase text-mid mb-2">📋 LDA Filings — {data.keywords?.substring(0, 40)}</div>
      {data.lobbyists.map((l: any, i: number) => (
        <div key={i} className="flex justify-between items-start gap-2 py-1.5 border-b border-dashed border-lb last:border-0">
          <div>
            <div className="text-[11px] font-medium">
              {l.client && l.client !== l.registrant ? (
                <><span className="text-ink">🏢 {l.client}</span><span className="text-[8px] text-mid"> via {l.registrant}</span></>
              ) : (
                <span className="text-ink">{l.registrant}</span>
              )}
            </div>
            {l.issues && <div className="text-[8px] text-mid italic mt-0.5">{l.issues}</div>}
            {l.period && <div className="text-[8px] text-mid">{l.period}</div>}
          </div>
          {l.amount && (
            <span className="font-display text-[14px] text-ftdpurple whitespace-nowrap shrink-0">
              ${Number(l.amount).toLocaleString()}
            </span>
          )}
        </div>
      ))}
      <div className="text-[8px] text-mid mt-2 pt-2 border-t border-lb">
        Source:{' '}
        <a href="https://lda.senate.gov" target="_blank" rel="noopener noreferrer" className="text-amber">
          lda.senate.gov
        </a>{' '}
        — official U.S. Senate lobbying registry
      </div>
    </div>
  );
}

export default function BillCard({ bill }: { bill: any }) {
  const num = `${bill.type || ''} ${bill.number || ''}`.trim() || 'Bill';
  const congress = bill.congress || 119;
  const typeSlug = (bill.type || 'hr').toLowerCase().replace('.', '');
  const url = bill.url || `https://www.congress.gov/bill/${congress}th-congress/${typeSlug}-bill/${bill.number}`;
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

      {/* Lobbying section */}
      <div className="border-t border-lb px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[8px] tracking-[3px] uppercase text-mid">🏛 Federal Lobbyists on this Issue</span>
          <span className="text-[8px] bg-ftdgreen text-white px-2 py-0.5 rounded-full">LDA.senate.gov</span>
        </div>
        <LobbySection billTitle={bill.title || ''} billNumber={num} />
      </div>

      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-[9px] tracking-widest uppercase text-ftdgreen border-b border-dashed border-ftdgreen opacity-70 hover:opacity-100 mx-4 mb-3"
      >
        ↗ Full bill on Congress.gov
      </a>
    </div>
  );
}
