import { getAllShows } from '@/lib/dataService';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://wherewasi.vercel.app';

export default async function sitemap() {
  const staticRoutes = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/generate`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.95,
    },
    {
      url: `${BASE_URL}/browse`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/request`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  let showRoutes = [];
  try {
    const shows = await getAllShows();
    showRoutes = (shows || []).map((show) => ({
      url: `${BASE_URL}/${show.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    }));
  } catch (err) {
    console.warn('Error building show routes in sitemap:', err);
  }

  return [...staticRoutes, ...showRoutes];
}
