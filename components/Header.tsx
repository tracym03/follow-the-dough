import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-brown px-6 py-5 text-center relative overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(232,201,122,0.08) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-center gap-4 mb-1">
          {/* Logo */}
          <svg width="38" height="46" viewBox="0 0 180 220" fill="none">
            <rect x="18" y="90" width="144" height="108" rx="6" fill="#2d1a08" />
            <rect x="18" y="90" width="144" height="108" rx="6" stroke="#c8934a" strokeWidth="3" fill="none" />
            <circle cx="90" cy="148" r="28" stroke="#e8c97a" strokeWidth="1.5" strokeDasharray="4 4" opacity="0.5" fill="none" />
            <polygon points="90,132 93.5,142.5 104,142.5 96,149 99,160 90,153.5 81,160 84,149 76,142.5 86.5,142.5" fill="#e8c97a" />
            <rect x="10" y="76" width="160" height="20" rx="4" fill="#4a2a0d" />
            <rect x="10" y="76" width="160" height="20" rx="4" stroke="#c8934a" strokeWidth="2" fill="none" />
            <rect x="68" y="80" width="44" height="7" rx="3.5" fill="#1a0f02" />
            <rect x="72" y="44" width="36" height="40" rx="2" fill="#2d6a4f" />
            <text x="90" y="70" textAnchor="middle" fontFamily="serif" fontSize="22" fill="#4a9970" fontWeight="bold">$</text>
            <circle cx="30" cy="36" r="10" fill="#e8c97a" opacity="0.9" />
            <text x="30" y="40" textAnchor="middle" fontFamily="serif" fontSize="11" fill="#3b1f0a" fontWeight="bold">$</text>
            <circle cx="150" cy="30" r="8" fill="#e8c97a" opacity="0.8" />
            <text x="150" y="34" textAnchor="middle" fontFamily="serif" fontSize="9" fill="#3b1f0a" fontWeight="bold">$</text>
            <line x1="38" y1="40" x2="70" y2="66" stroke="#e8c97a" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5" />
            <line x1="143" y1="35" x2="110" y2="62" stroke="#e8c97a" strokeWidth="1.2" strokeDasharray="4 3" opacity="0.5" />
          </svg>
          <div className="text-left">
            <div className="font-display text-[11px] tracking-[0.3em] uppercase text-gold/70 mb-0.5">Follow</div>
            <Link href="/" className="block">
              <div className="font-display font-bold text-[2.8rem] leading-none tracking-tight text-gold"
                style={{ textShadow: '2px 3px 0 rgba(0,0,0,0.3)' }}>
                the <span className="text-white">Dough</span>
              </div>
            </Link>
          </div>
        </div>
        <div className="inline-flex items-center gap-2 bg-ftdred/90 px-4 py-1.5 rounded-full text-[10px] font-semibold tracking-wide text-white mt-3">
          🗳 Know who&apos;s buying your ballot
        </div>
        <p className="text-[10px] tracking-wide text-gold/30 mt-2 font-mono">
          Candidate funding · Federal bills · Lobbyists · Local politics
        </p>
      </div>
    </header>
  );
}
