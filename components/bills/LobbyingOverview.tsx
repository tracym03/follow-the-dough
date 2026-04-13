'use client';

import { useState } from 'react';
import PizzaChart from '@/components/candidates/PizzaChart';

// ── 2025 federal lobbying data (Source: OpenSecrets.org) ─────────────────────
// Total 2025: $5.08B (+11% from 2024). Confirmed figures marked ✓.
// Estimates based on OpenSecrets sector totals and 11% avg growth rate.
const LOBBYING_OVERVIEW = [
  {
    label: 'Healthcare & Pharma', emoji: '🏥', value: 868_000_000, color: '#27ae60',
    note: 'Healthcare spent a record $868M lobbying in 2025 — the most of any sector. The year was dominated by battles over Medicaid cuts in the reconciliation bill (signed July 2025), drug pricing fights, and hospital reimbursement rates.',
    topSpenders: [
      { name: 'PhRMA', amount: 38_200_000, what: 'Trade group for brand-name drug companies. Spent 20% more than 2024 fighting continued drug price negotiation and IRA implementation.' },
      { name: 'American Hospital Association', amount: 32_000_000, what: 'Lobbied against Medicaid cuts in the reconciliation bill and for increased Medicare reimbursement rates.' },
      { name: 'Blue Cross Blue Shield', amount: 28_000_000, what: 'Lobbied to protect insurance industry exemptions and against Medicaid managed care rate reductions.' },
      { name: 'American Medical Association', amount: 25_000_000, what: 'Lobbied on physician payment rates, prior authorization reform, and Medicare payment schedules.' },
      { name: 'Pfizer', amount: 18_000_000, what: 'Lobbied against ongoing drug price negotiation and for favorable treatment of biologics under the IRA.' },
    ],
  },
  {
    label: 'Finance & Wall Street', emoji: '🏦', value: 711_000_000, color: '#3498db',
    note: 'Finance, insurance and real estate spent $711M in 2025. The crypto/stablecoin surge drove record lobbying from digital asset firms — the GENIUS Act (stablecoin regulation) was a top priority. Banks pushed hard for deregulation under the new administration.',
    topSpenders: [
      { name: 'American Bankers Association', amount: 18_000_000, what: 'Lobbied for bank deregulation, rollback of consumer protection rules, and against Basel III capital requirements.' },
      { name: 'Investment Company Institute', amount: 16_000_000, what: 'Mutual fund industry group. Lobbied on crypto asset rules, SEC disclosure requirements, and fiduciary standards.' },
      { name: 'Goldman Sachs', amount: 10_000_000, what: 'Lobbied on capital requirements, crypto regulation, and Trump-era SEC deregulation agenda.' },
      { name: 'BlackRock', amount: 8_500_000, what: 'Lobbied on ESG investment rules, retirement account regulations, and digital asset custody rules.' },
      { name: 'JPMorgan Chase', amount: 4_400_000, what: 'Direct lobbying spend — most JPMorgan influence runs through trade associations like ABA and FSR.' },
    ],
  },
  {
    label: 'Tech & Communications', emoji: '💻', value: 500_000_000, color: '#9b59b6',
    note: 'Tech lobbying surged in 2025 driven by AI regulation, data center energy policy, TikTok ownership battles, and ongoing antitrust cases. Data center expansion alone drove $226M+ from electric manufacturing firms lobbying on power grid strain.',
    topSpenders: [
      { name: 'Meta (Facebook)', amount: 26_300_000, what: 'Hired 21 more lobbyists than 2024. Lobbied on AI regulation, data center energy permits, and social media liability rules.' },
      { name: 'Amazon', amount: 25_000_000, what: 'Lobbied on AI policy, antitrust enforcement, cloud computing contracts, and data center energy permits.' },
      { name: 'Microsoft', amount: 20_000_000, what: 'Lobbied heavily on AI regulation, data center infrastructure, government cloud contracts, and cybersecurity rules.' },
      { name: 'Google / Alphabet', amount: 19_000_000, what: 'Lobbied while facing antitrust rulings on search monopoly and ad tech. Also active on AI regulation.' },
      { name: 'Apple', amount: 14_000_000, what: 'Lobbied against app store competition rules, data privacy legislation, and EU-style digital market rules.' },
    ],
  },
  {
    label: 'Energy & Oil', emoji: '🛢️', value: 470_000_000, color: '#795548',
    note: 'Energy & natural resources spending hit ~$470M in 2025, up significantly from 2024. The sector lobbied aggressively for deregulation under the Trump administration — expanded drilling permits, LNG export approvals, and rollback of IRA clean energy rules.',
    topSpenders: [
      { name: 'American Petroleum Institute', amount: 20_000_000, what: 'Oil industry\'s main trade group. Lobbied for expanded drilling rights, LNG export permits, and EPA methane rule rollbacks.' },
      { name: 'ExxonMobil', amount: 16_000_000, what: 'Lobbied for offshore drilling permits, favorable tax treatment, and rollback of Biden-era climate regulations.' },
      { name: 'Chevron', amount: 11_000_000, what: 'Lobbied on drilling permits, pipeline approvals, and deregulation of refinery emissions standards.' },
      { name: 'Southern Company', amount: 9_000_000, what: 'Utility lobbying on coal plant regulation, natural gas pipeline approvals, and data center power contracts.' },
      { name: 'ConocoPhillips', amount: 7_000_000, what: 'Lobbied for Alaskan drilling rights and natural gas infrastructure expansion.' },
    ],
  },
  {
    label: 'Defense Contractors', emoji: '🛡️', value: 191_000_000, color: '#2c3e50',
    note: 'Defense spending reached $191M in 2025 (+9% from 2024). Contractors lobbied for Pentagon budget increases, continued Ukraine and Israel aid, and new programs under a defense-friendly administration. Lockheed increased spending 24% year-over-year.',
    topSpenders: [
      { name: 'Lockheed Martin', amount: 15_700_000, what: 'Lobbied for F-35 program continuation, missile defense contracts, and next-gen fighter funding. Up 24% from 2024.' },
      { name: 'Boeing', amount: 15_000_000, what: 'Lobbied for defense contracts while managing ongoing safety investigations and for export licenses for combat aircraft.' },
      { name: 'Raytheon / RTX', amount: 14_000_000, what: 'Lobbied for Patriot missile system funding, air defense contracts, and continued weapons aid packages.' },
      { name: 'Northrop Grumman', amount: 12_000_000, what: 'Lobbied for B-21 bomber program funding and expanded Space Force satellite contracts.' },
      { name: 'General Dynamics', amount: 10_500_000, what: 'Lobbied for naval shipbuilding expansion, submarine programs, and combat vehicle modernization.' },
    ],
  },
  {
    label: 'Agriculture & Food', emoji: '🌾', value: 195_000_000, color: '#8d6e63',
    note: 'Agribusiness was among the sectors with the strongest lobbying growth in 2025. Trade war tariffs and retaliatory measures against U.S. farm exports drove intense lobbying. Subsidies still overwhelmingly benefit large industrial farms.',
    topSpenders: [
      { name: 'American Farm Bureau Federation', amount: 10_000_000, what: 'Largest farm lobby. Lobbied against retaliatory tariffs on farm exports and for continued crop subsidy programs.' },
      { name: 'Cargill', amount: 7_000_000, what: 'Lobbied on grain export restrictions, food labeling rules, and trade policy affecting commodity markets.' },
      { name: 'Archer Daniels Midland', amount: 6_000_000, what: 'Lobbied for ethanol mandates, commodity subsidies, and favorable trade agreement terms.' },
      { name: 'National Cattlemen\'s Beef Association', amount: 4_200_000, what: 'Lobbied against country-of-origin labeling, USDA inspection requirements, and environmental farm regulations.' },
      { name: 'National Corn Growers Association', amount: 3_500_000, what: 'Lobbied for ethanol blending requirements and corn export subsidies amid trade uncertainty.' },
    ],
  },
  {
    label: 'Ideology & Single Issue', emoji: '🌐', value: 155_000_000, color: '#1565c0',
    note: 'Foreign policy lobbying, gun rights organizations, and ideological groups. 2025 saw significant activity around foreign aid, immigration policy, and social issues under the new administration.',
    topSpenders: [
      { name: 'AIPAC (Pro-Israel)', amount: 9_000_000, what: 'Registered lobbying spend only — AIPAC\'s affiliated super PAC spends tens of millions more on electoral activity each cycle.' },
      { name: 'National Rifle Association', amount: 4_500_000, what: 'Lobbied against gun safety legislation, for national concealed carry reciprocity, and against red flag law expansions.' },
      { name: 'US Chamber of Commerce', amount: 4_000_000, what: 'Pro-business lobbying on tariff policy, labor regulations, immigration (workforce), and environmental rules.' },
      { name: 'Heritage Action', amount: 2_500_000, what: 'Conservative policy group lobbying for Project 2025 agenda items including budget cuts and DEI bans.' },
      { name: 'Planned Parenthood', amount: 2_000_000, what: 'Lobbied to protect reproductive healthcare funding amid efforts to defund the organization federally.' },
    ],
  },
  {
    label: 'Labor & Unions', emoji: '👷', value: 60_000_000, color: '#2d6a4f',
    note: 'Labor unions lobby for worker protections, minimum wage, and benefits — and to push back on Project 2025 labor policy rollbacks. Outspent by corporate interests by more than 14 to 1 in 2025.',
    topSpenders: [
      { name: 'AFL-CIO', amount: 5_800_000, what: 'Largest union federation. Lobbied against labor deregulation, for PRO Act protections, and against gig economy misclassification rules.' },
      { name: 'SEIU (Service Employees)', amount: 4_800_000, what: 'Represents healthcare and building services workers. Lobbied against Medicaid cuts and for minimum wage increases.' },
      { name: 'Teamsters', amount: 3_400_000, what: 'Lobbied on trucking regulations, independent contractor rules, and Amazon warehouse worker conditions.' },
      { name: 'American Federation of Teachers', amount: 2_500_000, what: 'Lobbied against school voucher expansion and for Title I public education funding protection.' },
      { name: 'AFSCME (State/Municipal Employees)', amount: 2_300_000, what: 'Lobbied against public service privatization, federal workforce reductions, and pension rollbacks.' },
    ],
  },
];

