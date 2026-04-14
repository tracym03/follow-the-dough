'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ZipSearch({ defaultZip = '' }: { defaultZip?: string }) {
  const [zip, setZip] = useState(defaultZip);
  const [error, setError] = useState('');
  const router = useRouter();

  function handleSearch() {
    if (!/^\d{5}$/.test(zip)) {
      setError('Please enter a valid 5-digit ZIP code.');
      return;
    }
    setError('');
    router.push(`/search/${zip}`);
  }

  return (
    <div className="bg-ink px-4 py-4 flex flex-col items-center gap-2">
      <div className="text-[13px] tracking-[4px] uppercase text-amber font-mono">Enter your ZIP code</div>
      <div className="flex">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="90210"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="w-32 bg-brown border-2 border-amber border-r-0 text-cream font-display text-2xl tracking-widest px-3 py-2 outline-none focus:border-gold placeholder:text-amber/30"
        />
        <button
          onClick={handleSearch}
          className="bg-amber border-2 border-amber text-ink font-display text-base tracking-widest px-4 py-2 cursor-pointer hover:bg-gold transition-colors whitespace-nowrap"
        >
          Search →
        </button>
      </div>
      {error && <p className="text-ftdred text-xs font-mono tracking-wider">{error}</p>}
      <div className="text-[11px] tracking-[1px] uppercase text-amber/20 font-mono text-center">
        FEC · Congress.gov · LDA · Legistar
      </div>
    </div>
  );
}
