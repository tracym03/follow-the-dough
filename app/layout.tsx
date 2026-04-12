import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Follow the Dough — Know who\'s buying your ballot',
  description: 'Track political donations, federal bills, lobbying money, and city council activity. All public record data from FEC, Congress.gov, LDA, and Legistar.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-cream font-sans text-ink min-h-screen overflow-x-hidden">
        {children}
        <footer className="bg-ink py-4 px-4 text-center text-[12px] tracking-widest uppercase text-amber/25 leading-loose">
          <div>
            Federal donations:{' '}
            <a href="https://fec.gov" target="_blank" rel="noopener noreferrer" className="text-amber">FEC.gov</a>
            {' · '}
            Federal bills:{' '}
            <a href="https://congress.gov" target="_blank" rel="noopener noreferrer" className="text-amber">Congress.gov</a>
            {' · '}
            Federal lobbying:{' '}
            <a href="https://lda.senate.gov" target="_blank" rel="noopener noreferrer" className="text-amber">LDA.senate.gov</a>
            {' · '}
            Local:{' '}
            <a href="https://webapi.legistar.com" target="_blank" rel="noopener noreferrer" className="text-amber">Legistar</a>
          </div>
          <div className="mt-1">
            All donations over $200 are public record by law · Follow the Dough is nonpartisan ✦
          </div>
        </footer>
      </body>
    </html>
  );
}