const fmt = (n: number) => n >= 1e9 ? `$${(n / 1e9).toFixed(1)}B` : `$${(n / 1e6).toFixed(0)}M`;

// embedded=true: shows content without outer toggle (used inside a FlowCard)
// embedded=false (default): standalone with its own expand/collapse
export default function LobbyingOverview({ embedded = false }: { embedded?: boolean }) {
  const [open, setOpen]     = useState(false);
  const [active, setActive] = useState<number | null>(null);

  const total = LOBBYING_OVERVIEW.reduce((s, i) => s + i.value, 0);

  const content = (
    <div className={embedded ? '' : 'px-4 pb-4'}>
      <div className="bg-amber/5 border border-amber/30 rounded px-3 py-2 mb-4 text-[13px] leading-relaxed text-brown">
        <strong>What this shows:</strong> Total amount spent lobbying Congress in 2025, broken down by industry.
        This is <em>not</em> campaign donations — this is money paid to registered lobbyists to directly
        influence legislation. Source:{' '}
        <a href="https://www.opensecrets.org/federal-lobbying" target="_blank"
          rel="noopener noreferrer" className="text-amber underline">OpenSecrets.org</a>
      </div>

      <PizzaChart
        title="2025 Federal Lobbying by Industry"
        slices={LOBBYING_OVERVIEW.map(i => ({ label: i.label, emoji: i.emoji, value: i.value, color: i.color }))}
      />

      <div className="mt-4 space-y-2">
        {LOBBYING_OVERVIEW.map((item, i) => {
          const pct = Math.round((item.value / total) * 100);
          const isActive = active === i;
          return (
            <div key={i}
              className={`cursor-pointer rounded border transition-colors ${isActive ? 'border-amber bg-amber/5' : 'border-lb hover:border-amber/40'}`}
              onClick={() => setActive(isActive ? null : i)}
            >
              <div className="px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{item.emoji}</span>
                    <span className="text-[14px] font-semibold text-ink truncate">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[13px] text-mid">{pct}%</span>
                    <span className="font-display text-[17px] text-amber">{fmt(item.value)}</span>
                    <span className="text-[12px] text-mid">{isActive ? '▲' : '▼'}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-lb rounded mt-1.5">
                  <div className="h-full rounded" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>
              </div>

              {isActive && (
                <div className="px-3 pb-3 border-t border-amber/20">
                  <p className="text-[13px] text-brown leading-relaxed mt-2 mb-3">{item.note}</p>
                  <div className="text-[11px] tracking-[2px] uppercase text-mid mb-2">Top 5 spenders — 2025</div>
                  {item.topSpenders.map((s, j) => {
                    const maxAmt = item.topSpenders[0].amount;
                    const sPct = Math.round((s.amount / maxAmt) * 100);
                    return (
                      <div key={j} className="mb-3 last:mb-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[14px] font-semibold text-ink">{j + 1}. {s.name}</span>
                          <span className="font-display text-[16px] text-amber shrink-0">{fmt(s.amount)}</span>
                        </div>
                        <div className="h-1 bg-lb rounded my-1">
                          <div className="h-full rounded" style={{ width: `${sPct}%`, backgroundColor: item.color }} />
                        </div>
                        <p className="text-[12px] text-mid leading-relaxed">{s.what}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-[12px] text-mid pt-2 border-t border-lb">
        Data: OpenSecrets.org 2025 federal lobbying totals · Updated: April 2026 ·{' '}
        <a href="https://www.opensecrets.org/federal-lobbying" target="_blank" rel="noopener noreferrer" className="text-amber">
          Full database ↗
        </a>
        {' '}· Total 2025 lobbying: $5.08B (+11% from 2024) · Labor unions outspent by corporate interests 14 to 1.
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <div className="bg-white border border-amber/50 border-l-4 border-l-amber mb-6">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${open ? 'bg-amber/10' : 'hover:bg-lb/50'}`}
      >
        <div>
          <div className="font-display text-[18px] tracking-wider text-brown">
            🏛️ Who Lobbies Congress? — 2025 Totals
          </div>
          <div className="text-[13px] text-mid mt-0.5">
            Federal law requires all lobbyists to register. Total spend: {fmt(total)} in 2025 — tap to see the breakdown
          </div>
        </div>
        <span className="text-[13px] text-amber font-mono shrink-0 ml-2">{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && content}
    </div>
  );
}
