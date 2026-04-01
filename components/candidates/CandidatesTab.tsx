'use client';

import { useEffect, useState } from 'react';
import CandidateCard from './CandidateCard';
import { fmt } from '@/lib/utils';

function StateRacesSection({ state, stateName }: { state: string; stateName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/stateraces?state=${state}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [state]);

  if (loading) return (
    <div className="mt-6 py-4 text-center text-[9px] text-mid font-mono tracking-widest uppercase">
      <div className="w-4 h-4 border-2 border-amber/20 border-t-amber rounded-full animate-spin mx-auto mb-2" />
      Loading state races...
    </div>
  );

  if (!data || (!data.hasGovRace && !data.hasSenateRace)) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="font-display text-xl tracking-[3px] text-brown">State Races · 2026</h2>
        <div className="flex-1 h-px bg-gradient-to-r from-ftdgreen to-transparent" />
      </div>

      {/* Governor race */}
      {data.hasGovRace && (
        <div className="bg-white border border-lb border-l-4 border-l-ftdgreen mb-3">
          <div className="px-4 pt-3 pb-2 flex justify-between items-start">
            <div>
              <div className="font-display text-xl tracking-wide">{stateName} Governor · 2026</div>
              <div className="text-[9px] tracking-widest uppercase text-mid mt-0.5">
                State-level race · Funded via state campaign finance filings
              </div>
            </div>
            <span className="text-[8px] px-2 py-0.5 rounded-full bg-green-100 text-ftdgreen shrink-0">Open Race</span>
          </div>

          {/* Direct candidate data from FollowTheMoney */}
          {data.govCandidates?.length > 0 ? (
            <div className="px-4 pb-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[8px] tracking-[3px] uppercase text-mid">
                  💰 Candidates & Fundraising — {data.govSource}
                </span>
              </div>
              {data.govCandidates.map((c: any, i: number) => {
                const maxRaised = data.govCandidates[0]?.raised || 1;
                const pct = Math.min(100, Math.round((c.raised / maxRaised) * 100));
                return (
                  <div key={i} className="mb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="text-[12px] font-bold">{c.name}</div>
                        {c.party && (
                          <div className={`inline-block text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full mt-0.5
                            ${c.party.includes('Dem') ? 'bg-blue-100 text-ftdblue' :
                              c.party.includes('Rep') ? 'bg-red-100 text-ftdred' :
                              'bg-lb text-mid'}`}>
                            {c.party}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-[17px] text-ftdgreen">{c.raisedFmt}</div>
                        <div className="text-[8px] text-mid tracking-wide">raised</div>
                      </div>
                    </div>
                    <div className="h-[3px] bg-green-100 rounded mt-1.5">
                      <div className="h-full bg-ftdgreen rounded" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
              <div className="text-[8px] text-mid mt-1 border-t border-lb pt-2">
                Source: <a href={`https://www.followthemoney.org/show-me?s=${state}&y=2026`}
                  target="_blank" rel="noopener noreferrer" className="text-ftdgreen">FollowTheMoney.org</a>
                {' '}· State campaign finance disclosures
              </div>
            </div>
          ) : (
            /* No data yet — show helpful context + links */
            <div className="px-4 pb-4">
              <div className="bg-green-50 border border-green-200 rounded p-3 text-[10px] leading-relaxed text-brown">
                <p className="mb-1 font-semibold">Why isn&apos;t this data here automatically?</p>
                <p className="mb-3 text-mid">
                  Governor races are funded at the <strong>state level</strong> and reported to your
                  state&apos;s own election authority — not the federal FEC. Each state has its own
                  database. It&apos;s early in the 2026 cycle so filings may be limited.
                </p>
                <div className="flex flex-col gap-2">
                  <a href={`https://www.followthemoney.org/show-me?s=${state}&y=2026&c-exi=1&c-t-eid=5`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-ftdgreen border border-ftdgreen rounded px-2 py-1 w-fit hover:bg-green-50">
                    ↗ {stateName} Governor donors on FollowTheMoney.org
                  </a>
                  <a href={`https://www.opensecrets.org/races/summary?cycle=2026&id=${state}G`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-amber border border-amber rounded px-2 py-1 w-fit hover:bg-yellow-50">
                    ↗ {stateName} Governor race on OpenSecrets
                  </a>
                  {state === 'CA' && (
                    <a href="https://cal-access.sos.ca.gov/Campaign/Candidates/"
                      target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-ftdblue border border-ftdblue rounded px-2 py-1 w-fit hover:bg-blue-50">
                      ↗ California official donor database (CAL-ACCESS)
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Senate race notice */}
      {data.hasSenateRace && (
        <div className="bg-lb border border-amber/40 p-4 mb-3">
          <strong className="font-display text-[14px] tracking-wider block mb-1">
            📋 {stateName} has a U.S. Senate seat up in 2026
          </strong>
          <p className="text-[10px] text-mid leading-relaxed mb-2">
            Senate candidates appear in the Federal section above once they register with the FEC.
            Early in the cycle many haven&apos;t filed yet — check back as the race develops.
          </p>
          <a href={`https://www.fec.gov/data/candidates/?state=${state}&office=S&election_year=2026`}
            target="_blank" rel="noopener noreferrer"
            className="text-[9px] tracking-widest uppercase text-amber border-b border-dashed border-amber">
            ↗ All registered {stateName} Senate candidates on FEC.gov
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

  // Split into currently serving (incumbent) vs challengers/open seat
  const houseIncumbents = houseCands.filter((d: any) => d.c?.incumbent_challenge === 'I');
  const houseChallengers = houseCands.filter((d: any) => d.c?.incumbent_challenge !== 'I');
  const senateIncumbents = senateCands.filter((d: any) => d.c?.incumbent_challenge === 'I');
  const senateChallengers = senateCands.filter((d: any) => d.c?.incumbent_challenge !== 'I');

  return (
    <div>
      {/* Meta bar */}
      <div className="bg-brown text-gold text-[9px] tracking-[3px] uppercase px-4 py-2 flex justify-between items-center flex-wrap gap-1">
        <span>ZIP <span className="font-display text-sm tracking-widest text-cream">{zip}</span> · {stateName}</span>
        <span className={`font-display text-sm ${data?.usingFallback ? 'text-amber' : 'text-gold'}`}>
          {data?.electionYear || 2026} Election Cycle
        </span>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-4">
        {/* Fallback banner — shown whenever we're displaying 2024 data */}
        {data?.usingFallback && (
          <div className="bg-yellow-50 border border-yellow-300 border-l-4 border-l-amber p-3 mb-4 text-[10px] leading-relaxed text-brown">
            <strong className="font-display text-[12px] tracking-wider block mb-1">
              📅 Showing 2024 Fundraising Data
            </strong>
            It&apos;s early in the 2026 election cycle and most candidates haven&apos;t raised meaningful money yet.
            We&apos;re showing you the 2024 race so you can see who holds this seat and exactly who funded them —
            these representatives are still in office and these donors still have influence.
            The app will automatically switch to 2026 live data once candidates begin filing.
          </div>
        )}

        {/* Info box */}
        <div className="bg-lb border border-amber p-3 mb-4 text-[10px] leading-relaxed text-brown">
          <strong className="font-display text-[13px] tracking-[3px] block mb-1">
            {data?.electionYear || 2024} Federal Candidates
          </strong>
          Showing your U.S. House representative for District {data?.district || '?'} and U.S. Senators for {stateName}.
          Industry breakdowns show which sectors funded each campaign — same methodology as OpenSecrets, sourced directly from FEC filings.
        </div>

        {/* ── House ── */}
        {houseCands.length > 0 && (
          <>
            {/* Currently serving */}
            {houseIncumbents.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div>
                    <h2 className="font-display text-xl tracking-[3px] text-brown">
                      Currently Serving{data?.district ? ` · District ${data.district}` : ''}
                    </h2>
                    <p className="text-[9px] text-mid mt-0.5">Your sitting U.S. House representative</p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
                </div>
                {houseIncumbents.map((d: any, i: number) => (
                  <CandidateCard key={`hi-${i}`} data={d} electionYear={data?.electionYear || 2024} />
                ))}
              </>
            )}

            {/* Challengers */}
            {houseChallengers.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-3 mt-5">
                  <div>
                    <h2 className="font-display text-xl tracking-[3px] text-brown">
                      {data?.electionYear === 2026 ? 'Running in 2026' : '2024 Challengers'}
                      {data?.district ? ` · District ${data.district}` : ''}
                    </h2>
                    <p className="text-[9px] text-mid mt-0.5">
                      {data?.electionYear === 2026
                        ? 'Candidates challenging for this seat'
                        : 'Candidates who ran against the incumbent in 2024'}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
                </div>
                {houseChallengers.map((d: any, i: number) => (
                  <CandidateCard key={`hc-${i}`} data={d} electionYear={data?.electionYear || 2024} />
                ))}
              </>
            )}

            {/* If no incumbent/challenger split exists, show all together */}
            {houseIncumbents.length === 0 && houseChallengers.length === 0 && houseCands.map((d: any, i: number) => (
              <CandidateCard key={`h-${i}`} data={d} electionYear={data?.electionYear || 2024} />
            ))}
          </>
        )}

        {/* ── Senate ── */}
        {senateCands.length > 0 && (
          <>
            {/* Currently serving senators */}
            {senateIncumbents.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-3 mt-6">
                  <div>
                    <h2 className="font-display text-xl tracking-[3px] text-brown">Your Sitting U.S. Senators</h2>
                    <p className="text-[9px] text-mid mt-0.5">Currently serving {stateName} in the U.S. Senate</p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
                </div>
                {senateIncumbents.map((d: any, i: number) => (
                  <CandidateCard key={`si-${i}`} data={d} electionYear={data?.electionYear || 2024} />
                ))}
              </>
            )}

            {/* Senate challengers */}
            {senateChallengers.length > 0 && (
              <>
                <div className="flex items-center gap-3 mb-3 mt-5">
                  <div>
                    <h2 className="font-display text-xl tracking-[3px] text-brown">
                      {data?.electionYear === 2026 ? 'Senate Candidates · 2026' : '2024 Senate Challengers'}
                    </h2>
                    <p className="text-[9px] text-mid mt-0.5">
                      {data?.electionYear === 2026
                        ? 'Candidates running for the {stateName} Senate seat'
                        : 'Candidates who ran for Senate in 2024'}
                    </p>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
                </div>
                {senateChallengers.map((d: any, i: number) => (
                  <CandidateCard key={`sc-${i}`} data={d} electionYear={data?.electionYear || 2024} />
                ))}
              </>
            )}

            {/* Fallback if no split */}
            {senateIncumbents.length === 0 && senateChallengers.length === 0 && (
              <>
                <div className="flex items-center gap-3 mb-3 mt-6">
                  <h2 className="font-display text-xl tracking-[3px] text-brown">U.S. Senators · {data?.electionYear || 2024}</h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-amber to-transparent" />
                </div>
                {senateCands.map((d: any, i: number) => (
                  <CandidateCard key={`s-${i}`} data={d} electionYear={data?.electionYear || 2024} />
                ))}
              </>
            )}
          </>
        )}

        {/* No federal candidates found */}
        {!hasFederal && !loading && (
          <div className="text-center py-8 bg-lb border border-amber/40 rounded mb-4">
            <div className="font-display text-2xl text-amber mb-2">No FEC Filings Found</div>
            <p className="text-[10px] text-mid font-mono leading-relaxed px-4">
              No candidates found for District {data?.district} in {stateName}.
              Try a different ZIP code or search directly on FEC.gov below.
            </p>
            <a
              href={`https://www.fec.gov/data/candidates/?state=${state}&election_year=2024`}
              target="_blank" rel="noopener noreferrer"
              className="inline-block mt-3 text-[9px] tracking-[3px] uppercase text-amber border-b border-dashed border-amber"
            >
              ↗ Search all {stateName} candidates on FEC.gov
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
