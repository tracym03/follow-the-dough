'use client';

import { useEffect, useState } from 'react';
import CandidateCard from './CandidateCard';

export default function CandidatesTab({ zip, state, stateName }: { zip: string; state: string; stateName: string }) {
  const [data, setData] = useState<any>(null);
  // data.district comes from Census geocoder lookup
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
          Showing your U.S. House representative for your congressional district{data.district ? ` (District ${data.district})` : ''} plus your state&apos;s U.S. Senators. Federal law requires all donations over $200 to be publicly reported with the donor&apos;s name, employer, and city.
        </div>

        {/* House candidates */}
        {data.candidates.filter((d: any) => d.c?.office === 'H').length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-display text-xl tracking-[3px] text-brown">
                Your House Rep{data.district ? ` · District ${data.district}` : ''}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
            </div>
            {data.candidates.filter((d: any) => d.c?.office === 'H').map((d: any, i: number) => (
              <CandidateCard key={`h-${i}`} data={d} />
            ))}
          </>
        )}

        {/* Senate candidates */}
        {data.candidates.filter((d: any) => d.c?.office === 'S').length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-3 mt-5">
              <h2 className="font-display text-xl tracking-[3px] text-brown">Your U.S. Senators</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
            </div>
            {data.candidates.filter((d: any) => d.c?.office === 'S').map((d: any, i: number) => (
              <CandidateCard key={`s-${i}`} data={d} />
            ))}
          </>
        )}
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
