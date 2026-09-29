import '@/styles/globals.css';
import Navbar from '@/components/Navbar';
import AuroraBackground from '@/components/reactbits/AuroraBackground';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasi.vercel.app';

export const viewport = {
  themeColor: '#f43f5e',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'WhereWasI — Zero-Spoiler Catch-Up Engine for Series, Movies & Anime',
    template: '%s | WhereWasI — Zero Spoilers'
  },
  description: 'Forgot who died before the new season? Scrub to where you paused and catch up on Stranger Things, Attack on Titan, The Boys, Inception, Mirzapur & more with 100% zero spoilers.',
  keywords: [
    'zero spoiler recap',
    'where was i',
    'tv show recap',
    'anime recap',
    'movie recap',
    'character death tracker',
    'episode summary without spoilers',
    'stranger things recap',
    'attack on titan recap',
    'mirzapur recap',
    'the boys recap',
    'game of thrones recap',
    'naruto recap'
  ],
  authors: [{ name: 'WhereWasI Team' }],
  creator: 'Pranay Poojari',
  publisher: 'WhereWasI',
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'WhereWasI — Zero-Spoiler Recap Engine',
    description: 'Catch up on your favorite series, anime, and movies without accidental spoilers. Drag the episode slider to see who was alive, who betrayed who, and get refreshed.',
    url: SITE_URL,
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'WhereWasI',
    alternateName: 'WhereWasI Zero-Spoiler Recap Engine',
    url: SITE_URL,
    description: 'Zero-spoiler episode recap engine, character alive/dead tracker, and relationship web for TV series, anime, and movies.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/generate?title={search_term_string}&season=1&episode=1`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
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
