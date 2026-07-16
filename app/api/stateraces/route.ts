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

// ── Hardcoded known 2026 governor candidates ──────────────────────────────────
// Updated as of early 2026. FTM API is unreliable so this is our primary source.
// financeUrl = state campaign finance database
const KNOWN_GOV_CANDIDATES: Record<string, Array<{
  name: string; party: string; title?: string;
  raisedFmt?: string; financeUrl?: string; note?: string;
  donorProfile?: string;
  topDonors?: Array<{ name: string; amount?: number; type: 'individual' | 'pac' | 'corp' | 'note'; note?: string }>;
  calAccessUrl?: string;
}>> = {
  // Source: Cal-Access (CA SOS), CalMatters, ABC7, NPR — updated July 7 2026
  // ✅ June 2 primary complete — Becerra (D) and Hilton (R) advance to November general
  CA: [
    // ── GENERAL ELECTION CONTESTANTS ──
    {
      name: 'Xavier Becerra', party: 'Democrat',
      title: 'Former U.S. Secretary of HHS / Former CA AG',
      note: '🏆 Advances to November — 26.7% primary vote (final)',
      raisedFmt: '$2.9M',
      donorProfile: 'Backed by healthcare, labor, and 500+ Swalwell donors who switched after Swalwell dropped out. Won despite being outspent 70-to-1 by Steyer.',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=becerra',
      topDonors: [
        { name: 'DaVita (dialysis company)',                        type: 'corp', note: 'Switched from Swalwell after dropout' },
        { name: 'California Medical Association PAC',               type: 'pac',  note: 'Major Swalwell backer now supporting Becerra' },
        { name: 'California Professional Firefighters PAC',         type: 'pac',  note: 'Switched to Becerra after Swalwell dropped out' },
        { name: 'Chevron',                                          type: 'corp' },
        { name: '500+ Swalwell donors (redirected to Becerra)',     type: 'note' },
      ],
    },
    {
      name: 'Steve Hilton', party: 'Republican',
      title: 'Former Fox News Host',
      note: '🏆 Advances to November — 26.4% primary vote (final)',
      raisedFmt: '$7.1M',
      donorProfile: 'Broad grassroots conservative base — 30,000+ small-dollar donors via his national TV & podcast profile. Significant out-of-state donations. Self-funded ~$200K.',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=hilton',
      topDonors: [
        { name: '30,000+ small-dollar donors (national conservative base)', type: 'note', note: 'Largest individual donor count among Republican candidates' },
        { name: 'Steve Hilton (self)',                                       type: 'individual', amount: 200000, note: 'Self-funded contribution' },
        { name: 'Lighthouse Worldwide Solutions Inc.',                       type: 'corp', note: 'Notable out-of-state company donor' },
        { name: 'Out-of-state conservative donor networks',                  type: 'note', note: 'National media profile drives donations from across the US' },
      ],
    },
    // ── DID NOT ADVANCE — June 2 primary ──
    {
      name: 'Tom Steyer', party: 'Democrat',
      title: 'Businessman / Former Presidential Candidate',
      note: 'Did not advance — June 2 primary',
      raisedFmt: '$213M (self-funded)',
      donorProfile: 'Spent $213M of his own money — the largest self-funded gubernatorial campaign in CA history — and still did not make the top two. The biggest money-vs-votes upset in the race.',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=steyer',
    },
    {
      name: 'Matt Mahan', party: 'Democrat',
      title: 'Mayor of San Jose',
      note: 'Did not advance — June 2 primary',
      raisedFmt: '$12.7M',
      donorProfile: 'Silicon Valley tech billionaires & venture capitalists — Roblox CEO, Google co-founder, Palantir co-founder, YCombinator, LinkedIn.',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=mahan',
      topDonors: [
        { name: 'David & Jan Baszucki (Roblox CEO)',     amount: 156800, type: 'individual' },
        { name: 'Govern for California PAC (VC / tech)', amount: 300000, type: 'pac' },
        { name: 'Sergey Brin (Google co-founder)',       amount: 78400,  type: 'individual' },
        { name: 'Joe Lonsdale (Palantir co-founder)',    amount: 78400,  type: 'individual' },
        { name: 'Garry Tan (YCombinator CEO)',           amount: 78400,  type: 'individual' },
        { name: 'Michael Moritz (Sequoia Capital)',      amount: 78400,  type: 'individual' },
        { name: 'Reid Hoffman (LinkedIn co-founder)',    amount: 39200,  type: 'individual' },
      ],
    },
    {
      name: 'Antonio Villaraigosa', party: 'Democrat',
      title: 'Former Mayor of Los Angeles',
      note: 'Did not advance — June 2 primary', raisedFmt: '$7.0M',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=villaraigosa',
    },
    {
      name: 'Katie Porter', party: 'Democrat',
      title: 'Former U.S. Representative (CA-47)',
      note: 'Did not advance — June 2 primary', raisedFmt: '$6.2M',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=porter',
    },
    {
      name: 'Chad Bianco', party: 'Republican',
      title: 'Riverside County Sheriff',
      note: 'Did not advance — June 2 primary', raisedFmt: '$4.4M',
      calAccessUrl: 'https://cal-access.sos.ca.gov/Campaign/Candidates/list.aspx?search=bianco',
    },
    { name: 'Betty Yee',      party: 'Democrat', title: 'Former CA State Controller',                     note: 'Did not advance — June 2 primary', raisedFmt: '$1.9M' },
    { name: 'Tony Thurmond',  party: 'Democrat', title: 'State Superintendent of Public Instruction',     note: 'Did not advance — June 2 primary', raisedFmt: '$1.6M' },
    { name: 'Eric Swalwell',  party: 'Democrat', title: 'U.S. Representative (CA-14)',                    note: 'Dropped out' },
  ],
  TX: [
    { name: 'Greg Abbott',     party: 'Republican', title: 'Incumbent Governor',                   note: 'Running for 4th term' },
    { name: 'Gina Hinojosa',   party: 'Democrat',   title: 'State Representative',                 note: 'Democratic nominee' },
  ],
  FL: [
    { name: 'Ron DeSantis',   party: 'Republican', title: 'Incumbent Governor',                    note: 'Term-limited — open race' },
    { name: 'Byron Donalds',  party: 'Republican', title: 'U.S. Representative (FL-19)',           note: 'Announced — Trump-endorsed' },
    { name: 'Jay Collins',    party: 'Republican', title: 'Lt. Governor / Former Army Green Beret', note: 'Announced — Jan 2026' },
    { name: 'Paul Renner',    party: 'Republican', title: 'Former FL House Speaker',               note: 'Announced' },
    { name: 'David Jolly',    party: 'Democrat',   title: 'Former U.S. Representative',            note: 'Announced' },
  ],
  NY: [
    { name: 'Kathy Hochul',     party: 'Democrat',   title: 'Incumbent Governor',                  note: 'Running for re-election — Dem party endorsed' },
    { name: 'Bruce Blakeman',   party: 'Republican', title: 'Nassau County Executive',             note: 'Announced — Trump-endorsed' },
  ],
  IL: [
    { name: 'JB Pritzker', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  PA: [
    { name: 'Josh Shapiro', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  OH: [
    { name: 'Mike DeWine',        party: 'Republican', title: 'Incumbent Governor',                         note: 'Term-limited — open race' },
    { name: 'Vivek Ramaswamy',    party: 'Republican', title: 'Entrepreneur / Former Presidential Candidate', note: 'Won Republican primary — May 5, 2026' },
    { name: 'Amy Acton',          party: 'Democrat',   title: 'Former Ohio Dept. of Health Director',        note: 'Announced — sole Dem candidate' },
  ],
  GA: [
    // ── GENERAL ELECTION CONTESTANTS ──
    { name: 'Rick Jackson',         party: 'Republican', title: 'Businessperson',                       note: '🏆 Republican nominee — won June 16 runoff' },
    { name: 'Keisha Lance Bottoms', party: 'Democrat',   title: 'Former Mayor of Atlanta',              note: '🏆 Democratic nominee' },
    // ── DID NOT ADVANCE ──
    { name: 'Burt Jones',           party: 'Republican', title: 'Lt. Governor of Georgia',              note: 'Lost Republican primary runoff — June 16 (had Trump + Kemp endorsements)' },
    { name: 'Brian Kemp',           party: 'Republican', title: 'Incumbent Governor',                    note: 'Term-limited — open race' },
  ],
  NC: [
    { name: 'Josh Stein', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  MI: [
    { name: 'Gretchen Whitmer', party: 'Democrat',     title: 'Incumbent Governor',                      note: 'Term-limited — open race' },
    { name: 'Jocelyn Benson',   party: 'Democrat',     title: 'Secretary of State',                      note: 'Announced — Democratic frontrunner (leads James 34–29 in May poll)' },
    { name: 'John James',       party: 'Republican',   title: 'U.S. Representative (MI-10)',             note: 'Trump-endorsed (June 22) — Republican frontrunner. Primary Aug 4.' },
    { name: 'Chris Swanson',    party: 'Democrat',     title: 'Genesee County Sheriff',                  note: 'Announced' },
    { name: 'Mike Cox',         party: 'Republican',   title: 'Former Michigan Attorney General',        note: 'Announced — still in race despite Trump endorsing James' },
    { name: 'Aric Nesbitt',     party: 'Republican',   title: 'Michigan Senate Republican Leader',       note: 'Dropped out — June 22, 2026 (endorsed John James after Trump endorsement)' },
    { name: 'Mike Duggan',      party: 'Independent',  title: 'Former Mayor of Detroit',                 note: 'Dropped out — May 21, 2026' },
  ],
  AZ: [
    { name: 'Katie Hobbs', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
    { name: 'Kari Lake', party: 'Republican', note: 'Lost 2022 Gov race + 2024 Senate race — 2026 plans unclear' },
  ],
  CO: [
    { name: 'Jared Polis', party: 'Democrat', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Phil Weiser', party: 'Democrat', title: 'Attorney General', note: 'Announced' },
    { name: 'Heidi Ganahl', party: 'Republican', title: 'Former CU Regent', note: 'Possible candidate' },
  ],
  WA: [
    { name: 'Bob Ferguson', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  MN: [
    { name: 'Tim Walz', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  WI: [
    // Tony Evers is term-limited / retiring — open race. Primary: August 11, 2026.
    { name: 'Tony Evers',      party: 'Democrat',   title: 'Incumbent Governor',                   note: 'Retiring — open race' },
    { name: 'Mandela Barnes',  party: 'Democrat',   title: 'Former Lt. Governor',                  note: 'Announced — Democratic frontrunner (ran for Senate 2022)' },
    { name: 'Sara Rodriguez',  party: 'Democrat',   title: 'Lt. Governor',                         note: 'Announced' },
    { name: 'David Crowley',   party: 'Democrat',   title: 'Milwaukee County Executive',           note: 'Announced' },
    { name: 'Kelda Roys',      party: 'Democrat',   title: 'State Senator',                        note: 'Announced' },
    { name: 'Francesca Hong',  party: 'Democrat',   title: 'State Representative',                 note: 'Announced' },
    { name: 'Tom Tiffany',     party: 'Republican', title: 'U.S. Representative (WI-07)',          note: 'Announced — Republican frontrunner. Primary Aug 11.' },
    { name: 'Andrew Manske',   party: 'Republican', title: 'Republican candidate',                 note: 'Announced' },
  ],
  NV: [
    { name: 'Joe Lombardo', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
    { name: 'Steve Sisolak', party: 'Democrat', title: 'Former Governor', note: 'Possible candidate' },
  ],
  OR: [
    { name: 'Tina Kotek', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  NH: [
    { name: 'Kelly Ayotte', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  VT: [
    { name: 'Phil Scott', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  RI: [
    { name: 'Dan McKee', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  MD: [
    { name: 'Wes Moore', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  MA: [
    { name: 'Maura Healey', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  CT: [
    { name: 'Ned Lamont', party: 'Democrat', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Bob Stefanowski', party: 'Republican', title: 'Former Gubernatorial Candidate', note: 'Possible candidate' },
  ],
  NM: [
    { name: 'Michelle Lujan Grisham', party: 'Democrat', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Mark Ronchetti', party: 'Republican', title: 'Former Meteorologist / Candidate', note: 'Possible candidate' },
  ],
  KS: [
    { name: 'Laura Kelly', party: 'Democrat', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Derek Schmidt', party: 'Republican', title: 'Former AG', note: 'Possible candidate' },
  ],
  IA: [
    { name: 'Kim Reynolds', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Deidre DeJear', party: 'Democrat', title: 'Former Secretary of State candidate', note: 'Possible candidate' },
  ],
  ME: [
    { name: 'Janet Mills', party: 'Democrat', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Paul LePage', party: 'Republican', title: 'Former Governor', note: 'Possible candidate' },
  ],
  AL: [
    { name: 'Kay Ivey', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
  ],
  AR: [
    { name: 'Sarah Huckabee Sanders', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  TN: [
    { name: 'Bill Lee', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
  ],
  OK: [
    { name: 'Kevin Stitt', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'David Walters', party: 'Democrat', title: 'Former Governor', note: 'Possible candidate' },
  ],
  SC: [
    { name: 'Henry McMaster', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  SD: [
    { name: 'Tony Gosch', party: 'Republican', title: 'Governor (succeeded Noem)', note: 'Open race — Noem resigned to become U.S. Secretary of Homeland Security' },
  ],
  WY: [
    { name: 'Mark Gordon', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
  ],
  ID: [
    { name: 'Brad Little', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  HI: [
    { name: 'Josh Green', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  AK: [
    { name: 'Mike Dunleavy', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  NE: [
    { name: 'Jim Pillen', party: 'Republican', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
};

// State campaign finance database URLs
const STATE_FINANCE_URLS: Record<string, { name: string; url: string }> = {
  CA: { name: 'Cal-Access', url: 'https://cal-access.sos.ca.gov/Campaign/Candidates/' },
  TX: { name: 'Texas Ethics Commission', url: 'https://www.ethics.state.tx.us/search/cf/CandidateSearch.php' },
  FL: { name: 'Florida Division of Elections', url: 'https://dos.myflorida.com/elections/candidates-committees/' },
  NY: { name: 'NY Board of Elections', url: 'https://publicreporting.elections.ny.gov/' },
  IL: { name: 'Illinois State Board of Elections', url: 'https://www.elections.il.gov/' },
  PA: { name: 'PA DOS Campaign Finance', url: 'https://www.campaignfinanceonline.pa.gov/' },
  OH: { name: 'Ohio SOS Campaign Finance', url: 'https://www6.ohiosos.gov/campaign-finance-overview/' },
  GA: { name: 'Georgia Ethics Commission', url: 'https://media.ethics.ga.gov/search/Campaign/Campaign_ByName.aspx' },
  WA: { name: 'WA Public Disclosure Commission', url: 'https://www.pdc.wa.gov/browse/candidates-and-campaigns' },
  MI: { name: 'Michigan Campaign Finance', url: 'https://cfrsearch.nictusa.com/candidate/search' },
};

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

    // Use our hardcoded known candidates as the primary source
    // (FollowTheMoney API is unreliable — ConnectTimeoutError)
    const knownCandidates = KNOWN_GOV_CANDIDATES[state] || [];
    const financeDb = STATE_FINANCE_URLS[state] || null;

    const govCandidates = knownCandidates.map(c => ({
      ...c,
      raised: 0,
      raisedFmt: c.raisedFmt || null,
    }));

    const govSource = knownCandidates.length > 0 ? 'Known Announced Candidates' : '';

    return {
      state,
      stateName,
      hasGovRace,
      hasSenateRace,
      govCandidates,
      govSource,
      financeDb,
      dataNote: 'June 2 CA primary complete — Becerra (D) vs Hilton (R) in November general. GA: Rick Jackson (R) won June 16 runoff, faces Bottoms (D). Fundraising from Cal-Access, CalMatters & NPR (through July 2026).',
    };
  },
  ['stateraces-2026-v13'],
  { revalidate: 3600 * 24 } // 24 hours — static data doesn't need frequent refresh
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
