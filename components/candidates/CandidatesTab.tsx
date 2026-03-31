'use client';

import { useEffect, useState } from 'react';
import CandidateCard from './CandidateCard';

export default function CandidatesTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/candidates?state=${state}&zip=${zip}`);
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
  }, [zip, state]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-7 h-7 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
      <div className="font-display text-2xl text-amber">Following the Dough...</div>
      <div className="text-[9px] tracking-widest uppercase text-mid mt-2">Fetching FEC filings...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-2 border-ftdred border-l-4 p-4 my-4 text-red-800 text-sm">
      ⚠ Could not load candidates: {error}
    </div>
  );

  if (!data?.candidates?.length) return (
    <div className="text-center py-12 text-mid font-mono text-xs tracking-widest uppercase">
      <div className="font-display text-2xl text-amber mb-2">No Results</div>
      No funded 2024 federal candidates found for {stateName}.
    </div>
  );

  return (
    <div>
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span>{data.candidates.length} federal candidates · 2024</span>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-4">
        <div className="bg-lb border border-amber p-3 mb-4 text-[10px] leading-relaxed text-brown">
          <strong className="font-display text-[13px] tracking-[3px] block mb-1">About This Data</strong>
          Federal law requires all individual donations over $200 to be reported with the donor&apos;s name, employer, and city. PAC donations are also fully disclosed. This is that data, live from FEC filings.
        </div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-display text-xl tracking-[3px] text-brown">Federal Candidates</h2>
          <span className="bg-amber text-ink text-[8px] tracking-widest px-2 py-0.5 rounded-full">{data.candidates.length}</span>
          <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
        </div>
        {data.candidates.map((d: any, i: number) => (
          <CandidateCard key={i} data={d} />
        ))}
        <div className="text-center mt-4">
          <a
            href={`https://www.fec.gov/data/candidates/?state=${state}&election_year=2024`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[9px] tracking-[3px] uppercase text-amber"
          >
            All candidates on FEC.gov ↗
          </a>
        </div>
      </div>
    </div>
  );
}
