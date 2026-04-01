'use client';

import { useEffect, useState } from 'react';
import { LEGISTAR_CITIES, NON_LEGISTAR_CITIES } from '@/lib/utils';
import { getMemberMeta, CITY_COUNCIL_PAGES, PARTY_LABELS, PARTY_COLORS } from '@/lib/councilData';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return dateStr; }
}

function isPast(dateStr: string) {
  try { return new Date(dateStr) < new Date(); } catch { return false; }
}

// Group cities by region
function groupCities() {
  const groups: Record<string, typeof LEGISTAR_CITIES> = {};
  for (const city of LEGISTAR_CITIES) {
    if (!groups[city.group]) groups[city.group] = [];
    groups[city.group].push(city);
  }
  return groups;
}

export default function CouncilTab({ zip }: { zip: string }) {
  const [selectedCity, setSelectedCity] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cityNotFound, setCityNotFound] = useState(false);
  const [search, setSearch] = useState('');
  const cityGroups = groupCities();

  async function loadCity(client: string) {
    setLoading(true);
    setError('');
    setData(null);
    setCityNotFound(false);
    try {
      const res = await fetch(`/api/council?city=${client}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch (e: any) {
      // Check if it's a city not found on Legistar
      if (e.message.includes('404') || e.message.includes('400')) {
        setCityNotFound(true);
      } else {
        setError(e.message);
      }
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
  const nonLegistarCity = NON_LEGISTAR_CITIES.find(c =>
    search.toLowerCase().includes(c.label.split(',')[0].toLowerCase())
  );

  // Filter cities by search
  const filteredGroups: Record<string, typeof LEGISTAR_CITIES> = {};
  if (search.trim()) {
    for (const [group, cities] of Object.entries(cityGroups)) {
      const filtered = cities.filter(c =>
        c.label.toLowerCase().includes(search.toLowerCase())
      );
      if (filtered.length) filteredGroups[group] = filtered;
    }
  } else {
    Object.assign(filteredGroups, cityGroups);
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-brown px-6 py-6 text-center">
        <div className="font-display text-3xl tracking-widest text-gold mb-1">🏛 City Council Tracker</div>
        <div className="text-[11px] text-lb/80 mb-4 tracking-wide">
          Council members · Upcoming meetings · Recent legislation
        </div>

        {/* Search box */}
        <div className="max-w-sm mx-auto mb-3">
          <input
            type="text"
            placeholder="Search for your city..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-lb text-ink border-2 border-gold rounded px-4 py-2.5 font-mono text-sm outline-none focus:border-amber"
          />
        </div>

        {/* Grouped dropdown */}
        <div className="max-w-sm mx-auto">
          <select
            value={selectedCity}
            onChange={handleCityChange}
            className="w-full bg-lb text-ink border-2 border-gold rounded px-4 py-2.5 font-mono text-sm cursor-pointer"
          >
            <option value="">— Select a city —</option>
            {Object.entries(filteredGroups).map(([group, cities]) => (
              <optgroup key={group} label={group}>
                {cities.map(c => (
                  <option key={c.client} value={c.client}>{c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="text-[9px] text-white/30 mt-2 tracking-wide">
          Powered by Legistar · {LEGISTAR_CITIES.length}+ cities · No API key required
        </div>
      </div>

      {/* Small city not on Legistar */}
      {search && Object.keys(filteredGroups).length === 0 && (
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="bg-white border border-lb border-l-4 border-l-amber p-4">
            <div className="font-display text-lg tracking-wide mb-1">
              {search} — Not on Legistar
            </div>
            <p className="text-[10px] text-mid leading-relaxed mb-3">
              Smaller cities often use their own meeting management systems rather than Legistar.
              You can still access their council information directly:
            </p>

            {/* Check if it's a known small city we have links for */}
            {nonLegistarCity ? (
              <div className="space-y-2">
                <a href={nonLegistarCity.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] text-amber border border-amber rounded px-3 py-2 hover:bg-yellow-50">
                  🏛 {nonLegistarCity.label} City Council →
                </a>
                {nonLegistarCity.financeUrl && (
                  <a href={nonLegistarCity.financeUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 text-[10px] text-ftdgreen border border-ftdgreen rounded px-3 py-2 hover:bg-green-50">
                    💰 California Campaign Finance Disclosures (FPPC) →
                  </a>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-[9px] text-mid mb-2">Try searching for your city directly:</p>
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(search + ' city council agenda minutes')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] text-amber border border-amber rounded px-3 py-2 hover:bg-yellow-50">
                  🔍 Search for {search} City Council →
                </a>
                <a
                  href={`https://www.fppc.ca.gov/transparency/campaign-disclosure-portals.html`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] text-ftdgreen border border-ftdgreen rounded px-3 py-2 hover:bg-green-50">
                  💰 California Local Campaign Finance (FPPC) →
                </a>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-lb text-[9px] text-mid">
              💡 San Clemente, Dana Point, San Juan Capistrano, Laguna Beach, Newport Beach,
              Mission Viejo, Lake Forest and Aliso Viejo are listed below — type their name to see links.
            </div>
          </div>

          {/* Known OC small cities */}
          <div className="mt-4">
            <div className="text-[9px] tracking-[3px] uppercase text-mid mb-2">Orange County Cities (Direct Links)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {NON_LEGISTAR_CITIES.map(c => (
                <a key={c.label} href={c.website} target="_blank" rel="noopener noreferrer"
                  className="bg-white border border-lb rounded p-3 hover:border-amber transition-colors">
                  <div className="text-[11px] font-medium text-ink">{c.label}</div>
                  <div className="text-[9px] text-amber mt-0.5">View City Council →</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-7 h-7 border-[3px] border-amber/20 border-t-amber rounded-full animate-spin mb-4" />
          <div className="font-display text-2xl text-amber">Loading {cityLabel}...</div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-red-50 border-2 border-ftdred border-l-4 p-4 text-red-800 text-sm">
            ⚠ Could not load {cityLabel}: {error}
          </div>
        </div>
      )}

      {/* City not found on Legistar */}
      {cityNotFound && !loading && (
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="bg-yellow-50 border border-yellow-300 border-l-4 border-l-amber p-4 text-sm">
            <div className="font-display text-lg mb-1">{cityLabel} — Data Unavailable</div>
            <p className="text-[10px] text-mid">
              This city may not have a public Legistar connection. Try another city or visit their official website.
            </p>
          </div>
        </div>
      )}

      {/* Dashboard */}
      {data && !loading && (
        <div className="pb-10">
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
                    const meta = getMemberMeta(selectedCity, p.PersonFirstName || '', p.PersonLastName || '');
                    const profileUrl = meta.url || CITY_COUNCIL_PAGES[selectedCity];
                    const partyColor = meta.party ? PARTY_COLORS[meta.party] : null;
                    const partyLabel = meta.party ? PARTY_LABELS[meta.party] : null;
                    return (
                      <div key={i} className="bg-white border border-amber/30 rounded-lg px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow">
                        <div className="w-10 h-10 rounded-full bg-brown text-gold font-display text-xl flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {profileUrl ? (
                              <a
                                href={profileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-[13px] text-amber underline underline-offset-2 decoration-amber/40 hover:decoration-amber truncate"
                              >
                                {p.PersonFirstName} {p.PersonLastName}
                              </a>
                            ) : (
                              <span className="font-semibold text-[13px] text-ink truncate">
                                {p.PersonFirstName} {p.PersonLastName}
                              </span>
                            )}
                            {partyLabel && partyColor && (
                              <span
                                className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                                style={{ backgroundColor: partyColor + '22', color: partyColor, border: `1px solid ${partyColor}66` }}
                              >
                                {partyLabel}
                              </span>
                            )}
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
                          {m.MatterFile && <span className="text-[10px] text-mid font-mono">{m.MatterFile}</span>}
                          <span className="text-[10px] text-mid ml-auto">{formatDate(m.MatterLastModifiedUtc)}</span>
                        </div>
                        <div className="text-[13px] leading-snug mb-1.5">{m.MatterTitle || m.MatterName}</div>
                        <div className="flex items-center gap-2 flex-wrap">
                          {m.MatterStatusName && <span className="text-[11px] font-semibold text-mid">{m.MatterStatusName}</span>}
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
              Data from <a href="https://webapi.legistar.com" target="_blank" rel="noopener noreferrer" className="text-amber">Legistar</a>
              {' '}· Updated in real time · All public record
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!selectedCity && !loading && !search && (
        <div className="text-center py-12 text-mid font-mono text-xs tracking-widest uppercase">
          <div className="font-display text-2xl text-amber mb-2">Search or Select a City</div>
          <p className="text-[10px] normal-case tracking-normal max-w-sm mx-auto mt-2 leading-relaxed">
            Type your city name above or choose from the dropdown.
            Don&apos;t see your city? Many smaller cities aren&apos;t on Legistar —
            search anyway and we&apos;ll show you direct links.
          </p>
        </div>
      )}
    </div>
  );
}
