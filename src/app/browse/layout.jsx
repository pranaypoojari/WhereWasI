export const metadata = {
  title: 'Browse Show Vault — Netflix, Prime Video, Crunchyroll & HBO Timelines',
  description:
    'Browse our curated vault of zero-spoiler timelines across Netflix, Prime Video, Crunchyroll, and JioCinema/HBO. Filter by genre and resume watching at Season 1 Episode 1.',
  alternates: {
    canonical: '/browse',
  },
  openGraph: {
    title: 'Browse Show Vault | WhereWasI — Zero Spoilers',
    description:
      'Filter shows by streaming platform and genre to catch up safely before the new season drops.',
    url: '/browse',
  },
};

export default function BrowseLayout({ children }) {
  return children;
}
