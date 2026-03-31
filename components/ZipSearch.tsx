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
    <div className="bg-ink px-6 py-4 flex flex-col items-center gap-2">
      <div className="text-[10px] tracking-[4px] uppercase text-amber font-mono">Enter your ZIP code</div>
      <div className="flex w-full max-w-sm">
        <input
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="90210"
          value={zip}
          onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-brown border-2 border-amber border-r-0 text-cream font-display text-3xl tracking-widest px-4 py-2 outline-none focus:border-gold placeholder:text-amber/30"
        />
        <button
          onClick={handleSearch}
          className="bg-amber border-2 border-amber text-ink font-display text-lg tracking-widest px-5 cursor-pointer hover:bg-gold transition-colors"
        >
          Search
        </button>
      </div>
      {error && <p className="text-ftdred text-xs font-mono tracking-wider">{error}</p>}
      <div className="text-[9px] tracking-[2px] uppercase text-amber/20 font-mono">
        FEC · Congress.gov · LDA · Legistar — all free, all public record
      </div>
    </div>
  );
}
