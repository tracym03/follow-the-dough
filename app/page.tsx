import Header from '@/components/Header';
import ZipSearch from '@/components/ZipSearch';

export default function Home() {
  return (
    <main>
      <Header />
      <ZipSearch />
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="font-display text-3xl text-amber mb-3">Enter Your ZIP</div>
        <p className="text-sm text-mid leading-relaxed font-mono">
          Real donor names from FEC filings ·<br />
          State bills with lobbying money from LDA ·<br />
          City council votes via Legistar
        </p>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
          {[
            { icon: '🗳', title: 'Candidates', desc: 'See who funds your federal representatives — names, employers, and amounts.' },
            { icon: '📋', title: 'Bills & Lobbying', desc: 'Recent legislation from your state\'s members of Congress and who\'s lobbying on it.' },
            { icon: '🏛', title: 'City Council', desc: 'Local council members, upcoming meetings, and recent votes for 30 major cities.' },
          ].map((item) => (
            <div key={item.title} className="bg-white border border-lb border-l-4 border-l-amber p-4">
              <div className="text-2xl mb-2">{item.icon}</div>
              <div className="font-display text-lg tracking-wider text-brown mb-1">{item.title}</div>
              <p className="text-[11px] text-mid leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-[10px] text-mid/60 font-mono">
          All data is public record · No account required · 100% free
        </p>
      </div>
    </main>
  );
}
