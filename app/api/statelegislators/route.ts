import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const KEY  = process.env.OPENSTATES_API_KEY || '';
const BASE = 'https://v3.openstates.org';

async function fetchLegislators(zip: string) {
  // 1. ZIP → lat/lng via zippopotam.us (free, no auth required)
  const geoRes = await fetch(`https://api.zippopotam.us/us/${zip}`, {
    headers: { Accept: 'application/json' },
  });
  if (!geoRes.ok) throw new Error('Could not geocode ZIP code');
  const geo = await geoRes.json();
  const place = geo.places?.[0];
  if (!place) throw new Error('No location found for this ZIP');

  const lat = place.latitude;
  const lng = place.longitude;

  // 2. lat/lng → state legislators via OpenStates /people/geo
  const url = new URL(`${BASE}/people/geo`);
  url.searchParams.set('lat', lat);
  url.searchParams.set('lng', lng);

  const res = await fetch(url.toString(), {
    headers: { 'X-API-KEY': KEY, Accept: 'application/json' },
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`OpenStates returned ${res.status}`);
  const data = await res.json();

  const legislators = (data.results || []).map((p: any) => ({
    name:     p.name,
    party:    p.party,
    chamber:  p.current_role?.org_classification ?? '',   // 'upper' | 'lower'
    district: p.current_role?.district ?? '',
    title:    p.current_role?.title ?? '',
    url:      p.openstates_url ?? '',
    image:    p.image ?? '',
    email:    p.email ?? '',
  }));

  // Sort: upper (state senate) first, then lower (assembly/house)
  legislators.sort((a: any, b: any) => {
    if (a.chamber === b.chamber) return 0;
    return a.chamber === 'upper' ? -1 : 1;
  });

  return { legislators };
}

const getLegislators = unstable_cache(
  async (zip: string) => fetchLegislators(zip),
  ['state-legislators-v1'],
  { revalidate: 86400 },
);

export async function GET(req: NextRequest) {
  const zip = req.nextUrl.searchParams.get('zip');
  if (!zip) return NextResponse.json({ error: 'zip required' }, { status: 400 });
  if (!KEY) return NextResponse.json({ error: 'OPENSTATES_API_KEY not configured' }, { status: 500 });

  try {
    const data = await getLegislators(zip);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
