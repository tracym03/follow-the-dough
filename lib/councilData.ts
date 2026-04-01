// Council member party affiliations and official page links.
// Note: many city council elections are officially "nonpartisan" — no party on the ballot —
// but members often have documented party affiliations from voter registration or endorsements.
// Sources: official city bios, Ballotpedia, local press.
//
// Key format: `${cityClient}:${firstName.toLowerCase()} ${lastName.toLowerCase()}`

export type Party = 'D' | 'R' | 'I' | 'G' | 'NP';

export interface CouncilMemberMeta {
  party?: Party;
  url?: string;   // official city council bio page (most stable)
}

// ── City-level default council pages (fallback when no individual URL) ────────
export const CITY_COUNCIL_PAGES: Record<string, string> = {
  // Orange County, CA
  huntingtonbeach: 'https://www.huntingtonbeachca.gov/government/city-council/',
  irvine:          'https://www.cityofirvine.org/city-council',
  anaheim:         'https://www.anaheim.net/170/City-Council',
  santaana:        'https://www.santa-ana.org/city-council',
  gardengrove:     'https://www.garden-grove.org/government/city-council',
  orangeca:        'https://www.cityoforange.org/221/City-Council',
  fullerton:       'https://www.cityoffullerton.com/government/city-council',
  costamesa:       'https://www.costamesaca.gov/city-hall/city-council',
  // Southern CA
  lacity:          'https://council.lacity.gov/',
  sandiego:        'https://www.sandiego.gov/city-council',
  longbeach:       'https://www.longbeach.gov/citycouncil/',
  riverside:       'https://www.riversideca.gov/cityclerk/city-council',
  glendale:        'https://www.glendaleca.gov/government/departments/city-clerk/city-council',
  pasadena:        'https://www.cityofpasadena.net/city-council/',
  // Northern CA
  sfgov:           'https://sfbos.org/supervisors',
  sanjose:         'https://www.sanjoseca.gov/your-government/departments-offices/city-council',
  oakland:         'https://www.oaklandca.gov/departments/city-council',
  sacramento:      'https://www.cityofsacramento.gov/mayor-and-city-council',
  stockton:        'https://www.stocktonca.gov/government/departments/mayor_council/',
  fremont:         'https://fremont.gov/government/city-council',
  // Texas
  austin:          'https://www.austintexas.gov/citycouncil',
  dallas:          'https://dallascitycouncil.com/',
  houston:         'https://www.houstontx.gov/citysec/citycouncil.html',
  sanantonio:      'https://www.sanantonio.gov/Council',
  fortworthtx:     'https://www.fortworthtexas.gov/departments/city-council',
  elpaso:          'https://www.elpasotexas.gov/city-council',
  // Northeast
  nyc:             'https://council.nyc.gov/districts/',
  boston:          'https://www.boston.gov/departments/city-council',
  philly:          'https://phlcouncil.com/',
  pittsburgh:      'https://pittsburghpa.gov/council/',
  baltimore:       'https://baltimore.legistar.com/',
  providence:      'https://www.providenceri.gov/city-council/',
  // Midwest
  chicago:         'https://www.chicago.gov/city/en/depts/mayor/supp_info/city-council.html',
  indy:            'https://www.indy.gov/agency/city-county-council',
  columbus:        'https://www.columbus.gov/Council/',
  cleveland:       'https://www.clevelandcitycouncil.org/',
  cincinnati:      'https://www.cincinnati-oh.gov/citycouncil/',
  detroit:         'https://detroitmi.gov/government/city-council',
  milwaukee:       'https://city.milwaukee.gov/citycouncil',
  minneapolis:     'https://www.minneapolismn.gov/government/city-council/',
  kansascity:      'https://www.kcmo.gov/city-hall/city-council',
  omaha:           'https://www.cityofomaha.org/city-council',
  // South
  atlanta:         'https://www.atlantaga.gov/government/city-council',
  charlotte:       'https://www.charlottenc.gov/city-government/mayor-city-council',
  nashville:       'https://www.nashville.gov/metro-council',
  memphis:         'https://www.memphistn.gov/government/city-council/',
  louisvilleky:    'https://louisvilleky.gov/government/metro-council',
  miami:           'https://www.miamigov.com/Government/City-Commission',
  tampa:           'https://www.tampa.gov/city-council',
  neworleans:      'https://council.nola.gov/',
  // Mountain & Pacific
  seattle:         'https://www.seattle.gov/council',
  portland:        'https://www.portland.gov/council',
  denver:          'https://denvergov.org/Government/Elected-Officials/City-Council',
  lasvegas:        'https://www.lasvegasnevada.gov/Government/City-Council',
  phoenix:         'https://www.phoenix.gov/cityclerk/city-council',
  tucson:          'https://www.tucsonaz.gov/Departments/City-Clerk/City-Council',
  albuquerque:     'https://www.cabq.gov/council',
};

