'use client';

import { useState } from 'react';
import { billStatusClass } from '@/lib/utils';
import PizzaChart from '@/components/candidates/PizzaChart';

// Strip legal boilerplate and extract 2-3 meaningful topic words from a bill title
// LDA filings use topic keywords — "defense", "pharma", "housing" — not bill numbers
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

  // Take the first 3 meaningful words as the topic search
  return words.slice(0, 3).join(' ');
}

function LobbySection({ billTitle }: { billTitle: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const keywords = extractTopicKeywords(billTitle);

  function toggle() {
    if (!open && !data && !loading) {
      setLoading(true);
      fetch(`/api/lobbying?keywords=${encodeURIComponent(keywords)}`)
        .then(r => r.json())
        .then(setData)
        .catch(() => setData({ found: false }))
        .finally(() => setLoading(false));
    }
    setOpen(v => !v);
  }

  const lobbyists = data?.lobbyists || [];
  const slices = data?.industrySlices || [];

  return (
    <div className="border-t border-lb">
      {/* Toggle button */}
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 text-left transition-colors ${open ? 'bg-amber/10' : 'hover:bg-lb/50'}`}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg leading-none">🍕</span>
          <div>
            <div className="text-[11px] font-semibold text-brown">Who lobbied on this bill?</div>
            <div className="text-[9px] text-mid">
              Searching LDA registry for: <span className="italic text-amber">{keywords || billTitle.substring(0, 40)}</span>
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
              Searching federal lobbying registry...
            </div>
          )}

          {/* Pizza — industry breakdown */}
          {!loading && slices.length >= 2 && (
            <div className="mb-3">
              <p className="text-[9px] text-mid italic mb-2 leading-relaxed">
                Which industries paid federal lobbyists to work on issues related to this bill:
              </p>
              <PizzaChart title="Lobbying by Industry" slices={slices} />
            </div>
          )}

          {/* Lobbyist list */}
          {!loading && lobbyists.length > 0 && (
            <div>
              <div className="text-[8px] tracking-widest uppercase text-mid mb-2">
                📋 Registered Lobbyists — {keywords}
              </div>
              {lobbyists.map((l: any, i: number) => (
                <div key={i} className="flex justify-between items-start gap-2 py-1.5 border-b border-dashed border-lb last:border-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium">
                      {l.client && l.client !== l.registrant ? (
                        <>
                          <span className="text-ink">🏢 {l.client}</span>
                          <span className="text-[8px] text-mid"> via {l.registrant}</span>
                        </>
                      ) : (
                        <span className="text-ink">{l.registrant}</span>
                      )}
                    </div>
                    {l.issues && (
                      <div className="text-[8px] text-mid italic mt-0.5 truncate">{l.issues}</div>
                    )}
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
                — all federal lobbyists must register and disclose clients by law
              </div>
            </div>
          )}

          {/* No results */}
          {!loading && !lobbyists.length && (
            <p className="text-[9px] text-mid italic py-2">
              No lobbying filings found for <em>{keywords}</em> in the LDA database.
              This issue may not have active registered lobbyists, or try searching{' '}
              <a
                href={`https://lda.senate.gov/filings/public/filing/search/?search=${encodeURIComponent(keywords)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber underline"
              >
                LDA.senate.gov directly
              </a>.
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

      {/* Per-bill lobbying section — lazy loads when user taps */}
      <LobbySection billTitle={bill.title || ''} />

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
