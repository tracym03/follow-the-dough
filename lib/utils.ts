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

export const LEGISTAR_CITIES = [
  { label: 'Atlanta, GA',       client: 'atlanta',      state: 'GA' },
  { label: 'Austin, TX',        client: 'austin',       state: 'TX' },
  { label: 'Baltimore, MD',     client: 'baltimore',    state: 'MD' },
  { label: 'Boston, MA',        client: 'boston',       state: 'MA' },
  { label: 'Charlotte, NC',     client: 'charlotte',    state: 'NC' },
  { label: 'Chicago, IL',       client: 'chicago',      state: 'IL' },
  { label: 'Dallas, TX',        client: 'dallas',       state: 'TX' },
  { label: 'Denver, CO',        client: 'denver',       state: 'CO' },
  { label: 'Detroit, MI',       client: 'detroit',      state: 'MI' },
  { label: 'Houston, TX',       client: 'houston',      state: 'TX' },
  { label: 'Indianapolis, IN',  client: 'indy',         state: 'IN' },
  { label: 'Las Vegas, NV',     client: 'lasvegas',     state: 'NV' },
  { label: 'Los Angeles, CA',   client: 'lacity',       state: 'CA' },
  { label: 'Louisville, KY',    client: 'louisvilleky', state: 'KY' },
  { label: 'Memphis, TN',       client: 'memphis',      state: 'TN' },
  { label: 'Miami, FL',         client: 'miami',        state: 'FL' },
  { label: 'Milwaukee, WI',     client: 'milwaukee',    state: 'WI' },
  { label: 'Minneapolis, MN',   client: 'minneapolis',  state: 'MN' },
  { label: 'Nashville, TN',     client: 'nashville',    state: 'TN' },
  { label: 'New York City, NY', client: 'nyc',          state: 'NY' },
  { label: 'Oakland, CA',       client: 'oakland',      state: 'CA' },
  { label: 'Philadelphia, PA',  client: 'philly',       state: 'PA' },
  { label: 'Phoenix, AZ',       client: 'phoenix',      state: 'AZ' },
  { label: 'Pittsburgh, PA',    client: 'pittsburgh',   state: 'PA' },
  { label: 'Portland, OR',      client: 'portland',     state: 'OR' },
  { label: 'Sacramento, CA',    client: 'sacramento',   state: 'CA' },
  { label: 'San Diego, CA',     client: 'sandiego',     state: 'CA' },
  { label: 'San Francisco, CA', client: 'sfgov',        state: 'CA' },
  { label: 'San Jose, CA',      client: 'sanjose',      state: 'CA' },
  { label: 'Seattle, WA',       client: 'seattle',      state: 'WA' },
];
