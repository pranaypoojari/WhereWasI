import { notFound } from 'next/navigation';
import { getFullShowDetails } from '@/lib/dataService';
import { formatEpisodeCode } from '@/lib/storyBookUtils';
import ShowDetailClient from './ShowDetailClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasi.vercel.app';

function firstParam(value) {
  return Array.isArray(value) ? value[0] : value;
}

function toBoundedInt(value, max) {
  const n = Number.parseInt(firstParam(value), 10);
  return Number.isFinite(n) && n >= 1 ? Math.min(n, max) : null;
}

/**
 * Reads the shareable checkpoint from the URL: /death-note?s=1&e=25&mode=book
 * (`season` / `episode` are accepted as long-form aliases).
 */
function parseCheckpoint(searchParams = {}) {
  const season = toBoundedInt(searchParams.s ?? searchParams.season, 99);
  const episode = toBoundedInt(searchParams.e ?? searchParams.episode, 2000);
  const modeParam = firstParam(searchParams.mode);
  return {
    hasCheckpoint: season !== null || episode !== null,
    season: season ?? 1,
    episode: episode ?? 1,
    isBookMode: modeParam === 'book' || modeParam === 'storybook'
  };
}

function checkpointLabel(show, season, episode) {
  return show.type === 'movie' ? `Act ${Math.min(episode, 3)}` : `Season ${season} Episode ${episode}`;
}

function buildPagePath(slug, { hasCheckpoint, season, episode, isBookMode }) {
  const params = new URLSearchParams();
  if (hasCheckpoint) {
    params.set('s', String(season));
    params.set('e', String(episode));
  }
  if (isBookMode) params.set('mode', 'book');
  const qs = params.toString();
  return `/${slug}${qs ? `?${qs}` : ''}`;
}

// Serialise JSON-LD safely: "<" inside show data must not be able to close the <script> tag.
function jsonLdString(data) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export async function generateMetadata({ params, searchParams }) {
  const data = await getFullShowDetails(params.slug);
  if (!data || !data.show) {
    return {
      title: 'Show Not Found'
    };
  }

  const { show } = data;
  const checkpoint = parseCheckpoint(searchParams);
  const { hasCheckpoint, season, episode, isBookMode } = checkpoint;
  const pagePath = buildPagePath(show.slug, checkpoint);
  const label = checkpointLabel(show, season, episode);

  const title = isBookMode
    ? `${show.title} Story-Book — The Full Story Without Fillers | WhereWasI`
    : hasCheckpoint
    ? `${show.title} Recap (${label}) — Zero Spoilers | WhereWasI`
    : `${show.title} Recap — Zero Spoilers, Character Deaths & Story-Book | WhereWasI`;

  const description = isBookMode
    ? `Read ${show.title} start to end like a novel: canon chapters only, fillers removed, with reading time, a character primer and an audiobook narrator.`
    : hasCheckpoint
    ? `Catch up on ${show.title} up to ${label} with zero spoilers: what happened, who is still alive, and how every character is connected — nothing past ${formatEpisodeCode(season, episode)}.`
    : `100% zero-spoiler recap, character alive/dead tracker and relationship web for ${show.title} (${show.platform}). Pick the episode you stopped at and catch up without getting spoiled.`;

  const ogParams = new URLSearchParams({ slug: show.slug });
  if (hasCheckpoint) {
    ogParams.set('s', String(season));
    ogParams.set('e', String(episode));
  }
  if (isBookMode) ogParams.set('mode', 'book');
  const ogImage = {
    url: `/api/og?${ogParams.toString()}`,
    width: 1200,
    height: 630,
    alt: `${show.title} — ${isBookMode ? 'Story-Book' : `Recap up to ${formatEpisodeCode(season, episode)}`} on WhereWasI`
  };

  return {
    title: { absolute: title },
    description,
    keywords: [
      `${show.title} recap`,
      `${show.title} season ${season} episode ${episode} recap`,
      `${show.title} character status`,
      `${show.title} who died`,
      `${show.title} zero spoilers`,
      `${show.title} story explained`,
      ...(Array.isArray(show.genre) ? show.genre : []),
      ...(Array.isArray(show.tags) ? show.tags : [])
    ],
    alternates: {
      canonical: pagePath
    },
    openGraph: {
      title,
      description,
      url: pagePath,
      siteName: 'WhereWasI',
      type: show.type === 'movie' ? 'video.movie' : 'video.tv_show',
      images: [ogImage]
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage.url]
    }
  };
}

