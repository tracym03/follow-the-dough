import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const CONGRESS_KEY = process.env.CONGRESS_API_KEY || '';
const CONGRESS_BASE = 'https://api.congress.gov/v3';

async function congressGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(CONGRESS_BASE + path);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (CONGRESS_KEY) {
    headers['X-Api-Key'] = CONGRESS_KEY;
    url.searchParams.set('api_key', CONGRESS_KEY);
  }
  const r = await fetch(url.toString(), { headers });
  if (!r.ok) throw new Error(`Congress API ${r.status}: ${path}`);
  return r.json();
}

const getAllBills = unstable_cache(
  async () => {
    // Fetch most recently active bills from ALL of Congress — not a sample.
    // The /bill/{congress} endpoint returns bills sorted by latest action date desc by default.
    const resp = await congressGet('/bill/119', { limit: 60, offset: 0 });

    const bills = (resp.bills ?? [])
      .filter((b: any) => b.title)
      .map((b: any) => {
        const sponsor = b.sponsors?.[0];
        const fullName: string  = sponsor?.fullName ?? '';
        const partyChar: string = sponsor?.party?.charAt(0) ?? '?';
        const memberState: string = sponsor?.state ?? '';
        const rawType = (b.type ?? 'HR').toUpperCase();

        return {
          number:         b.number ?? '',
          title:          b.title  ?? '',
          sponsor:        fullName ? `${fullName} (${partyChar}-${memberState})` : '',
          sponsorName:    fullName,
          sponsorState:   memberState,
          sponsorParty:   partyChar,
          sponsorChamber: rawType.startsWith('S') ? 'S' : 'H',
          latestAction:   b.latestAction?.text        ?? '',
          actionDate:     b.latestAction?.actionDate  ?? '',
          type:           b.type    ?? 'HR',
          congress:       b.congress ?? 119,
        };
      });

    return { bills };
  },
  ['bills-all-v2'],
  { revalidate: 21600 }
);

export async function GET() {
  if (!CONGRESS_KEY) {
    return NextResponse.json({ error: 'Congress API key not configured.' }, { status: 500 });
  }
  try {
    const data = await getAllBills();
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
