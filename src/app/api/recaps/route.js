import { NextResponse } from 'next/server';
import {
  getFullShowDetails,
  computeCharacterStatuses,
  computeRelationships,
  getRecapForEpisode
} from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const season = parseInt(searchParams.get('season') || '1', 10);
    const episode = parseInt(searchParams.get('episode') || '1', 10);

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug parameter is required' }, { status: 400 });
    }

    const data = await getFullShowDetails(slug);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Show not found' }, { status: 404 });
    }

    const { show, characters, recaps } = data;

    const recap = getRecapForEpisode(recaps, season, episode);
    const characterStatuses = computeCharacterStatuses(characters, season, episode);
    const relationships = computeRelationships(recaps, season, episode);

    return NextResponse.json({
      success: true,
      show,
      season,
      episode,
      recap,
      characterStatuses,
      relationships
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
