'use client';

import { useState } from 'react';
import PizzaChart from '@/components/candidates/PizzaChart';

const LOBBYING_OVERVIEW = [
  {
    label: 'Healthcare & Pharma', emoji: '🏥', value: 770_000_000, color: '#27ae60',
    note: 'Hospitals, pharma companies & insurance giants spent more lobbying Congress than any other sector. 2024 was driven by fights over drug pricing, Medicare negotiation, and ACA coverage.',
    topSpenders: [
      { name: 'PhRMA', amount: 30_200_000, what: 'Trade group for brand-name drug companies. Lobbied against Medicare drug price negotiation.' },
      { name: 'American Hospital Association', amount: 27_800_000, what: 'Lobbied against hospital price transparency rules and for increased Medicare reimbursements.' },
      { name: 'Blue Cross Blue Shield', amount: 25_100_000, what: 'Lobbied to protect insurance industry exemptions and against public option proposals.' },
      { name: 'American Medical Association', amount: 22_400_000, what: 'Lobbied on physician payment rates, prior authorization reform, and scope-of-practice rules.' },
      { name: 'Pfizer', amount: 14_300_000, what: 'Lobbied against drug price negotiation provisions in the Inflation Reduction Act.' },
    ],
  },
  {
    label: 'Finance & Wall Street', emoji: '🏦', value: 680_000_000, color: '#3498db',
    note: 'Banks, private equity & hedge funds lobbied heavily in 2024 against new SEC regulations and Basel III capital requirements.',
    topSpenders: [
      { name: 'American Bankers Association', amount: 16_400_000, what: 'Lobbied against Basel III bank capital requirements and consumer protection regulations.' },
      { name: 'Investment Company Institute', amount: 14_200_000, what: 'Mutual fund industry group. Lobbied against SEC disclosure rules and fiduciary standards.' },
      { name: 'JPMorgan Chase', amount: 12_100_000, what: 'Lobbied against Basel III capital rules, crypto regulations, and debit card fee caps.' },
      { name: 'Goldman Sachs', amount: 8_300_000, what: 'Lobbied on capital requirements, derivatives regulation, and SEC reporting rules.' },
      { name: 'BlackRock', amount: 7_100_000, what: 'Lobbied against ESG investment disclosure rules and on retirement account regulations.' },
    ],
  },
  {
    label: 'Tech & Communications', emoji: '💻', value: 420_000_000, color: '#9b59b6',
    note: 'Tech lobbying hit a record in 2024, driven by AI regulation debates, antitrust cases against Google & Amazon, and Section 230 battles.',
    topSpenders: [
      { name: 'Amazon', amount: 22_100_000, what: 'Lobbied against antitrust legislation, on AI policy, and for favorable cloud computing contracts.' },
      { name: 'Meta (Facebook)', amount: 19_900_000, what: 'Lobbied to protect Section 230 immunity, against children\'s online safety legislation, and on AI rules.' },
      { name: 'Google / Alphabet', amount: 18_400_000, what: 'Lobbied against antitrust enforcement, on AI regulation, and search engine competition rules.' },
      { name: 'Apple', amount: 12_200_000, what: 'Lobbied against app store competition rules and on data privacy legislation.' },
      { name: 'Microsoft', amount: 9_800_000, what: 'Lobbied on AI regulation, government cloud contracts, and cybersecurity legislation.' },
    ],
  },
  {
    label: 'Energy & Oil', emoji: '🛢️', value: 310_000_000, color: '#795548',
    note: 'Oil, gas & utilities lobby heavily against climate regulations. LNG export approvals and Inflation Reduction Act implementation drove major 2024 activity.',
    topSpenders: [
      { name: 'American Petroleum Institute', amount: 16_200_000, what: 'Oil industry\'s main trade group. Lobbied against EPA methane rules and for LNG export approvals.' },
      { name: 'ExxonMobil', amount: 14_100_000, what: 'Lobbied against carbon pricing, methane regulations, and for favorable tax treatment of oil extraction.' },
      { name: 'Chevron', amount: 9_400_000, what: 'Lobbied on offshore drilling permits, pipeline approvals, and against clean energy subsidies.' },
      { name: 'Southern Company', amount: 8_200_000, what: 'Utility company lobbying on coal plant regulations and natural gas pipeline approvals.' },
      { name: 'ConocoPhillips', amount: 6_100_000, what: 'Lobbied for Alaskan drilling rights (Willow Project) and against oil windfall profit taxes.' },
    ],
  },
  {
    label: 'Defense Contractors', emoji: '🛡️', value: 175_000_000, color: '#2c3e50',
    note: 'Defense firms lobby for Pentagon budget increases — often above what the military requests. Ukraine and Israel aid packages drove additional 2024 activity.',
    topSpenders: [
      { name: 'Lockheed Martin', amount: 15_200_000, what: 'Lobbied for F-35 program funding, missile defense contracts, and Ukraine weapons aid packages.' },
      { name: 'Boeing', amount: 13_900_000, what: 'Lobbied for defense contracts despite safety scandals, and for export licenses for fighter jets.' },
      { name: 'Raytheon / RTX', amount: 12_400_000, what: 'Lobbied for missile system contracts including Patriot batteries sent to Ukraine and Israel.' },
      { name: 'Northrop Grumman', amount: 11_100_000, what: 'Lobbied for B-21 bomber program and Space Force contracts.' },
      { name: 'General Dynamics', amount: 9_800_000, what: 'Lobbied for naval shipbuilding contracts and combat vehicle programs.' },
    ],
  },
  {
    label: 'Agriculture & Food', emoji: '🌾', value: 155_000_000, color: '#8d6e63',
    note: 'Agribusiness lobbied intensely around the 2024 Farm Bill reauthorization. Subsidies overwhelmingly benefit large industrial farms over small family farms.',
    topSpenders: [
      { name: 'American Farm Bureau Federation', amount: 8_100_000, what: 'Largest farm lobby. Pushed for expanded crop subsidies and against environmental farm regulations.' },
      { name: 'Cargill', amount: 5_900_000, what: 'World\'s largest private company. Lobbied on grain export rules, food labeling, and trade policy.' },
      { name: 'Archer Daniels Midland', amount: 4_800_000, what: 'Lobbied for ethanol mandates, commodity subsidies, and favorable trade agreements.' },
      { name: 'National Cattlemen\'s Beef Association', amount: 3_700_000, what: 'Lobbied against country-of-origin labeling and meat industry environmental regulations.' },
      { name: 'National Corn Growers Association', amount: 2_900_000, what: 'Lobbied for ethanol blending requirements and corn export subsidies.' },
    ],
  },
  {
    label: 'Ideology & Single Issue', emoji: '🌐', value: 140_000_000, color: '#1565c0',
    note: 'Includes foreign policy lobbying, gun rights organizations, and ideological groups. AIPAC alone spent over $100M across lobbying and electoral activity in 2024.',
    topSpenders: [
      { name: 'AIPAC (Pro-Israel)', amount: 8_400_000, what: 'Registered lobbying spend only — AIPAC\'s affiliated super PAC spent an additional $100M+ on 2024 congressional elections.' },
      { name: 'National Rifle Association', amount: 4_100_000, what: 'Lobbied against universal background checks, red flag laws, and assault weapons restrictions.' },
      { name: 'US Chamber of Commerce', amount: 3_800_000, what: 'Pro-business lobbying on labor rules, environmental regulations, and trade policy.' },
      { name: 'Heritage Action', amount: 2_200_000, what: 'Conservative policy group lobbying on budget cuts, immigration restriction, and DEI bans.' },
      { name: 'Planned Parenthood', amount: 1_900_000, what: 'Lobbied to protect reproductive healthcare funding and access after Roe v. Wade overturn.' },
    ],
  },
  {
    label: 'Labor & Unions', emoji: '👷', value: 55_000_000, color: '#2d6a4f',
    note: 'Labor unions lobby for worker protections, minimum wage, and benefits. Outspent by corporate interests by more than 12 to 1 in 2024.',
    topSpenders: [
      { name: 'AFL-CIO', amount: 5_200_000, what: 'Largest union federation. Lobbied for PRO Act (union organizing rights), minimum wage, and pension protections.' },
      { name: 'SEIU (Service Employees)', amount: 4_400_000, what: 'Represents healthcare, building services workers. Lobbied for $15 minimum wage and Medicaid expansion.' },
      { name: 'Teamsters', amount: 3_100_000, what: 'Represents truck drivers and warehouse workers. Lobbied on trucking regulations and gig worker classifications.' },
      { name: 'American Federation of Teachers', amount: 2_300_000, what: 'Lobbied against school voucher programs and for increased public education funding.' },
      { name: 'AFSCME (State/Municipal Employees)', amount: 2_100_000, what: 'Represents government workers. Lobbied against public service privatization and for pension protections.' },
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
        <strong>What this shows:</strong> Total amount spent lobbying Congress in 2024, broken down by industry.
        This is <em>not</em> campaign donations — this is money paid to registered lobbyists to directly
        influence legislation. Source:{' '}
        <a href="https://www.opensecrets.org/federal-lobbying/overview" target="_blank"
          rel="noopener noreferrer" className="text-amber underline">OpenSecrets.org</a>
      </div>

      <PizzaChart
        title="2024 Federal Lobbying by Industry"
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
                  <div className="text-[11px] tracking-[2px] uppercase text-mid mb-2">Top 5 spenders — 2024</div>
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
        Data: OpenSecrets.org 2024 federal lobbying totals · Last updated: March 2026 ·{' '}
        <a href="https://www.opensecrets.org/federal-lobbying" target="_blank" rel="noopener noreferrer" className="text-amber">
          Full database ↗
        </a>
        {' '}· Labor unions are outspent by corporate interests by more than 12 to 1.
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
            🏛️ Who Lobbies Congress? — 2024 Totals
          </div>
          <div className="text-[13px] text-mid mt-0.5">
            Federal law requires all lobbyists to register. Total spend: {fmt(total)} in 2024 — tap to see the breakdown
          </div>
        </div>
        <span className="text-[13px] text-amber font-mono shrink-0 ml-2">{open ? '▲ hide' : '▼ show'}</span>
      </button>
      {open && content}
    </div>
  );
}
