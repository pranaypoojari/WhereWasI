import { NextResponse } from 'next/server';
import { getAllShows } from '@/lib/dataService';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const genre = searchParams.get('genre');

    let shows = await getAllShows();

    if (platform && platform !== 'All') {
      shows = shows.filter(s => s.platform?.toLowerCase() === platform.toLowerCase());
    }

    if (genre && genre !== 'All') {
      shows = shows.filter(s => s.genre?.some(g => g.toLowerCase() === genre.toLowerCase()));
    }

    return NextResponse.json({ success: true, shows });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
