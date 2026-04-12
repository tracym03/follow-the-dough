import { NextRequest, NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';

const KEY  = process.env.OPENSTATES_API_KEY || '';
const BASE = 'https://v3.openstates.org';

const SUPPORTED = ['CA', 'NY', 'TX', 'FL'] as const;
type SupportedState = typeof SUPPORTED[number];

function parseIdentifier(id: string): { type: string; number: string } {
  const m = id.match(/^([A-Za-z]+)\s*(\d+)$/);
  return { type: m?.[1]?.toUpperCase() || '', number: m?.[2] || id };
}

function mapBill(raw: any, stateCode: string): any {
  const primary = raw.sponsorships?.find((s: any) => s.classification === 'primary')
    ?? raw.sponsorships?.[0]
    ?? null;
  const { type, number } = parseIdentifier(raw.identifier || '');
  const chamberHint = type.startsWith('S') ? 'S' : 'H';

  return {
    type,
    number,
    title:          raw.title || '',
    latestAction:   raw.latest_action_description || '',
    actionDate:     raw.latest_action_date?.substring(0, 10) || '',
    sponsor:        primary?.name || '',
    sponsorName:    primary?.name || '',
    sponsorState:   stateCode,
    sponsorChamber: chamberHint,
    sponsorParty:   '',
    stateUrl:       raw.openstates_url || '',
    isStateBill:    true,
    stateCode,
    session:        raw.session || '',
  };
}

const OCD_ID: Record<string, string> = {
  CA: 'ocd-jurisdiction/country:us/state:ca/government',
  NY: 'ocd-jurisdiction/country:us/state:ny/government',
  TX: 'ocd-jurisdiction/country:us/state:tx/government',
  FL: 'ocd-jurisdiction/country:us/state:fl/government',
};

async function fetchForState(stateCode: string) {
  const url = new URL(`${BASE}/bills`);
  url.searchParams.set('jurisdiction', OCD_ID[stateCode] ?? stateCode.toLowerCase());
  url.searchParams.set('sort', 'updated_desc');
  url.searchParams.set('per_page', '25');
  url.searchParams.append('include', 'sponsorships');

  const r = await fetch(url.toString(), {
    headers: { 'X-API-KEY': KEY, Accept: 'application/json' },
    next: { revalidate: 21600 },
  });
  if (!r.ok) throw new Error(`OpenStates returned ${r.status}`);
  const json = await r.json();
  return {
    bills:   (json.results || []).map((b: any) => mapBill(b, stateCode)),
    total:   json.pagination?.total_items ?? 0,
    session: json.results?.[0]?.session ?? '',
  };
}

// Cache per state — Next.js includes function args in the cache key
const getStateBills = unstable_cache(
  async (stateCode: string) => fetchForState(stateCode),
  ['state-bills-os-v2'],
  { revalidate: 21600 },
);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const state = searchParams.get('state')?.toUpperCase() as SupportedState | undefined;

  if (!state || !(SUPPORTED as readonly string[]).includes(state)) {
    return NextResponse.json({ error: 'state must be CA, NY, TX, or FL' }, { status: 400 });
  }
  if (!KEY) {
    return NextResponse.json({ error: 'OPENSTATES_API_KEY not configured' }, { status: 500 });
  }

  try {
    const data = await getStateBills(state);
    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
