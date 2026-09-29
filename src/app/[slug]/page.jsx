import { notFound } from 'next/navigation';
import { getFullShowDetails } from '@/lib/dataService';
import ShowDetailClient from './ShowDetailClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasi.vercel.app';

export async function generateMetadata({ params }) {
  const data = await getFullShowDetails(params.slug);
  if (!data || !data.show) {
    return {
      title: 'Show Not Found',
    };
  }

  const { show } = data;
  const pageUrl = `${SITE_URL}/${show.slug}`;
  const description = `100% Zero-spoiler recap, character alive/dead status tracker, and relationship web for ${show.title} (${show.platform}). Scrub by episode starting from Season 1 Episode 1 without getting spoiled.`;

  return {
    title: `${show.title} Zero-Spoiler Recap, Character Deaths & Timeline`,
    description,
    keywords: [
      `${show.title} recap`,
      `${show.title} season 1 episode 1 summary`,
      `${show.title} character status`,
      `${show.title} who died`,
      `${show.title} zero spoilers`,
      ...(Array.isArray(show.genre) ? show.genre : []),
      ...(Array.isArray(show.tags) ? show.tags : []),
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${show.title} — Zero-Spoiler Recap & Character Status | WhereWasI`,
      description,
      url: pageUrl,
      type: 'video.tv_show',
      images: show.posterUrl
        ? [
            {
              url: show.posterUrl,
              width: 800,
              height: 1200,
              alt: `${show.title} Poster`,
            },
          ]
        : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${show.title} — Zero-Spoiler Recap & Timeline`,
      description,
      images: show.posterUrl ? [show.posterUrl] : [],
    },
  };
}

export default async function ShowPage({ params }) {
  const data = await getFullShowDetails(params.slug);

  if (!data || !data.show) {
    notFound();
  }

  const { show } = data;

  const seriesJsonLd = {
    '@context': 'https://schema.org',
    '@type': show.type === 'movie' ? 'Movie' : 'TVSeries',
    name: show.title,
    description: show.synopsis,
    genre: show.genre,
    image: show.posterUrl,
    numberOfSeasons: show.totalSeasons || 1,
    numberOfEpisodes: show.totalEpisodes || 1,
    url: `${SITE_URL}/${show.slug}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Browse Vault',
        item: `${SITE_URL}/browse`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: show.title,
        item: `${SITE_URL}/${show.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(seriesJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ShowDetailClient initialData={data} />
    </>
  );
}
