'use client';

import { useState } from 'react';
import { billStatusClass } from '@/lib/utils';
import PizzaChart from '@/components/candidates/PizzaChart';

// Strip legal boilerplate and extract meaningful topic words for LDA search
function extractTopicKeywords(title: string): string {
  const stopWords = new Set([
    'to', 'the', 'a', 'an', 'and', 'or', 'of', 'for', 'in', 'on', 'with',
    'by', 'at', 'from', 'be', 'is', 'are', 'was', 'were', 'that', 'this',
    'amend', 'establish', 'provide', 'require', 'authorize', 'prohibit',
    'create', 'modify', 'relating', 'respect', 'regarding', 'concerning',
    'act', 'section', 'title', 'congress', 'united', 'states', 'federal',
    'national', 'american', 'certain', 'other', 'such', 'any', 'all',
    'including', 'purposes', 'make', 'ensure', 'support', 'promote',
    '2024', '2025', '2026', '119th',
  ]);
  const words = title
    .replace(/[^a-zA-Z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3 && !stopWords.has(w.toLowerCase()));
  return words.slice(0, 3).join(' ');
}

function LobbySection({ billTitle, billType, billNumber }: { billTitle: string; billType?: string; billNumber?: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const keywords = extractTopicKeywords(billTitle);
  // Build the bill ID string the way LDA stores it — "HR 1234" or "S 567"
  const billId = billType && billNumber ? `${billType.toUpperCase()} ${billNumber}` : '';

  function toggle() {
    if (!open && !data && !loading) {
      setLoading(true);
      const params = new URLSearchParams({ keywords });
      if (billId) params.set('billId', billId);
      fetch(`/api/lobbying?${params.toString()}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => setData({ found: false }))
        .finally(() => setLoading(false));
    }
    setOpen(v => !v);
  }

  const lobbyists: any[] = data?.lobbyists || [];
  const slices: any[] = data?.industrySlices || [];

  return (
    <div className="border-t border-lb">
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${open ? 'bg-amber/10' : 'hover:bg-lb/50'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">🥧</span>
          <div>
            <div className="text-[11px] font-semibold text-brown">Who lobbies on this topic?</div>
            <div className="text-[9px] text-mid">See which industries have paid lobbyists working this issue</div>
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
              Searching federal lobbying registry...
            </div>
          )}

          {/* Dough chart — topic breakdown, always has data */}
          {!loading && slices.length >= 2 && (
            <>
              <div className="bg-lb/60 border border-amber/30 rounded px-3 py-2 mb-3 text-[9px] text-brown leading-relaxed">
                <strong>What this shows:</strong> The more lobbying filings on a topic, the more pressure
                Congress is getting from that industry. Each slice = number of active registered lobbyists
                working that issue area right now.
              </div>
              <PizzaChart title="Lobbying Activity by Topic" slices={slices} />
            </>
          )}

          {/* Who is lobbying — grouped by lobbying firm */}
          {!loading && lobbyists.length > 0 && (
            <div className="mt-3">
              <div className="text-[8px] tracking-widest uppercase text-mid mb-1">
                {data?.searchedByBill
                  ? <>🏢 Lobbying firms that filed on <span className="text-amber">{billId}</span></>
                  : <>🏢 Active lobbying firms on this topic</>
                }
              </div>
              <p className="text-[8px] text-mid italic mb-2">
                These are paid lobbying firms registered with the Senate. Each represents multiple clients pushing Congress on this issue.
              </p>
              {lobbyists.map((l: any, i: number) => (
                <div key={i} className="py-2 border-b border-dashed border-lb last:border-0">
                  <div className="flex justify-between items-start gap-2">
                    <div className="text-[11px] font-semibold text-ink">{l.registrant}</div>
                    {l.clientCount > 1 && (
                      <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-amber/20 text-brown shrink-0 whitespace-nowrap">
                        {l.clientCount} clients
                      </span>
                    )}
                  </div>
                  {l.topics && (
                    <div className="text-[8px] text-mid mt-0.5">
                      Lobbying on: <span className="text-brown">{l.topics}</span>
                    </div>
                  )}
                  {l.clients?.length > 0 && (
                    <div className="text-[8px] text-mid mt-0.5">
                      Represents: <span className="text-ink">{l.clients.join(', ')}{l.clientCount > 3 ? ` +${l.clientCount - 3} more` : ''}</span>
                    </div>
                  )}
                </div>
              ))}
              <div className="text-[8px] text-mid mt-2 pt-2 border-t border-lb">
                Source:{' '}
                <a href="https://lda.senate.gov" target="_blank" rel="noopener noreferrer" className="text-amber">
                  lda.senate.gov
                </a>
                {' '}· Federal law requires all lobbyists to register ·{' '}
                <a
                  href={`https://lda.senate.gov/filings/public/filing/search/?search=${encodeURIComponent(keywords)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-amber"
                >
                  Full database ↗
                </a>
              </div>
            </div>
          )}

          {!loading && !lobbyists.length && (
            <p className="text-[9px] text-mid italic py-2">
              No active lobbying filings found for <em>{keywords}</em>.{' '}
              <a
                href={`https://lda.senate.gov/filings/public/filing/search/?search=${encodeURIComponent(keywords)}`}
                target="_blank" rel="noopener noreferrer"
                className="text-amber underline"
              >
                Search LDA.senate.gov directly ↗
              </a>
            </p>
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

      <LobbySection billTitle={bill.title || ''} billType={bill.type} billNumber={bill.number} />

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
