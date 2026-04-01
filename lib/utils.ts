export function zipToState(zip: string): { state: string; name: string } | null {
  const z = parseInt(zip.substring(0, 3));
  const m: [number, number, string, string][] = [
    [0, 99, 'PR', 'Puerto Rico'],
    [100, 149, 'NY', 'New York'],
    [150, 196, 'PA', 'Pennsylvania'],
    [197, 199, 'DE', 'Delaware'],
    [200, 205, 'DC', 'Washington DC'],
    [206, 219, 'MD', 'Maryland'],
    [220, 246, 'VA', 'Virginia'],
    [247, 268, 'WV', 'West Virginia'],
    [270, 289, 'NC', 'North Carolina'],
    [290, 299, 'SC', 'South Carolina'],
    [300, 319, 'GA', 'Georgia'],
    [320, 349, 'FL', 'Florida'],
    [350, 369, 'AL', 'Alabama'],
    [370, 385, 'TN', 'Tennessee'],
    [386, 397, 'MS', 'Mississippi'],
    [400, 427, 'KY', 'Kentucky'],
    [430, 458, 'OH', 'Ohio'],
    [460, 479, 'IN', 'Indiana'],
    [480, 499, 'MI', 'Michigan'],
    [500, 528, 'IA', 'Iowa'],
    [530, 549, 'WI', 'Wisconsin'],
    [550, 567, 'MN', 'Minnesota'],
    [570, 577, 'SD', 'South Dakota'],
    [580, 588, 'ND', 'North Dakota'],
    [590, 599, 'MT', 'Montana'],
    [600, 629, 'IL', 'Illinois'],
    [630, 658, 'MO', 'Missouri'],
    [660, 679, 'KS', 'Kansas'],
    [680, 693, 'NE', 'Nebraska'],
    [700, 714, 'LA', 'Louisiana'],
    [716, 729, 'AR', 'Arkansas'],
    [730, 749, 'OK', 'Oklahoma'],
    [750, 799, 'TX', 'Texas'],
    [800, 816, 'CO', 'Colorado'],
    [820, 831, 'WY', 'Wyoming'],
    [832, 838, 'ID', 'Idaho'],
    [840, 847, 'UT', 'Utah'],
    [850, 865, 'AZ', 'Arizona'],
    [870, 884, 'NM', 'New Mexico'],
    [885, 898, 'NV', 'Nevada'],
    [900, 966, 'CA', 'California'],
    [967, 968, 'HI', 'Hawaii'],
    [970, 979, 'OR', 'Oregon'],
    [980, 994, 'WA', 'Washington'],
    [995, 999, 'AK', 'Alaska'],
  ];
  for (const [lo, hi, st, name] of m) {
    if (z >= lo && z <= hi) return { state: st, name };
  }
  return null;
}

