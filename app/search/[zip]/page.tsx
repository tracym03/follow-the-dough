'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import ZipSearch from '@/components/ZipSearch';
import CandidatesTab from '@/components/candidates/CandidatesTab';
import BillsTab from '@/components/bills/BillsTab';
import StateBillsTab from '@/components/bills/StateBillsTab';
import CouncilTab from '@/components/council/CouncilTab';
import { zipToState } from '@/lib/utils';

type Tab = 'candidates' | 'bills' | 'statebills' | 'council';

export default function SearchPage() {
  const params = useParams();
  const zip = (params.zip as string) || '';
  const [activeTab, setActiveTab] = useState<Tab>('candidates');

  const si = zipToState(zip);

  if (!si) {
    return (
      <main>
        <Header />
        <ZipSearch defaultZip={zip} />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="font-display text-3xl text-amber mb-2">Invalid ZIP Code</div>
          <p className="text-mid font-mono text-sm">Could not find a state for ZIP code &quot;{zip}&quot;. Please try again.</p>
        </div>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'candidates',  label: '🗳 Candidates' },
    { id: 'bills',       label: '📋 Federal Bills' },
    { id: 'statebills',  label: '📜 State Bills' },
    { id: 'council',     label: '🏛 City Council' },
  ];

  return (
    <main>
      <Header />
      <ZipSearch defaultZip={zip} />

      {/* Tab bar */}
      <div className="bg-brown flex border-b-2 border-amber sticky top-0 z-10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 px-1 text-center font-display text-[16px] tracking-[2px] cursor-pointer border-none transition-colors ${
              activeTab === tab.id
                ? 'text-gold border-b-[3px] border-b-gold -mb-px'
                : 'text-cream/35 hover:text-cream'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div>
        {activeTab === 'candidates' && (
          <CandidatesTab zip={zip} state={si.state} stateName={si.name} />
        )}
        {activeTab === 'bills' && (
          <BillsTab zip={zip} state={si.state} stateName={si.name} />
        )}
        {activeTab === 'statebills' && (
          <StateBillsTab state={si.state} stateName={si.name} />
        )}
        {activeTab === 'council' && (
          <CouncilTab zip={zip} />
        )}
      </div>
    </main>
  );
}