// ── Individual member data ────────────────────────────────────────────────────
// Add new members here as needed. Key is always lowercase full name.
const MEMBERS: Record<string, CouncilMemberMeta> = {

  // ── Huntington Beach, CA (conservative-majority council) ────────────────
  'huntingtonbeach:grace van der mark': { party: 'R', url: 'https://www.huntingtonbeachca.gov/government/city-council/grace-van-der-mark.cfm' },
  'huntingtonbeach:pat burns':          { party: 'R', url: 'https://www.huntingtonbeachca.gov/government/city-council/pat-burns.cfm' },
  'huntingtonbeach:casey mckeon':       { party: 'R', url: 'https://www.huntingtonbeachca.gov/government/city-council/casey-mckeon.cfm' },
  'huntingtonbeach:tony strickland':    { party: 'R', url: 'https://www.huntingtonbeachca.gov/government/city-council/tony-strickland.cfm' },
  'huntingtonbeach:natalie moser':      { party: 'D', url: 'https://www.huntingtonbeachca.gov/government/city-council/natalie-moser.cfm' },
  'huntingtonbeach:dan kalmick':        { party: 'D', url: 'https://www.huntingtonbeachca.gov/government/city-council/dan-kalmick.cfm' },
  'huntingtonbeach:rhonda bolton':      { party: 'D', url: 'https://www.huntingtonbeachca.gov/government/city-council/rhonda-bolton.cfm' },

  // ── Irvine, CA ───────────────────────────────────────────────────────────
  'irvine:farrah khan':      { party: 'D' },
  'irvine:mike carroll':     { party: 'R' },
  'irvine:tammy kim':        { party: 'D' },
  'irvine:larry agran':      { party: 'D' },
  'irvine:kathleen treseder':{ party: 'D' },

  // ── Anaheim, CA ──────────────────────────────────────────────────────────
  'anaheim:norma campos kurtz': { party: 'D' },
  'anaheim:trevor o\'neil':     { party: 'R' },
  'anaheim:natalie rubalcava':  { party: 'D' },
  'anaheim:jose morales':       { party: 'D' },
  'anaheim:gloria ma\'ae':      { party: 'D' },
  'anaheim:david harrington':   { party: 'D' },
  'anaheim:carlos leon':        { party: 'D' },

  // ── Costa Mesa, CA ───────────────────────────────────────────────────────
  'costamesa:john stephens':  { party: 'D' },
  'costamesa:andrea marr':    { party: 'D' },
  'costamesa:loren scott':    { party: 'R' },
  'costamesa:jeffery harlan': { party: 'R' },
  'costamesa:don harper':     { party: 'R' },

  // ── Los Angeles, CA (City Council — all 15 districts) ────────────────────
  'lacity:eunisses hernandez':        { party: 'D', url: 'https://council.lacity.gov/cd1' },
  'lacity:paul krekorian':            { party: 'D', url: 'https://council.lacity.gov/cd2' },
  'lacity:bob blumenfield':           { party: 'D', url: 'https://council.lacity.gov/cd3' },
  'lacity:nithya raman':              { party: 'D', url: 'https://council.lacity.gov/cd4' },
  'lacity:katy young yaroslavsky':    { party: 'D', url: 'https://council.lacity.gov/cd5' },
  'lacity:imelda padilla':            { party: 'D', url: 'https://council.lacity.gov/cd6' },
  'lacity:monica rodriguez':          { party: 'D', url: 'https://council.lacity.gov/cd7' },
  'lacity:marqueece harris-dawson':   { party: 'D', url: 'https://council.lacity.gov/cd8' },
  'lacity:curren price':              { party: 'D', url: 'https://council.lacity.gov/cd9' },
  'lacity:heather hutt':              { party: 'D', url: 'https://council.lacity.gov/cd10' },
  'lacity:traci park':                { party: 'D', url: 'https://council.lacity.gov/cd11' },
  'lacity:john lee':                  { party: 'R', url: 'https://council.lacity.gov/cd12' },
  'lacity:hugo soto-martinez':        { party: 'D', url: 'https://council.lacity.gov/cd13' },
  'lacity:kevin de leon':             { party: 'D', url: 'https://council.lacity.gov/cd14' },
  'lacity:tim mcosker':               { party: 'D', url: 'https://council.lacity.gov/cd15' },

  // ── San Diego, CA ────────────────────────────────────────────────────────
  'sandiego:joe lacava':       { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd1' },
  'sandiego:jennifer campbell':{ party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd2' },
  'sandiego:stephen whitburn': { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd3' },
  'sandiego:henry foster':     { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd4' },
  'sandiego:marni von wilpert':{ party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd5' },
  'sandiego:kent lee':         { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd6' },
  'sandiego:raul campillo':    { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd7' },
  'sandiego:vivian moreno':    { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd8' },
  'sandiego:sean elo-rivera':  { party: 'D', url: 'https://www.sandiego.gov/citycouncil/cd9' },

  // ── San Francisco, CA (Board of Supervisors) ─────────────────────────────
  'sfgov:connie chan':      { party: 'D', url: 'https://sfbos.org/supervisor-chan-district-1' },
  'sfgov:stephen sherrill': { party: 'D', url: 'https://sfbos.org/supervisor-sherrill-district-2' },
  'sfgov:danny sauter':     { party: 'D', url: 'https://sfbos.org/supervisor-sauter-district-3' },
  'sfgov:joel engardio':    { party: 'D', url: 'https://sfbos.org/supervisor-engardio-district-4' },
  'sfgov:matt dorsey':      { party: 'D', url: 'https://sfbos.org/supervisor-dorsey-district-6' },
  'sfgov:myrna melgar':     { party: 'D', url: 'https://sfbos.org/supervisor-melgar-district-7' },
  'sfgov:rafael mandelman': { party: 'D', url: 'https://sfbos.org/supervisor-mandelman-district-8' },
  'sfgov:hillary ronen':    { party: 'D', url: 'https://sfbos.org/supervisor-ronen-district-9' },
  'sfgov:shamann walton':   { party: 'D', url: 'https://sfbos.org/supervisor-walton-district-10' },

  // ── Oakland, CA ──────────────────────────────────────────────────────────
  'oakland:dan kalb':            { party: 'D' },
  'oakland:treva reid':          { party: 'D' },
  'oakland:noel gallo':          { party: 'D' },
  'oakland:janani ramachandran': { party: 'D' },
  'oakland:kevin jenkins':       { party: 'D' },

  // ── Sacramento, CA ───────────────────────────────────────────────────────
  'sacramento:mario woods':     { party: 'D' },
  'sacramento:sean loloee':     { party: 'D' },
  'sacramento:kayla dupuis':    { party: 'D' },
  'sacramento:katie valenzuela':{ party: 'D' },
  'sacramento:caity maple':     { party: 'D' },
  'sacramento:eric guerra':     { party: 'D' },
  'sacramento:richenee youngblood': { party: 'D' },
  'sacramento:karina talamantes':   { party: 'D' },

  // ── New York City, NY ────────────────────────────────────────────────────
  // NYC council is mostly Democrat — adding notable members
  'nyc:adrienne adams':   { party: 'D', url: 'https://council.nyc.gov/adrienne-adams/' },
  'nyc:crystal hudson':   { party: 'D' },
  'nyc:chi osse':         { party: 'D' },
  'nyc:lincoln restler':  { party: 'D' },
  'nyc:rita joseph':      { party: 'D' },
  'nyc:justin brannan':   { party: 'D' },
  'nyc:inna vernikov':    { party: 'R' },
  'nyc:david carr':       { party: 'R' },
  'nyc:joseph borelli':   { party: 'R' },

  // ── Chicago, IL ──────────────────────────────────────────────────────────
  'chicago:brendan reilly':     { party: 'D' },
  'chicago:brian hopkins':      { party: 'D' },
  'chicago:pat dowell':         { party: 'D' },
  'chicago:sophia king':        { party: 'D' },
  'chicago:leslie hairston':    { party: 'D' },
  'chicago:roderick sawyer':    { party: 'D' },
  'chicago:michelle harris':    { party: 'D' },
  'chicago:anthony beale':      { party: 'D' },

  // ── Seattle, WA ──────────────────────────────────────────────────────────
  'seattle:sara nelson':    { party: 'D' },
  'seattle:tammy morales':  { party: 'D' },
  'seattle:joy hollingsworth': { party: 'D' },
  'seattle:ron davis':      { party: 'D' },
  'seattle:cathy moore':    { party: 'D' },
  'seattle:dan strauss':    { party: 'D' },
  'seattle:andrew lewis':   { party: 'D' },
  'seattle:tanya woo':      { party: 'D' },
  'seattle:alexis mercedes guillen': { party: 'D' },

  // ── Denver, CO ───────────────────────────────────────────────────────────
  'denver:jamie torres':    { party: 'D' },
  'denver:kevin flynn':     { party: 'D' },
  'denver:flavia colgan':   { party: 'D' },
  'denver:diana romero campbell': { party: 'D' },
  'denver:amanda sawyer':   { party: 'D' },
  'denver:chris hinds':     { party: 'D' },
  'denver:jolon clark':     { party: 'D' },
  'denver:shontel lewis':   { party: 'D' },
  'denver:stacie gilmore':  { party: 'D' },

  // ── Austin, TX ───────────────────────────────────────────────────────────
  'austin:natasha harper-madison': { party: 'D' },
  'austin:vanessa fuentes':        { party: 'D' },
  'austin:jose velasquez':         { party: 'D' },
  'austin:jose "chito" vela':      { party: 'D' },
  'austin:ryan alter':             { party: 'D' },
  'austin:mackenzie kelly':        { party: 'R' },
  'austin:leslie pool':            { party: 'D' },
  'austin:paige ellis':            { party: 'D' },
  'austin:zohaib "zo" qadri':      { party: 'D' },

  // ── Miami, FL ────────────────────────────────────────────────────────────
  'miami:miguel angel gabela':  { party: 'R' },
  'miami:sabina covo':          { party: 'D' },
  'miami:joe carollo':          { party: 'R' },
  'miami:manolo reyes':         { party: 'R' },
  'miami:christine king':       { party: 'D' },

  // ── Nashville, TN ────────────────────────────────────────────────────────
  // Nashville Metro Council — nonpartisan but most are D or R leaning
  'nashville:freddie o\'connell': { party: 'D' }, // Mayor, not council but often listed
};

export function getMemberMeta(cityClient: string, firstName: string, lastName: string): CouncilMemberMeta {
  const key = `${cityClient.toLowerCase()}:${(firstName || '').toLowerCase()} ${(lastName || '').toLowerCase()}`;
  return MEMBERS[key] || {};
}

export const PARTY_LABELS: Record<Party, string> = {
  D:  'Dem',
  R:  'Rep',
  I:  'Ind',
  G:  'Green',
  NP: 'NP',
};

// Hex values — used as inline style colors in CouncilTab
export const PARTY_COLORS: Record<Party, string> = {
  D:  '#1a6bb5',
  R:  '#c0392b',
  I:  '#607d8b',
  G:  '#2d6a4f',
  NP: '#9e9e9e',
};
