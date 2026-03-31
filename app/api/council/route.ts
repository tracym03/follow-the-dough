import { NextRequest, NextResponse } from 'next/server';

const LEGISTAR_BASE = 'https://webapi.legistar.com/v1';

async function legistar(client: string, endpoint: string, params = '') {
  const url = `${LEGISTAR_BASE}/${client}/${endpoint}${params}`;
  const r = await fetch(url, { next: { revalidate: 1800 } });
  if (!r.ok) throw new Error(`Legistar ${r.status}`);
  return r.json();
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('city');

  if (!city) return NextResponse.json({ error: 'city required' }, { status: 400 });

  try {
    const pastDate = new Date(Date.now() - 60 * 86400000).toISOString().slice(0, 10);
    const futDate = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);

    const [persons, events, matters] = await Promise.all([
      legistar(city, 'persons', '?$top=80&$filter=PersonActiveFlag%20eq%201&$orderby=PersonLastName%20asc'),
      legistar(city, 'events', `?$top=10&$orderby=EventDate%20desc&$filter=EventDate%20ge%20datetime%27${pastDate}%27%20and%20EventDate%20le%20datetime%27${futDate}%27`),
      legistar(city, 'matters', '?$top=15&$orderby=MatterLastModifiedUtc%20desc'),
    ]);

    // Get vote records for recent matters
    const voteMap: Record<number, any> = {};
    await Promise.all(
      (matters as any[]).slice(0, 6).map(async (m: any) => {
        try {
          const hist = await legistar(city, `matters/${m.MatterId}/histories`, '?$top=5&$filter=MatterHistoryPassedFlag+ne+null');
          if ((hist as any[]).length) voteMap[m.MatterId] = hist[0];
        } catch { /* skip */ }
      })
    );

    return NextResponse.json({ persons, events, matters, voteMap, city });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, city }, { status: 500 });
  }
}