export default async function ShowPage({ params, searchParams }) {
  const data = await getFullShowDetails(params.slug);

  if (!data || !data.show) {
    notFound();
  }

  const { show } = data;
  const checkpoint = parseCheckpoint(searchParams);
  const { hasCheckpoint, season, episode, isBookMode } = checkpoint;
  const showUrl = `${SITE_URL}/${show.slug}`;
  const pageUrl = `${SITE_URL}${buildPagePath(show.slug, checkpoint)}`;
  const label = checkpointLabel(show, season, episode);
  const isMovie = show.type === 'movie';
  const imageUrl = show.posterUrl || `${SITE_URL}/icon.svg`;

  const workNode = {
    '@type': isMovie ? 'Movie' : 'TVSeries',
    '@id': `${showUrl}#work`,
    name: show.title,
    ...(show.titleHindi ? { alternateName: show.titleHindi } : {}),
    description: show.synopsis,
    genre: show.genre,
    image: imageUrl,
    inLanguage: show.language,
    url: showUrl,
    ...(isMovie
      ? {}
      : {
          numberOfSeasons: show.totalSeasons || 1,
          numberOfEpisodes: show.totalEpisodes || show.episodes?.length || 1
        })
  };

  const checkpointEpisode = !isMovie
    ? (show.episodes || []).find((ep) => Number(ep.season) === season && Number(ep.episode) === episode)
    : null;

  const articleNode = {
    '@type': 'Article',
    '@id': `${pageUrl}#article`,
    headline: isBookMode
      ? `${show.title}: The Complete Story-Book (No Fillers)`
      : `${show.title} Recap up to ${label} — Zero Spoilers`,
    description: isBookMode
      ? `The full ${show.title} story told as a novel, canon chapters only.`
      : `Everything that happens in ${show.title} up to ${label}, with nothing beyond ${formatEpisodeCode(season, episode)}.`,
    image: imageUrl,
    url: pageUrl,
    mainEntityOfPage: pageUrl,
    inLanguage: 'en',
    isAccessibleForFree: true,
    articleSection: isBookMode ? 'Story-Book' : 'Recap',
    about: {
      '@id': `${showUrl}#work`
    },
    ...(checkpointEpisode && hasCheckpoint
      ? {
          mentions: {
            '@type': 'TVEpisode',
            name: checkpointEpisode.title,
            episodeNumber: episode,
            partOfSeason: { '@type': 'TVSeason', seasonNumber: season },
            partOfSeries: { '@id': `${showUrl}#work` }
          }
        }
      : {}),
    author: { '@type': 'Organization', name: 'WhereWasI', url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'WhereWasI',
      url: SITE_URL,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/icon.svg` }
    }
  };

  const breadcrumbNode = {
    '@type': 'BreadcrumbList',
    '@id': `${pageUrl}#breadcrumb`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Browse Vault', item: `${SITE_URL}/browse` },
      { '@type': 'ListItem', position: 3, name: show.title, item: showUrl },
      ...(hasCheckpoint || isBookMode
        ? [
            {
              '@type': 'ListItem',
              position: 4,
              name: isBookMode ? 'Story-Book' : formatEpisodeCode(season, episode),
              item: pageUrl
            }
          ]
        : [])
    ]
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [workNode, articleNode, breadcrumbNode]
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <ShowDetailClient
        initialData={data}
        initialSeason={isMovie ? 1 : season}
        initialEpisode={isMovie ? Math.min(episode, 3) : episode}
        initialMode={isBookMode ? 'storybook' : 'cumulative'}
      />
    </>
  );
}
