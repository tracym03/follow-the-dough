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
}>> = {
  // Source: CalMatters, GV Wire, campaign press releases — updated April 2026
  CA: [
    { name: 'Tom Steyer',           party: 'Democrat',    title: 'Businessman / Former Presidential Candidate',    note: 'Announced', raisedFmt: '$112M (self-funded)' },
    { name: 'Matt Mahan',           party: 'Democrat',    title: 'Mayor of San Jose',                              note: 'Announced', raisedFmt: '$11.5M' },
    { name: 'Steve Hilton',         party: 'Republican',  title: 'Former Fox News Host',                           note: 'Announced', raisedFmt: '$6.6M' },
    { name: 'Antonio Villaraigosa', party: 'Democrat',    title: 'Former Mayor of Los Angeles',                    note: 'Announced', raisedFmt: '$6.3M' },
    { name: 'Katie Porter',         party: 'Democrat',    title: 'Former U.S. Representative (CA-47)',             note: 'Announced', raisedFmt: '$6.1M' },
    { name: 'Chad Bianco',          party: 'Republican',  title: 'Riverside County Sheriff',                       note: 'Announced', raisedFmt: '~$4.6M' },
    { name: 'Xavier Becerra',       party: 'Democrat',    title: 'Former U.S. Secretary of HHS / Former CA AG',    note: 'Announced', raisedFmt: '$2.9M' },
    { name: 'Betty Yee',            party: 'Democrat',    title: 'Former CA State Controller',                     note: 'Announced', raisedFmt: '$345K' },
    { name: 'Tony Thurmond',        party: 'Democrat',    title: 'State Superintendent of Public Instruction',     note: 'Announced', raisedFmt: '$181K' },
    { name: 'Eric Swalwell',        party: 'Democrat',    title: 'U.S. Representative (CA-14)',                    note: 'Dropped out' },
  ],
  TX: [
    { name: 'Greg Abbott', party: 'Republican', title: 'Incumbent Governor', note: 'Incumbent' },
  ],
  FL: [
    { name: 'Ron DeSantis', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Jimmy Patronis', party: 'Republican', title: 'State CFO', note: 'Announced' },
    { name: 'Nikki Fried', party: 'Democrat', title: 'Former Ag Commissioner', note: 'Exploring' },
  ],
  NY: [
    { name: 'Kathy Hochul', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
    { name: 'Lee Zeldin', party: 'Republican', title: 'Former Congressman', note: 'Possible challenger' },
  ],
  IL: [
    { name: 'JB Pritzker', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  PA: [
    { name: 'Josh Shapiro', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  OH: [
    { name: 'Mike DeWine', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Jon Husted', party: 'Republican', title: 'Lt. Governor', note: 'Announced' },
    { name: 'Nan Whaley', party: 'Democrat', title: 'Former Mayor of Dayton', note: 'Exploring' },
  ],
  GA: [
    { name: 'Brian Kemp', party: 'Republican', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Brad Raffensperger', party: 'Republican', title: 'Secretary of State', note: 'Possible candidate' },
    { name: 'Stacey Abrams', party: 'Democrat', title: 'Former Gubernatorial Candidate', note: 'Possible candidate' },
  ],
  NC: [
    { name: 'Josh Stein', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
  ],
  MI: [
    { name: 'Gretchen Whitmer', party: 'Democrat', title: 'Incumbent Governor', note: 'Term-limited — open race' },
    { name: 'Tudor Dixon', party: 'Republican', title: 'Former Gubernatorial Candidate', note: 'Possible candidate' },
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
    { name: 'Tony Evers', party: 'Democrat', title: 'Incumbent Governor', note: 'Running for re-election' },
    { name: 'Eric Toney', party: 'Republican', title: 'Former AG candidate', note: 'Possible candidate' },
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
      dataNote: 'Fundraising figures from CalMatters & campaign reports (through Q1 2026). State finance data via Cal-Access.',
    };
  },
  ['stateraces-2026-v5'],
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
