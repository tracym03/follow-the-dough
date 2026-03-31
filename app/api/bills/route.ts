import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const CONGRESS_KEY = process.env.CONGRESS_API_KEY || '';
const CONGRESS_BASE = 'https://api.congress.gov/v3';

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
    const membersResp = await congressGet('/member', {
      stateCode: state,
      congress: 119,
      currentMember: 'true',
      limit: 10,
    });

    const members: any[] = membersResp.members || [];
    if (!members.length) return { bills: [], state, stateName, members: [] };

    const billArrays = await Promise.all(
      members.slice(0, 5).map(async (m: any) => {
        try {
          const resp = await congressGet(`/member/${m.bioguideId}/sponsored-legislation`, {
            limit: 4,
            offset: 0,
          });
          return (resp.sponsoredLegislation || []).map((b: any) => ({
            number: b.number || '',
            title: b.title || '',
            sponsor: `${m.name} (${m.partyName?.charAt(0) || '?'})`,
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
    };
  },
  ['bills'],
  { revalidate: 21600 } // cache 6 hours
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
