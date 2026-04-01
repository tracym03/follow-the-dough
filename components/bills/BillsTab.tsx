'use client';

import { useEffect, useState } from 'react';
import BillCard from './BillCard';


export default function BillsTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/bills?state=${state}&stateName=${encodeURIComponent(stateName)}`);
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
    <div className="bg-red-50 border-2 border-ftdred border-l-4 p-4 my-4 text-red-800 text-sm">
      ⚠ Could not load bills: {error}
      <br /><br />
      <span className="text-xs">Make sure your Congress.gov API key is set in <code>.env.local</code>. Get a free key at{' '}
        <a href="https://api.congress.gov/sign-up/" target="_blank" rel="noopener noreferrer" className="text-amber underline">api.congress.gov/sign-up</a>
      </span>
    </div>
  );

  if (!data?.bills?.length) return (
    <div className="text-center py-12 text-mid font-mono text-xs tracking-widest uppercase">
      <div className="font-display text-2xl text-amber mb-2">No Bills Found</div>
      No recent bills found for {stateName} members of Congress.
    </div>
  );

  return (
    <div>
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span>{data.bills.length} bills · 119th Congress</span>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-lb border border-amber p-3 mb-4 text-[10px] leading-relaxed text-brown">
          <strong className="font-display text-[13px] tracking-[3px] block mb-1">Federal Bills & Lobbying</strong>
          Recent bills from {stateName}&apos;s members of Congress. Bill data from Congress.gov. Lobbying disclosures from the official U.S. Senate LDA database — every registered federal lobbyist must disclose their clients and issues by law.
        </div>

        {data.members?.length > 0 && (
          <div className="text-[9px] text-mid font-mono mb-3 tracking-wide">
            Members: {data.members.join(' · ')}
          </div>
        )}
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl tracking-[3px] text-brown">Bills from {stateName} Members</h2>
          <span className="bg-ftdgreen text-white text-[8px] tracking-widest px-2 py-0.5 rounded-full">{data.bills.length}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-ftdgreen to-transparent" />
        </div>
        {data.bills.map((bill: any, i: number) => (
          <BillCard key={i} bill={bill} />
        ))}
        <div className="text-center mt-4">
          <a
            href={`https://www.congress.gov/members?q=%7B%22congress%22%3A%22119%22%2C%22state%22%3A%22${state}%22%7D`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] tracking-[3px] uppercase text-ftdgreen"
          >
            All {stateName} members on Congress.gov ↗
          </a>
        </div>
      </div>
    </div>
  );
}
