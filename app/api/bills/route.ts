import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const CONGRESS_KEY = process.env.CONGRESS_API_KEY || '';
const CONGRESS_BASE = 'https://api.congress.gov/v3';

// Congress API returns full state names; we need to match against 2-letter codes
const STATE_FULL: Record<string, string> = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',
  CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',
  KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',
  MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',
  VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
  DC:'District of Columbia',
};

async function congressGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(CONGRESS_BASE + path);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  // Send key in both header and query param for maximum compatibility
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (CONGRESS_KEY) {
    headers['X-Api-Key'] = CONGRESS_KEY;
    url.searchParams.set('api_key', CONGRESS_KEY);
  }
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    throw new Error(`Congress API ${r.status}: ${text.substring(0, 200)}`);
  }
  return r.json();
}

const getBillsData = unstable_cache(
  async (state: string, stateName: string) => {
    // NOTE: state is intentionally used as part of the cache key below
    // NOTE: DEMO_KEY ignores stateCode filtering — fetch more and filter client-side
    const stateFull = STATE_FULL[state] || state;
    const membersResp = await congressGet('/member', {
      stateCode: state,
      congress: 119,
      currentMember: 'true',
      limit: 50,
    });

    const allMembers: any[] = membersResp.members || [];
    // Filter to only members actually representing this state (DEMO_KEY ignores server-side filter)
    const members: any[] = allMembers.filter((m: any) =>
      !m.state || m.state === stateFull
    );
    if (!members.length) return { bills: [], state, stateName, members: [], noStateMembers: true };

    const billArrays = await Promise.all(
      members.slice(0, 5).map(async (m: any) => {
        try {
          const resp = await congressGet(`/member/${m.bioguideId}/sponsored-legislation`, {
            limit: 4,
            offset: 0,
          });
          const chamber = (b: any) => {
            const t = (b.type || 'HR').toUpperCase();
            return t.startsWith('S') ? 'S' : 'H';
          };
          return (resp.sponsoredLegislation || []).map((b: any) => ({
            number: b.number || '',
            title: b.title || '',
            sponsor: `${m.name} (${m.partyName?.charAt(0) || '?'}-${state})`,
            sponsorName: m.name || '',           // clean name for FEC lookup
            sponsorState: state,                  // use query state code for FEC lookup
            sponsorParty: m.partyName?.charAt(0) || '',
            sponsorChamber: chamber(b),           // 'H' or 'S'
            latestAction: b.latestAction?.text || '',
            actionDate: b.latestAction?.actionDate || '',
            type: b.type || 'HR',
            congress: b.congress || 119,
          }));
        } catch {
          return [];
        }
      })
    );

    return {
      bills: billArrays.flat().slice(0, 12),
      state,
      stateName,
      members: members.map((m: any) => m.name),
      noStateMembers: false,
    };
  },
  // Include state in cache key so each state gets its own cache entry
  ['bills', 'v3'],
  { revalidate: 21600 }
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');
  const stateName = searchParams.get('stateName') || state || '';

  if (!state) return NextResponse.json({ error: 'state required' }, { status: 400 });

  if (!CONGRESS_KEY) {
    return NextResponse.json({
      error: 'Congress API key not configured. Add CONGRESS_API_KEY to your Vercel environment variables.',
    }, { status: 500 });
  }

  try {
    const data = await getBillsData(state, stateName);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
