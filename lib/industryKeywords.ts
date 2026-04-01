// Shared industry keyword mapper — used for employer names, PAC org names, and lobbying client names
// Returns a consistent { label, emoji, color } for display in pizza charts

export interface IndustrySlice {
  label: string;
  emoji: string;
  value: number;
  color: string;
}

const INDUSTRY_PATTERNS: { label: string; emoji: string; color: string; pattern: RegExp }[] = [
  {
    label: 'Pharma & Biotech',
    emoji: '💊',
    color: '#e74c3c',
    // Named companies + broad pharma association PAC names
    pattern: /pfizer|merck|abbvie|lilly|eli lilly|moderna|johnson.{0,5}johnson|pharma|biotech|biogen|novartis|amgen|genentech|sanofi|astrazeneca|bayer|bristol.myers|gilead|regeneron|drug company|pharmaceutical|phrma|biotechnology/i,
  },
  {
    label: 'Technology',
    emoji: '💻',
    color: '#9b59b6',
    pattern: /google|apple inc|amazon|meta |microsoft|facebook|netflix|alphabet|uber|lyft|airbnb|software|data corp|cloud|oracle|salesforce|intel|nvidia|cisco|twitter|snap|palantir|tech (inc|llc|corp)|information technology|semiconductor|computer|internet assoc/i,
  },
  {
    label: 'Finance & Banking',
    emoji: '🏦',
    color: '#3498db',
    // Named firms + broad financial industry PAC names
    pattern: /goldman sachs|jp morgan|jpmorgan|wells fargo|morgan stanley|blackstone|blackrock|citigroup|citi bank|private equity|venture capital|capital one|american express|fidelity|vanguard|schwab|bank of america|credit suisse|ubs |hedge fund|asset management|investment company|bankers assoc|financial services|securities industry|credit union|wall street|stock exchange|insurance company|annuity/i,
  },
  {
    label: 'Defense & Military',
    emoji: '🛡️',
    color: '#2c3e50',
    pattern: /lockheed|boeing|raytheon|northrop|general dynamics|l3 tech|bae systems|defense|aerospace|military|weapon|leidos|booz allen|saic |ball corp|cubic corp|textron|huntington ingalls/i,
  },
  {
    label: 'Oil, Gas & Energy',
    emoji: '🛢️',
    color: '#795548',
    pattern: /exxon|chevron|shell oil|bp |conocophillips|halliburton|energy transfer|pioneer natural|devon energy|oil|petroleum|fossil fuel|pipeline|natural gas|coal|american petroleum|liquefied natural|lng |refin/i,
  },
  {
    label: 'Healthcare & Hospitals',
    emoji: '🏥',
    color: '#27ae60',
    // Named companies + broad healthcare association PAC names (very common)
    pattern: /hospital|health system|medical center|kaiser|humana|aetna|cigna|united health|cvs health|walgreen|blue cross|blue shield|anthem|hca |tenet health|community health|american medical|american hospital|american nurses|american dental|american optom|american physical|american college of|physicians|surgeons|ama pac|medical assoc|health care|healthcare workers|home health|nursing home/i,
  },
  {
    label: 'Law & Lobbying Firms',
    emoji: '⚖️',
    color: '#f39c12',
    pattern: / llp$| llp | pa$|attorneys|law firm|law offices|counsel|lobbying|public affairs|government affairs|government relations|policy group|advocacy group/i,
  },
  {
    label: 'Real Estate',
    emoji: '🏘️',
    color: '#e67e22',
    // "National Assoc of Realtors" is one of the biggest PAC donors in the US
    pattern: /real estate|realt|properties llc|property management|mortgage|title company|related companies|simon property|brookfield|prologis|developer|home builder|national assoc of real|housing assoc|apartment assoc|commercial real/i,
  },
  {
    label: 'Insurance',
    emoji: '📋',
    color: '#607d8b',
    pattern: /insurance|aig |allstate|geico|state farm|progressive corp|travelers |hartford financial|nationwide|metlife|american family|liberty mutual|prudential|mutual of omaha/i,
  },
  {
    label: 'Telecom & Media',
    emoji: '📡',
    color: '#00acc1',
    pattern: /at&t|verizon|comcast|telecom|t-mobile|charter comm|spectrum|disney|fox corp|nbc|cbs|warner|news corp|media corp|broadband|cable tv|national cable|broadcast/i,
  },
  {
    label: 'Labor & Unions',
    emoji: '👷',
    color: '#2d6a4f',
    pattern: /union|afl-cio|seiu |teamster|ufcw |afscme|communications workers|service employees|teachers union|ibew |fire fighters|police benevolent|machinists|steelworkers|carpenters union|plumbers|electricians|operating engineers|laborers intl/i,
  },
  {
    label: 'Agriculture',
    emoji: '🌾',
    color: '#8d6e63',
    pattern: /farm bureau|cargill|archer daniels|agriculture|agribusiness|dairy|poultry|crop|grain|cattle|livestock|national cattlemen|corn growers|soybean assoc|sugar assoc|tobacco|cotton/i,
  },
  {
    label: 'Pro-Israel Groups',
    emoji: '🌐',
    color: '#1565c0',
    pattern: /aipac|pro-israel|american israel|j street|zionist|democratic majority for israel/i,
  },
  {
    label: 'Guns & NRA',
    emoji: '🔫',
    color: '#b71c1c',
    pattern: /nra |national rifle|gun owners|second amendment foundation|firearms|safari club/i,
  },
];

// Map a name (employer, PAC org, lobbying client) to an industry
export function mapToIndustry(name: string): { label: string; emoji: string; color: string } | null {
  if (!name || name.length < 2) return null;
  for (const industry of INDUSTRY_PATTERNS) {
    if (industry.pattern.test(name)) {
      return { label: industry.label, emoji: industry.emoji, color: industry.color };
    }
  }
  return null;
}

// Add a value to an industry bucket map
export function addToIndustryBucket(
  buckets: Map<string, IndustrySlice>,
  label: string,
  emoji: string,
  color: string,
  value: number
) {
  const existing = buckets.get(label);
  if (existing) {
    existing.value += value;
  } else {
    buckets.set(label, { label, emoji, color, value });
  }
}

// Finalize buckets into sorted slice array
export function finalizeBuckets(
  buckets: Map<string, IndustrySlice>,
  minValue = 500,
  maxSlices = 7
): IndustrySlice[] {
  return [...buckets.values()]
    .filter(s => s.value >= minValue)
    .sort((a, b) => b.value - a.value)
    .slice(0, maxSlices);
}
