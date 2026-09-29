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

    // 3. Fuzzy search local corpus (prioritize title strongly over genre/tags)
    const fuse = new Fuse(allLocalItems, {
      keys: [
        { name: 'title', weight: 0.75 },
        { name: 'titleHindi', weight: 0.2 },
        { name: 'tag', weight: 0.03 },
        { name: 'genre', weight: 0.02 }
      ],
      threshold: 0.34,
      includeScore: true
    });

    const lowerQuery = query.toLowerCase();

    // Filter out weak fuzzy hits that only matched a genre word (like "Dea" matching "Drama")
    let localMatches = fuse
      .search(query)
      .filter(r => {
        const t = (r.item.title || '').toLowerCase();
        const th = (r.item.titleHindi || '').toLowerCase();
        const hasTitleSubstring = t.includes(lowerQuery) || th.includes(lowerQuery);
        // Keep if it matches the title/Hindi title directly, or has a strong Fuse score (< 0.25)
        return hasTitleSubstring || (r.score !== undefined && r.score < 0.25);
      })
      .map(r => ({
        ...r.item,
        _fuseScore: r.score ?? 0.5
      }));

    // Also ensure any direct substring match in allLocalItems is included even if Fuse missed it
    const matchedTitlesSet = new Set(localMatches.map(m => m.title.toLowerCase()));
    for (const item of allLocalItems) {
      const t = item.title.toLowerCase();
      if (!matchedTitlesSet.has(t) && t.includes(lowerQuery)) {
        localMatches.push({ ...item, _fuseScore: 0.05 });
        matchedTitlesSet.add(t);
      }
    }

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
            .slice(0, 4)
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

    // 6. Compute deterministic title-first relevance score so exact/prefix matches ALWAYS rank #1
    const computeRank = (item) => {
      const t = (item.title || '').toLowerCase();
      const th = (item.titleHindi || '').toLowerCase();
      let score = 0;

      if (t === lowerQuery || th === lowerQuery) {
        score += 1000; // Exact title match
      } else if (t.startsWith(lowerQuery) || th.startsWith(lowerQuery)) {
        score += 600; // Starts with query (e.g., "Dea" -> "Death Note")
      } else if (t.split(/[\s:,-]+/).some(word => word.startsWith(lowerQuery))) {
        score += 400; // Word in title starts with query
      } else if (t.includes(lowerQuery) || th.includes(lowerQuery)) {
        score += 250; // Substring match in title
      }

      // Small tie-breaker bonus for inCatalog shows (never overrides a title prefix/substring match)
      if (item.inCatalog) {
        score += 25;
      }

      // Fuse similarity bonus
      if (typeof item._fuseScore === 'number') {
        score += Math.round((1 - item._fuseScore) * 40);
      }

      return score;
    };

    const allCandidates = [
      ...localMatches,
      ...liveTVMatches,
      ...liveMovieMatches
    ];

    const finalResults = allCandidates
      .sort((a, b) => computeRank(b) - computeRank(a))
      .slice(0, 8)
      .map(({ _fuseScore, ...cleanItem }) => cleanItem);

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
