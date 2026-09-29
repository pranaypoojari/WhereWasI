import { NextResponse } from 'next/server';
import { getAllShows } from '@/lib/dataService';
import { MEDIA_CATALOG } from '@/lib/mediaCatalog';
import Fuse from 'fuse.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || 'all'; // 'all' | 'movie' | 'anime' | 'tv'

    if (!query || query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    // 1. Fetch current catalog shows
    let catalogShows = [];
    try {
      catalogShows = await getAllShows();
    } catch (e) {
      console.warn('Failed reading catalog shows in suggestions:', e.message);
    }

    // 2. Build local search corpus combining dynamic catalog + MEDIA_CATALOG
    const corpusMap = new Map();

    // Add catalog shows first (they have inCatalog = true)
    for (const show of catalogShows) {
      corpusMap.set(show.title.toLowerCase(), {
        title: show.title,
        titleHindi: show.titleHindi || '',
        slug: show.slug,
        type: show.type || 'tv',
        platform: show.platform || 'Streaming',
        genre: Array.isArray(show.genre) ? show.genre.join(', ') : (show.genre || ''),
        year: show.year || `${show.totalSeasons} Seasons`,
        tag: show.tags?.[0] || 'Ready in Catalog',
        inCatalog: true,
        posterUrl: show.posterUrl || ''
      });
    }

    // Add media catalog items
    for (const item of MEDIA_CATALOG) {
      const key = item.title.toLowerCase();
      if (!corpusMap.has(key)) {
        corpusMap.set(key, {
          title: item.title,
          titleHindi: item.titleHindi || '',
          slug: item.slug || null,
          type: item.type || 'tv',
          platform: item.platform || (item.type === 'movie' ? 'Theatrical / OTT' : 'OTT'),
          genre: item.genre || '',
          year: item.year || '',
          tag: item.tag || '',
          inCatalog: !!item.inCatalog,
          posterUrl: ''
        });
      }
    }

    const allLocalItems = Array.from(corpusMap.values());

    // 3. Fuzzy search local corpus
    const fuse = new Fuse(allLocalItems, {
      keys: [
        { name: 'title', weight: 0.5 },
        { name: 'titleHindi', weight: 0.3 },
        { name: 'genre', weight: 0.1 },
        { name: 'tag', weight: 0.1 }
      ],
      threshold: 0.38,
      includeScore: true
    });

    let localMatches = fuse.search(query).map(r => r.item);

    // Apply category filter if requested
    if (category !== 'all') {
      localMatches = localMatches.filter(item => item.type === category);
    }

    // 4. Query live public TVMaze search for TV & Anime if needed (1.2s timeout)
    let liveTVMatches = [];
    if (category === 'all' || category === 'tv' || category === 'anime') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const tvmazeRes = await fetch(
          `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (tvmazeRes.ok) {
          const tvData = await tvmazeRes.json();
          const existingTitles = new Set(localMatches.map(m => m.title.toLowerCase()));

          liveTVMatches = (tvData || [])
            .map(item => item.show)
            .filter(show => show && !existingTitles.has(show.name.toLowerCase()))
            .slice(0, 3)
            .map(show => ({
              title: show.name,
              slug: null,
              type: show.genres?.some(g => g.toLowerCase() === 'anime') ? 'anime' : 'tv',
              platform: show.network?.name || show.webChannel?.name || 'TV Series',
              genre: show.genres?.join(', ') || 'Series',
              year: show.premiered ? show.premiered.slice(0, 4) : '',
              tag: 'Global TV Database',
              inCatalog: false,
              posterUrl: show.image?.medium || ''
            }));
        }
      } catch (e) {
        // Network timeout or sandbox restriction: gracefully proceed with local results
      }
    }

    // 5. Query Wikipedia OpenSearch for Movies & Media if needed (1.2s timeout)
    let liveMovieMatches = [];
    if (category === 'all' || category === 'movie') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);

        const wikiRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=4&namespace=0&format=json`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);

        if (wikiRes.ok) {
          const wikiData = await wikiRes.json();
          const titles = wikiData[1] || [];
          const descriptions = wikiData[2] || [];
          const existingTitles = new Set([
            ...localMatches.map(m => m.title.toLowerCase()),
            ...liveTVMatches.map(m => m.title.toLowerCase())
          ]);

          for (let i = 0; i < titles.length; i++) {
            const t = titles[i];
            const desc = descriptions[i] || '';
            const lowerT = t.toLowerCase();

            if (existingTitles.has(lowerT)) continue;

            const isMovie = desc.toLowerCase().includes('film') || desc.toLowerCase().includes('movie');
            const isAnime = desc.toLowerCase().includes('anime') || desc.toLowerCase().includes('manga');
            const isSeries = desc.toLowerCase().includes('series') || desc.toLowerCase().includes('television');

            if (isMovie || isAnime || isSeries || desc.length > 5) {
              liveMovieMatches.push({
                title: t,
                slug: null,
                type: isAnime ? 'anime' : isMovie ? 'movie' : 'tv',
                platform: isMovie ? 'Theatrical / Cinema' : 'Broadcast',
                genre: desc ? desc.slice(0, 45) + '...' : 'Global Media',
                year: '',
                tag: 'Global Index',
                inCatalog: false,
                posterUrl: ''
              });
            }
          }
        }
      } catch (e) {
        // Graceful fallback
      }
    }

    // Merge and rank: Catalog shows first, then local media matches, then live public matches
    const finalResults = [
      ...localMatches.filter(m => m.inCatalog),
      ...localMatches.filter(m => !m.inCatalog),
      ...liveTVMatches,
      ...liveMovieMatches
    ].slice(0, 8);

    return NextResponse.json({
      success: true,
      query,
      count: finalResults.length,
      results: finalResults
    });
  } catch (error) {
    console.error('Error in search suggestions API:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
