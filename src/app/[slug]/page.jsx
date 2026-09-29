import { notFound } from 'next/navigation';
import { getFullShowDetails } from '@/lib/dataService';
import ShowDetailClient from './ShowDetailClient';

export async function generateMetadata({ params }) {
  const data = await getFullShowDetails(params.slug);
  if (!data || !data.show) {
    return {
      title: 'Show Not Found — WhereWasI',
    };
  }

  return {
    title: `${data.show.title} Recap & Character Status — WhereWasI`,
    description: `Zero-spoiler recap and character status timeline for ${data.show.title}. Scrub by episode and refresh your memory safely.`,
  };
}

export default async function ShowPage({ params }) {
  const data = await getFullShowDetails(params.slug);

  if (!data || !data.show) {
    notFound();
  }

  return <ShowDetailClient initialData={data} />;
}
