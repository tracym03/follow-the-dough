import { NextResponse } from 'next/server';

const CONGRESS_KEY = process.env.CONGRESS_API_KEY || '';
const CONGRESS_BASE = 'https://api.congress.gov/v3';

async function congressGet(path: string, params: Record<string, string | number> = {}) {
  const url = new URL(CONGRESS_BASE + path);
  url.searchParams.set('format', 'json');
  // Note: DO NOT pass sort values with + in them — URLSearchParams encodes + as %2B
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (CONGRESS_KEY) {
    headers['X-Api-Key'] = CONGRESS_KEY;
    url.searchParams.set('api_key', CONGRESS_KEY);
  }
  const r = await fetch(url.toString(), {
    headers,
    next: { revalidate: 21600 },
  });
  if (!r.ok) throw new Error(`Congress API ${r.status}: ${path}`);
  return r.json();
}

// Fetch members at 5 different alphabetical offsets.
// Congress has ~535 members sorted by name; sampling at 0, 80, 160, 240, 320
// gives members from A through Z = all 50 states represented.
const MEMBER_OFFSETS = [0, 80, 160, 240, 320];
const MEMBERS_PER_PAGE = 8;   // 5 × 8 = 40 members
const BILLS_PER_MEMBER  = 4;

export async function GET() {
  if (!CONGRESS_KEY) {
    return NextResponse.json({ error: 'Congress API key not configured.' }, { status: 500 });
  }

  // ── Step 1: fetch members from 5 spread-out alphabetical positions ──────────
  const memberPages = await Promise.allSettled(
    MEMBER_OFFSETS.map(offset =>
      congressGet('/member', {
        congress: 119,
        currentMember: 'true',
        limit:  MEMBERS_PER_PAGE,
        offset,
      })
    )
  );

  // Deduplicate (shouldn't overlap at these offsets, but just in case)
  const seen = new Set<string>();
  const members: any[] = memberPages
    .flatMap(r => (r.status === 'fulfilled' ? r.value?.members ?? [] : []))
    .filter(m => {
      if (!m.bioguideId || seen.has(m.bioguideId)) return false;
      seen.add(m.bioguideId);
      return true;
    });

  if (!members.length) {
    return NextResponse.json({ bills: [], debug: 'no members returned' });
  }

  // ── Step 2: fetch sponsored legislation for every member ────────────────────
  const billResults = await Promise.allSettled(
    members.map(async (m: any) => {
      const resp = await congressGet(`/member/${m.bioguideId}/sponsored-legislation`, {
        limit:  BILLS_PER_MEMBER,
        offset: 0,
      });

      const rawName: string = m.name ?? '';
      const parts = rawName.split(',').map((s: string) => s.trim());
      const displayName = parts.length === 2 ? `${parts[1]} ${parts[0]}` : rawName;
      const partyChar: string = m.partyName?.charAt(0) ?? '?';
      const memberState: string = m.state ?? '';

      return (resp.sponsoredLegislation ?? []).map((b: any) => {
        const rawType = (b.type ?? 'HR').toUpperCase();
        return {
          number:          b.number ?? '',
          title:           b.title  ?? '',
          sponsor:         `${displayName} (${partyChar}-${memberState})`,
          sponsorName:     rawName,          // "Last, First" for FEC lookup
          sponsorState:    memberState,
          sponsorParty:    partyChar,
          sponsorChamber:  rawType.startsWith('S') ? 'S' : 'H',
          latestAction:    b.latestAction?.text       ?? '',
          actionDate:      b.latestAction?.actionDate ?? '',
          type:            b.type    ?? 'HR',
          congress:        b.congress ?? 119,
        };
      });
    })
  );

  const bills = billResults
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(b => b.title);

  // Surface member states for debugging — remove once confirmed working
  const statesRepresented = [...new Set(bills.map(b => b.sponsorState))].sort();

  return NextResponse.json({ bills, memberCount: members.length, statesRepresented });
}
