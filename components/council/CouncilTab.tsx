'use client';

import { useEffect, useState } from 'react';
import { LEGISTAR_CITIES } from '@/lib/utils';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function isPast(dateStr: string) {
  try { return new Date(dateStr) < new Date(); } catch { return false; }
}

export default function CouncilTab({ zip }: { zip: string }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function loadCity(client: string) {
    setLoading(true);
    setError('');
    setData(null);
    try {
      const res = await fetch(`/api/council?city=${client}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleCityChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedCity(val);
    if (val) loadCity(val);
  }

  const cityLabel = LEGISTAR_CITIES.find(c => c.client === selectedCity)?.label || '';

  return (
    <div>
      {/* City picker header */}
      <div className="bg-brown px-6 py-6 text-center">
        <div className="font-display text-3xl tracking-widest text-gold mb-1">🏛 City Council Tracker</div>
        <div className="text-[11px] text-lb/80 mb-4 tracking-wide">
          Council members · Upcoming meetings · Recent legislation
        </div>
        <div className="max-w-sm mx-auto">
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full bg-lb text-ink border-2 border-gold rounded px-4 py-2.5 font-mono text-sm cursor-pointer appearance-none"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%233b1f0a' stroke-width='2' fill='none'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">— Select a city —</option>
            {LEGISTAR_CITIES.map(c => (
              <option key={c.client} value={c.client}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="text-[9px] text-white/30 mt-2 tracking-wide">
          Powered by Legistar · 30 major U.S. cities · No API key required
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-7 h-7 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
          <div className="font-display text-2xl text-amber">Loading {cityLabel}...</div>
          <div className="text-[9px] tracking-widest uppercase text-mid mt-2">Fetching council data...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-red-50 border-2 border-ftdred border-l-4 p-4 text-red-800 text-sm">
            ⚠ Could not load data for {cityLabel}: {error}
            <br /><br />
            <span className="text-xs">Some cities may not be available on Legistar. Try another city.</span>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {data && !loading && (
        <div className="pb-10">
          {/* City banner */}
          <div className="px-6 py-5 text-center border-b-4 border-gold"
            style={{ background: 'linear-gradient(135deg, #3b1f0a 0%, #5c3010 100%)' }}>
            <div className="font-display text-4xl text-gold tracking-widest">{cityLabel}</div>
            <div className="text-[11px] text-cream/50 uppercase tracking-widest mt-1">City Council Data via Legistar</div>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-4 space-y-6">

            {/* Council Members */}
            {data.persons?.length > 0 && (
              <section>
                <h3 className="font-display text-lg tracking-widest text-brown border-b-2 border-gold pb-1.5 mb-3">
                  Council Members
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(data.persons as any[]).slice(0, 20).map((p: any, i: number) => {
                    const initials = [p.PersonFirstName?.[0], p.PersonLastName?.[0]].filter(Boolean).join('');
                    return (
                      <div key={i} className="bg-white border border-amber/30 rounded-lg px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-brown text-gold font-display text-xl flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[13px] text-ink truncate">
                            {p.PersonFirstName} {p.PersonLastName}
                          </div>
                          {p.PersonTitle && <div className="text-[11px] text-mid">{p.PersonTitle}</div>}
                          {p.PersonPhone && <div className="text-[11px] text-mid">{p.PersonPhone}</div>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Meetings */}
            {data.events?.length > 0 && (
              <section>
                <h3 className="font-display text-lg tracking-widest text-brown border-b-2 border-gold pb-1.5 mb-3">
                  Meetings
                </h3>
                <div className="space-y-2">
                  {(data.events as any[]).map((ev: any, i: number) => {
                    const past = isPast(ev.EventDate);
                    return (
                      <div key={i} className={`bg-white border border-amber/30 rounded-lg px-4 py-3 border-l-4 ${past ? 'border-l-mid opacity-80' : 'border-l-amber'}`}>
                        <div className={`text-[11px] font-bold uppercase tracking-wide mb-1 ${past ? 'text-mid' : 'text-amber'}`}>
                          {formatDate(ev.EventDate)}
                        </div>
                        <div className="text-[13px] font-medium text-ink">{ev.EventBodyName || 'Council Meeting'}</div>
                        {ev.EventLocation && <div className="text-[11px] text-mid mt-0.5">📍 {ev.EventLocation}</div>}
                        {ev.EventAgendaFile && (
                          <a href={ev.EventAgendaFile} target="_blank" rel="noopener noreferrer"
                            className="inline-block mt-2 text-[11px] text-ftdblue border border-ftdblue rounded px-2 py-0.5 hover:bg-ftdblue hover:text-white transition-colors">
                            View Agenda ↗
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Recent Legislation */}
            {data.matters?.length > 0 && (
              <section>
                <h3 className="font-display text-lg tracking-widest text-brown border-b-2 border-gold pb-1.5 mb-3">
                  Recent Legislation
                </h3>
                <div className="space-y-2">
                  {(data.matters as any[]).map((m: any, i: number) => {
                    const vote = data.voteMap?.[m.MatterId];
                    const passed = vote?.MatterHistoryPassedFlag === 1;
                    const failed = vote?.MatterHistoryPassedFlag === 0;
                    return (
                      <div key={i} className="bg-white border border-amber/30 rounded-lg px-4 py-3">
                        <div className="flex flex-wrap gap-2 items-center mb-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wide bg-brown text-gold rounded px-2 py-0.5">
                            {m.MatterTypeName || 'Matter'}
                          </span>
                          {m.MatterFile && (
                            <span className="text-[10px] text-mid font-mono">{m.MatterFile}</span>
                          )}
                          <span className="text-[10px] text-mid ml-auto">{formatDate(m.MatterLastModifiedUtc)}</span>
                        </div>
                        <div className="text-[13px] leading-snug mb-1.5">{m.MatterTitle || m.MatterName}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {m.MatterStatusName && (
                            <span className="text-[11px] font-semibold text-mid">{m.MatterStatusName}</span>
                          )}
                          {vote && (
                            <span className={`text-[10px] font-bold rounded px-2 py-0.5 ${passed ? 'bg-green-100 text-green-800' : failed ? 'bg-red-100 text-red-800' : 'bg-lb text-mid'}`}>
                              {passed ? '✓ Passed' : failed ? '✗ Failed' : 'Voted'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <div className="text-center text-[11px] text-mid">
              Data from{' '}
              <a href="https://webapi.legistar.com" target="_blank" rel="noopener noreferrer" className="text-amber">
                Legistar
              </a>{' '}
              · Updated in real time · All public record
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedCity && !loading && (
        <div className="text-center py-12 text-mid font-mono text-xs tracking-widest uppercase">
          <div className="font-display text-2xl text-amber mb-2">Select a City</div>
          Choose a city above to view council data
        </div>
      )}
    </div>
  );
}
