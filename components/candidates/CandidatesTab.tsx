'use client';

import { useEffect, useState } from 'react';
import CandidateCard from './CandidateCard';
import { fmt } from '@/lib/utils';

function StateRacesSection({ state, stateName }: { state: string; stateName: string }) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/stateraces?state=${state}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => null);
  }, [state]);

  if (!data) return null;
  if (!data.hasGovRace && !data.hasSenateRace) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl tracking-[3px] text-brown">State & Other 2026 Races</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-ftdgreen to-transparent" />
      </div>

      {/* Governor race */}
      {data.hasGovRace && (
        <div className="bg-white border border-lb border-l-4 border-l-ftdgreen mb-3 p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <div className="font-display text-lg tracking-wide">{stateName} Governor · 2026</div>
              <div className="text-[9px] tracking-widest uppercase text-mid mt-0.5">State-level race · Not in FEC database</div>
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-green-100 text-ftdgreen">Open Race</span>
          </div>

          {/* If we have FollowTheMoney data */}
          {data.races?.length > 0 && data.races[0]?.candidates?.length > 0 ? (
            <div>
              <div className="text-[8px] tracking-[3px] uppercase text-mid mb-2">💰 Top Fundraisers (FollowTheMoney.org)</div>
              {data.races[0].candidates.map((c: any, i: number) => (
                <div key={i} className="flex justify-between items-center py-1.5 border-b border-lb last:border-0">
                  <div>
                    <div className="text-[11px] font-medium">{c.name}</div>
                    {c.party && <div className="text-[9px] text-mid">{c.party}</div>}
                  </div>
                  <div className="font-display text-[15px] text-ftdgreen">{fmt(c.raised)}</div>
                </div>
              ))}
            </div>
          ) : (
            /* No API key — show helpful links */
            <div className="bg-green-50 border border-green-200 rounded p-3 text-[10px] leading-relaxed text-brown">
              <p className="mb-2">
                Governor races are funded at the state level and reported to your state&apos;s election authority — not the FEC.
                Full donation data is publicly available at:
              </p>
              <div className="flex flex-col gap-1">
                <a href={`https://www.followthemoney.org/show-me?s=${state}&y=2026&c-exi=1&c-t-eid=24`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-ftdgreen border-b border-dashed border-ftdgreen w-fit">
                  ↗ {stateName} Governor donors on FollowTheMoney.org
                </a>
                <a href={`https://www.opensecrets.org/races/summary?cycle=2026&id=${state}G`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-amber border-b border-dashed border-amber w-fit">
                  ↗ {stateName} Governor race on OpenSecrets
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Senate race note */}
      {data.hasSenateRace && (
        <div className="bg-lb border border-amber/40 p-3 mb-3 text-[10px] text-brown">
          <strong className="font-display text-[12px] tracking-wider block mb-1">
            📋 {stateName} has a U.S. Senate seat up in 2026
          </strong>
          Senate candidates will appear above once they register with the FEC and begin raising money.
          Early-cycle candidates may not yet appear.
          <br /><br />
          <a href={`https://www.fec.gov/data/candidates/?state=${state}&office=S&election_year=2026`}
            target="_blank" rel="noopener noreferrer"
            className="text-amber border-b border-dashed border-amber">
            ↗ Check for registered Senate candidates on FEC.gov
          </a>
        </div>
      )}
    </div>
  );
}

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
      <div className="text-[9px] tracking-widest uppercase text-mid mt-2">Looking up your district & fetching FEC filings...</div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border-2 border-ftdred border-l-4 p-4 my-4 text-red-800 text-sm">
      ⚠ Could not load candidates: {error}
    </div>
  );

  const houseCands = (data?.candidates || []).filter((d: any) => d.c?.office === 'H');
  const senateCands = (data?.candidates || []).filter((d: any) => d.c?.office === 'S');
  const hasFederal = houseCands.length > 0 || senateCands.length > 0;

  return (
    <div>
      {/* Meta bar */}
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span className="text-amber font-display text-sm">2026 Election Cycle</span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Info box */}
        <div className="bg-lb border border-amber p-3 mb-4 text-[10px] leading-relaxed text-brown">
          <strong className="font-display text-[13px] tracking-[3px] block mb-1">2026 Federal Candidates</strong>
          Showing your U.S. House representative for District {data?.district || '?'} and U.S. Senators for {stateName}.
          FEC filings are live — early in the cycle some candidates may have limited data.
          State races like Governor are shown below with links to state disclosure sites.
        </div>

        {/* House candidates */}
        {houseCands.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-3">
              <h2 className="font-display text-xl tracking-[3px] text-brown">
                Your House Rep{data?.district ? ` · District ${data.district}` : ''}
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
            </div>
            {houseCands.map((d: any, i: number) => (
              <CandidateCard key={`h-${i}`} data={d} electionYear={2026} />
            ))}
          </>
        )}

        {/* Senate candidates */}
        {senateCands.length > 0 && (
          <>
            <div className="flex items-center gap-3 mb-3 mt-5">
              <h2 className="font-display text-xl tracking-[3px] text-brown">Your U.S. Senators · 2026</h2>
              <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
            </div>
            {senateCands.map((d: any, i: number) => (
              <CandidateCard key={`s-${i}`} data={d} electionYear={2026} />
            ))}
          </>
        )}

        {/* No federal candidates found */}
        {!hasFederal && !loading && (
          <div className="text-center py-8 bg-lb border border-amber/40 rounded mb-4">
            <div className="font-display text-2xl text-amber mb-2">No 2026 Federal Filings Yet</div>
            <p className="text-[10px] text-mid font-mono leading-relaxed px-4">
              It&apos;s early in the 2026 cycle — candidates for District {data?.district} may not have registered
              with the FEC yet or haven&apos;t begun raising money.
              Check back as the election gets closer.
            </p>
            <a
              href={`https://www.fec.gov/data/candidates/?state=${state}&election_year=2026`}
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-3 text-[9px] tracking-[3px] uppercase text-amber border-b border-dashed border-amber"
            >
              ↗ Search all {stateName} 2026 candidates on FEC.gov
            </a>
          </div>
        )}

        {/* State races section */}
        <StateRacesSection state={state} stateName={stateName} />

        {/* FEC link */}
        <div className="text-center mt-4">
          <a
            href={`https://www.fec.gov/data/candidates/?state=${state}&election_year=2026`}
            target="_blank" rel="noopener noreferrer"
            className="text-[9px] tracking-[3px] uppercase text-amber"
          >
            All {stateName} 2026 candidates on FEC.gov ↗
          </a>
        </div>
      </div>
    </div>
  );
}
