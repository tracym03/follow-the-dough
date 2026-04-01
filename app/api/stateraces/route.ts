import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const FTM_KEY = process.env.FOLLOWTHEMONEY_API_KEY || '';
const FTM_BASE = 'https://api.followthemoney.org';

// Governor election years by state (2026 cycle)
const GOV_STATES_2026 = [
  'AL','AK','AZ','AR','CA','CO','CT','FL','GA','HI',
  'ID','IL','IA','KS','ME','MD','MA','MI','MN','NE',
  'NV','NH','NJ','NM','NY','OH','OK','OR','PA','RI',
  'SC','SD','TN','TX','VT','VA','WA','WI','WY',
];

// Senate seats up in 2026 (Class 2)
const SENATE_STATES_2026 = [
  'AL','AK','AR','CO','DE','GA','ID','IL','IA','KS',
  'KY','LA','ME','MA','MI','MN','MS','MT','NE','NH',
  'NJ','NM','NC','OK','OR','RI','SC','SD','TN','TX',
  'VA','WA','WY',
];

async function ftmGet(params: Record<string, string>) {
  if (!FTM_KEY) throw new Error('FOLLOWTHEMONEY_API_KEY not set');
  const url = new URL(`${FTM_BASE}/`);
  url.searchParams.set('APIKey', FTM_KEY);
  url.searchParams.set('output', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const r = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`FollowTheMoney ${r.status}`);
  return r.json();
}

const getStateRaces = unstable_cache(
  async (state: string) => {
    const races: any[] = [];
    const hasGovRace = GOV_STATES_2026.includes(state);
    const hasSenateRace = SENATE_STATES_2026.includes(state);

    if (FTM_KEY) {
      // Fetch governor candidates if state has a 2026 gov race
      if (hasGovRace) {
        try {
          const data = await ftmGet({
            'c-t-eid': '24',   // election type: governor
            's': state,
            'c-t-y': '2026',
            'gro': 'c-t-id',
            'f': 'c-t-id,c-n,p-s,p-r,c-t-ico',
          });
          const candidates = data?.records || [];
          races.push({
            office: 'Governor',
            election: `${state} Governor · 2026`,
            candidates: candidates.slice(0, 6).map((c: any) => ({
              name: c['Candidate Name'] || c['c-n'] || 'Unknown',
              party: c['Party'] || c['p-s'] || '',
              raised: parseFloat(c['Raised'] || c['p-r'] || '0'),
              source: 'FollowTheMoney.org',
            })),
          });
        } catch { /* skip if API unavailable */ }
      }
    }

    // Always return metadata about what races exist, even without API key
    return {
      state,
      hasGovRace,
      hasSenateRace,
      races,
      hasFtmKey: !!FTM_KEY,
    };
  },
  ['stateraces-2026'],
  { revalidate: 86400 }
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
