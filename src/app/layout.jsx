import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import AuroraBackground from '@/components/reactbits/AuroraBackground';

export const metadata = {
  title: 'WhereWasI — Zero-Spoiler Catch-Up Engine for Series, Movies & Anime',
  description: 'Forgot who died before the new season? Scrub to where you paused and catch up on Stranger Things, Attack on Titan, The Boys, Inception, Mirzapur & more with 100% zero spoilers.',
  keywords: [
    'zero spoiler recap',
    'where was i',
    'tv show recap',
    'anime recap',
    'movie recap',
    'character death tracker',
    'stranger things recap',
    'attack on titan recap',
    'mirzapur recap',
    'the boys recap'
  ],
  authors: [{ name: 'WhereWasI Team' }],
  openGraph: {
    title: 'WhereWasI — Zero-Spoiler Recap Engine',
    description: 'Catch up on your favorite series, anime, and movies without accidental spoilers. Drag the episode slider to see who was alive, who betrayed who, and get refreshed.',
    type: 'website',
    locale: 'en_US',
    siteName: 'WhereWasI'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhereWasI — Zero-Spoiler Recap Engine',
    description: 'The Zero-Spoiler Catch-Up Engine for TV shows, anime, and movie franchises.'
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-cinema-black text-slate-100 antialiased min-h-screen selection:bg-brand-500 selection:text-white">
        <AuroraBackground>
          <Navbar />
          <main className="flex-1 w-full">
            {children}
          </main>
          <footer className="border-t border-cinema-border/70 py-8 text-center text-xs text-slate-500 bg-cinema-black/90">
            <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wider">WhereWasI</span>
                <span>• Zero-Spoiler Guarantee</span>
              </div>
              <p>
                Built for cinephiles and binge watchers who forgot who died 2 years ago.
              </p>
              <div className="text-slate-400">
                Next.js 14 • React Bits • MongoDB Ready
              </div>
            </div>
          </footer>
        </AuroraBackground>
      </body>
    </html>
  );
}
