import { NextRequest, NextResponse } from 'next/server';

const CONGRESS_KEY = process.env.CONGRESS_API_KEY || 'DEMO_KEY';
const CONGRESS_BASE = 'https://api.congress.gov/v3';

async function congressGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(CONGRESS_BASE + path);
  url.searchParams.set('api_key', CONGRESS_KEY);
  url.searchParams.set('format', 'json');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }
  const r = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    next: { revalidate: 3600 },
  });
  if (!r.ok) throw new Error(`Congress API ${r.status}`);
  return r.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state');
  const stateName = searchParams.get('stateName') || state || '';

  if (!state) return NextResponse.json({ error: 'state required' }, { status: 400 });

  try {
    // Get current members for this state in the 119th Congress
    const membersResp = await congressGet('/member', {
      stateCode: state,
      congress: 119,
      currentMember: 'true',
      limit: 10,
    });

    const members: any[] = membersResp.members || [];

    if (!members.length) {
      return NextResponse.json({ bills: [], state, stateName });
    }

    // Get sponsored bills from first few members
    const billArrays = await Promise.all(
      members.slice(0, 4).map(async (m: any) => {
        try {
          const bioId = m.bioguideId;
          const resp = await congressGet(`/member/${bioId}/sponsored-legislation`, {
            limit: 5,
            offset: 0,
          });
          const sponsored: any[] = resp.sponsoredLegislation || [];
          return sponsored.map((b: any) => ({
            number: b.number || '',
            title: b.title || '',
            sponsor: `${m.name} (${m.partyName?.charAt(0) || '?'})`,
            latestAction: b.latestAction?.text || '',
            actionDate: b.latestAction?.actionDate || '',
            url: b.url || '',
            type: b.type || 'HR',
            congress: b.congress || 119,
          }));
        } catch {
          return [];
        }
      })
    );

    const allBills = billArrays.flat().slice(0, 10);
    return NextResponse.json({ bills: allBills, state, stateName, members: members.map((m: any) => m.name) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
