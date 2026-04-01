import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

// ── Which states have governor races in 2026 ─────────────────────────────────
const GOV_STATES_2026 = [
  'AL','AK','AZ','AR','CA','CO','CT','FL','GA','HI',
  'ID','IL','IA','KS','ME','MD','MA','MI','MN','NE',
  'NV','NH','NJ','NM','NY','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','VT','WA','WI','WY',
];

// ── Senate seats up in 2026 (Class 2) ────────────────────────────────────────
const SENATE_STATES_2026 = [
  'AL','AK','AR','CO','DE','GA','ID','IL','IA','KS',
  'KY','LA','ME','MA','MI','MN','MS','MT','NE','NH',
  'NJ','NM','NC','OK','OR','RI','SC','SD','TN','TX',
  'VA','WA','WY',
];

// ── OpenFEC for state executive races ────────────────────────────────────────
// FEC actually does track some statewide races (like governor) when candidates
// raise federal PAC money. We can also use their /elections/ endpoint.
const FEC_KEY = process.env.FEC_API_KEY || '';
const FEC_BASE = 'https://api.open.fec.gov/v1';

async function fecGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(FEC_BASE + path);
  url.searchParams.set('api_key', FEC_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FEC ${r.status}`);
  return r.json();
}

// ── FollowTheMoney.org free API ───────────────────────────────────────────────
const FTM_BASE = 'https://api.followthemoney.org';
const FTM_KEY = process.env.FOLLOWTHEMONEY_API_KEY || '';

async function ftmGet(params: Record<string, string>) {
  const url = new URL(`${FTM_BASE}/`);
  if (FTM_KEY) url.searchParams.set('APIKey', FTM_KEY);
  url.searchParams.set('output', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FollowTheMoney ${r.status}`);
  return r.json();
}

function fmt(n: number | null): string {
  if (!n) return '$0';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(0) + 'K';
  return '$' + n.toLocaleString();
}

function tc(s: string): string {
  if (!s) return '';
  return s.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ── State names ───────────────────────────────────────────────────────────────
const STATE_NAMES: Record<string, string> = {
  CA: 'California', TX: 'Texas', FL: 'Florida', NY: 'New York',
  IL: 'Illinois', PA: 'Pennsylvania', OH: 'Ohio', GA: 'Georgia',
  NC: 'North Carolina', MI: 'Michigan', NJ: 'New Jersey', VA: 'Virginia',
  WA: 'Washington', AZ: 'Arizona', MA: 'Massachusetts', TN: 'Tennessee',
  IN: 'Indiana', MO: 'Missouri', MD: 'Maryland', WI: 'Wisconsin',
  CO: 'Colorado', MN: 'Minnesota', SC: 'South Carolina', AL: 'Alabama',
  LA: 'Louisiana', KY: 'Kentucky', OR: 'Oregon', OK: 'Oklahoma',
  CT: 'Connecticut', UT: 'Utah', IA: 'Iowa', NV: 'Nevada',
  AR: 'Arkansas', MS: 'Mississippi', KS: 'Kansas', NM: 'New Mexico',
  NE: 'Nebraska', ID: 'Idaho', WV: 'West Virginia', HI: 'Hawaii',
  NH: 'New Hampshire', ME: 'Maine', MT: 'Montana', RI: 'Rhode Island',
  DE: 'Delaware', SD: 'South Dakota', ND: 'North Dakota', AK: 'Alaska',
  VT: 'Vermont', WY: 'Wyoming',
};

const getStateRaces = unstable_cache(
  async (state: string) => {
    const hasGovRace = GOV_STATES_2026.includes(state);
    const hasSenateRace = SENATE_STATES_2026.includes(state);
    const stateName = STATE_NAMES[state] || state;
    let govCandidates: any[] = [];
    let govSource = '';

    // ── Try FollowTheMoney for governor candidates ────────────────────────────
    if (hasGovRace) {
      try {
        // FTM general-purpose candidate search for governor races
        const data = await ftmGet({
          's': state,
          'y': '2026',
          'f': 'Candidate,Party,Raised,Spent,Cash',
          'gro': 'Candidate',
          'c-t-eid': '5', // office type: governor
        });

        const records: any[] = data?.records || data?.result || [];
        if (records.length > 0) {
          govCandidates = records.slice(0, 8).map((r: any) => ({
            name: tc(r['Candidate'] || r['c-n'] || ''),
            party: r['Party'] || r['p-s'] || '',
            raised: parseFloat((r['Raised'] || '0').toString().replace(/[$,]/g, '')),
            spent: parseFloat((r['Spent'] || '0').toString().replace(/[$,]/g, '')),
            raisedFmt: fmt(parseFloat((r['Raised'] || '0').toString().replace(/[$,]/g, ''))),
          })).filter((c: any) => c.name);
          govSource = 'FollowTheMoney.org';
        }
      } catch { /* fall through to FEC */ }

      // ── Fallback: Try FEC for any statewide filings ───────────────────────
      if (govCandidates.length === 0) {
        try {
          const fecData = await fecGet('/candidates/', {
            state,
            office: 'P', // FEC doesn't track Gov, but try anyway
            election_year: 2026,
            per_page: 6,
          });
          // FEC won't have gov data, this is a no-op fallback
          void fecData;
        } catch { /* expected */ }
      }
    }

    return {
      state,
      stateName,
      hasGovRace,
      hasSenateRace,
      govCandidates,
      govSource,
      hasFtmKey: !!FTM_KEY,
    };
  },
  ['stateraces-2026'],
  { revalidate: 3600 * 6 } // 6 hours
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');
  if (!state) return NextResponse.json({ error: 'state required' }, { status: 400 });
  try {
    const data = await getStateRaces(state);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