export function fmt(n: number | null | undefined): string {
  if (n == null) return '–';
  const v = Math.abs(n);
  if (v >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (v >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return '$' + (v / 1e3).toFixed(0) + 'K';
  return '$' + v.toLocaleString();
}

export function tc(s: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function partyFull(p: string): string {
  const map: Record<string, string> = {
    DEM: 'Democrat',
    REP: 'Republican',
    IND: 'Independent',
    LIB: 'Libertarian',
    GRE: 'Green',
  };
  return map[p] || p || '?';
}

export function partyBorderClass(p: string): string {
  if (p === 'DEM') return 'border-l-ftdblue';
  if (p === 'REP') return 'border-l-ftdred';
  if (p === 'IND') return 'border-l-ftdgreen';
  return 'border-l-amber';
}

export function partyPillClass(p: string): string {
  if (p === 'DEM') return 'bg-blue-100 text-ftdblue';
  if (p === 'REP') return 'bg-red-100 text-ftdred';
  if (p === 'IND') return 'bg-green-100 text-ftdgreen';
  return 'bg-lb text-mid';
}

export function officeStr(office: string, state: string, district?: string): string {
  const map: Record<string, string> = { H: 'U.S. House', S: 'U.S. Senate', P: 'Presidential' };
  let s = (map[office] || 'Federal') + ' · ' + (state || '');
  if (office === 'H' && district) s += '-' + String(district).padStart(2, '0');
  return s;
}

export function billStatusClass(action: string): string {
  const l = action.toLowerCase();
  if (l.includes('pass') || l.includes('sign') || l.includes('enact')) return 'bg-blue-100 text-ftdblue';
  if (l.includes('fail') || l.includes('veto') || l.includes('dead') || l.includes('table')) return 'bg-red-100 text-ftdred';
  if (l.includes('introduc') || l.includes('refer') || l.includes('commit')) return 'bg-green-100 text-ftdgreen';
  return 'bg-lb text-mid';
}

// Cities that use Legistar's public API (webapi.legistar.com)
// Grouped by region for easier navigation
// Only cities confirmed working (HTTP 200) as of March 2026.
// Tested against webapi.legistar.com — 500/403 cities removed to prevent error screens.
export const LEGISTAR_CITIES: { label: string; client: string; state: string; group: string }[] = [
  // ── Orange County, CA ────────────────────────────────────────────────────
  { label: 'Huntington Beach, CA',  client: 'huntingtonbeach', state: 'CA', group: 'Orange County, CA' },
  { label: 'Costa Mesa, CA',        client: 'costamesa',       state: 'CA', group: 'Orange County, CA' },
  { label: 'Fullerton, CA',         client: 'fullerton',       state: 'CA', group: 'Orange County, CA' },

  // ── Southern California ───────────────────────────────────────────────────
  { label: 'Long Beach, CA',        client: 'longbeach',       state: 'CA', group: 'Southern California' },

  // ── Northern California ───────────────────────────────────────────────────
  { label: 'San Francisco, CA',     client: 'sfgov',           state: 'CA', group: 'Northern California' },
  { label: 'San Jose, CA',          client: 'sanjose',         state: 'CA', group: 'Northern California' },
  { label: 'Oakland, CA',           client: 'oakland',         state: 'CA', group: 'Northern California' },
  { label: 'Sacramento, CA',        client: 'sacramento',      state: 'CA', group: 'Northern California' },
  { label: 'Stockton, CA',          client: 'stockton',        state: 'CA', group: 'Northern California' },

  // ── Texas ─────────────────────────────────────────────────────────────────
  { label: 'San Antonio, TX',       client: 'sanantonio',      state: 'TX', group: 'Texas' },

  // ── Northeast ─────────────────────────────────────────────────────────────
  { label: 'Boston, MA',            client: 'boston',          state: 'MA', group: 'Northeast' },
  { label: 'Pittsburgh, PA',        client: 'pittsburgh',      state: 'PA', group: 'Northeast' },
  { label: 'Baltimore, MD',         client: 'baltimore',       state: 'MD', group: 'Northeast' },

  // ── Midwest ───────────────────────────────────────────────────────────────
  { label: 'Chicago, IL',           client: 'chicago',         state: 'IL', group: 'Midwest' },
  { label: 'Columbus, OH',          client: 'columbus',        state: 'OH', group: 'Midwest' },
  { label: 'Detroit, MI',           client: 'detroit',         state: 'MI', group: 'Midwest' },
  { label: 'Milwaukee, WI',         client: 'milwaukee',       state: 'WI', group: 'Midwest' },
  { label: 'Kansas City, MO',       client: 'kansascity',      state: 'MO', group: 'Midwest' },

  // ── South ─────────────────────────────────────────────────────────────────
  { label: 'Nashville, TN',         client: 'nashville',       state: 'TN', group: 'South' },

  // ── Mountain & Pacific ────────────────────────────────────────────────────
  { label: 'Seattle, WA',           client: 'seattle',         state: 'WA', group: 'Mountain & Pacific' },
  { label: 'Denver, CO',            client: 'denver',          state: 'CO', group: 'Mountain & Pacific' },
  { label: 'Phoenix, AZ',           client: 'phoenix',         state: 'AZ', group: 'Mountain & Pacific' },
];

// Cities NOT on Legistar — show helpful links instead
export const NON_LEGISTAR_CITIES: { label: string; state: string; website: string; financeUrl?: string }[] = [
  { label: 'San Clemente, CA',    state: 'CA', website: 'https://san-clemente.org/government/city-council', financeUrl: 'https://www.fppc.ca.gov/transparency/campaign-disclosure-portals.html' },
  { label: 'Dana Point, CA',      state: 'CA', website: 'https://www.danapoint.org/government/city-council' },
  { label: 'San Juan Capistrano, CA', state: 'CA', website: 'https://www.sanjuancapistrano.org/government/city-council' },
  { label: 'Laguna Beach, CA',    state: 'CA', website: 'https://www.lagunabeachcity.net/government/city-council' },
  { label: 'Newport Beach, CA',   state: 'CA', website: 'https://www.newportbeachca.gov/government/departments/city-council' },
  { label: 'Mission Viejo, CA',   state: 'CA', website: 'https://www.cityofmissionviejo.org/government/city-council' },
  { label: 'Lake Forest, CA',     state: 'CA', website: 'https://www.lakeforestca.gov/government/mayor-city-council' },
  { label: 'Aliso Viejo, CA',     state: 'CA', website: 'https://www.cityofalisoviego.com/government/city-council' },
];
