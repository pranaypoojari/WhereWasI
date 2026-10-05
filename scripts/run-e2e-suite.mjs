/**
 * Comprehensive End-to-End Automated Test Suite for WhereWasI
 * Tests across eras (1970s - 2020s), media types, search ranking,
 * episode progression, Story-Book completeness, and edge cases.
 */

import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3005';

// Matrix of Test Scenarios
const TEST_CASES = [
  // --- ERA 1: 1970s - 1980s (Classics) ---
  {
    id: 'TC-01',
    category: 'Era: 1970s',
    title: 'The Godfather',
    year: 1972,
    type: 'movie',
    season: 1,
    episode: 1,
    description: '1970s classic mob cinema, Act 1 & 2 checkpoint',
    api: 'generate'
  },
  {
    id: 'TC-02',
    category: 'Era: 1980s',
    title: 'Blade Runner',
    year: 1982,
    type: 'movie',
    season: 1,
    episode: 3,
    description: '1980s neo-noir sci-fi classic, Full Movie Ending checkpoint',
    api: 'generate'
  },

  // --- ERA 2: 1990s (Cult Classics & TV Golden Era) ---
  {
    id: 'TC-03',
    category: 'Era: 1990s',
    title: 'Pulp Fiction',
    year: 1994,
    type: 'movie',
    season: 1,
    episode: 1,
    description: '1990s non-linear narrative film',
    api: 'generate'
  },
  {
    id: 'TC-04',
    category: 'Era: 1990s',
    title: 'Friends',
    year: 1994,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '1990s multi-season comedy/sitcom pilot',
    api: 'generate'
  },
  {
    id: 'TC-05',
    category: 'Era: 1990s',
    title: 'Cowboy Bebop',
    year: 1998,
    type: 'anime',
    season: 1,
    episode: 5,
    description: '1990s classic episodic anime mid-season (Ballad of Fallen Angels)',
    api: 'generate'
  },
  {
    id: 'TC-06',
    category: 'Era: 1990s',
    title: 'The Sopranos',
    year: 1999,
    type: 'tv',
    season: 1,
    episode: 5,
    description: '1990s prestige HBO mob drama mid-season',
    api: 'generate'
  },
  {
    id: 'TC-07',
    category: 'Era: 1990s',
    title: 'The Matrix',
    year: 1999,
    type: 'movie',
    season: 1,
    episode: 2,
    description: '1990s sci-fi epic Act 3 pre-climax',
    api: 'generate'
  },

  // --- ERA 3: 2000s (Prestige TV & Milestone Anime) ---
  {
    id: 'TC-08',
    category: 'Era: 2000s',
    title: 'Death Note',
    year: 2006,
    type: 'anime',
    season: 1,
    episode: 1,
    description: '2000s psychological anime pilot (Rebirth & rules intro)',
    api: 'generate'
  },
  {
    id: 'TC-09',
    category: 'Era: 2000s',
    title: 'Death Note',
    year: 2006,
    type: 'anime',
    season: 1,
    episode: 2,
    description: '2000s psychological anime L vs Light broadcast confrontation',
    api: 'generate'
  },
  {
    id: 'TC-10',
    category: 'Era: 2000s',
    title: 'Death Note',
    year: 2006,
    type: 'anime',
    season: 1,
    episode: 37,
    description: '2000s anime series finale (Yellow Box Warehouse & Kira ending)',
    api: 'generate'
  },
  {
    id: 'TC-11',
    category: 'Era: 2000s',
    title: 'The Dark Knight',
    year: 2008,
    type: 'movie',
    season: 1,
    episode: 3,
    description: '2000s superhero masterpiece full synopsis',
    api: 'generate'
  },
  {
    id: 'TC-12',
    category: 'Era: 2000s',
    title: 'Breaking Bad',
    year: 2008,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2000s serialized crime drama pilot (Heisenberg origin)',
    api: 'generate'
  },
  {
    id: 'TC-13',
    category: 'Era: 2000s',
    title: 'Breaking Bad',
    year: 2008,
    type: 'tv',
    season: 4,
    episode: 13,
    description: '2000s serialized crime drama Season 4 Finale (Face Off)',
    api: 'generate'
  },

  // --- ERA 4: 2010s (Streaming Boom, Indian OTT & Anime Renaissance) ---
  {
    id: 'TC-14',
    category: 'Era: 2010s',
    title: 'Inception',
    year: 2010,
    type: 'movie',
    season: 1,
    episode: 1,
    description: '2010s psychological sci-fi Act 1 & 2',
    api: 'generate'
  },
  {
    id: 'TC-15',
    category: 'Era: 2010s',
    title: 'Game of Thrones',
    year: 2011,
    type: 'tv',
    season: 1,
    episode: 9,
    description: '2010s epic fantasy high-stakes climax (Baelor)',
    api: 'generate'
  },
  {
    id: 'TC-16',
    category: 'Era: 2010s',
    title: 'Attack on Titan',
    year: 2013,
    type: 'anime',
    season: 1,
    episode: 1,
    description: '2010s dark fantasy anime pilot (Wall Maria breach)',
    api: 'generate'
  },
  {
    id: 'TC-17',
    category: 'Era: 2010s',
    title: 'Attack on Titan',
    year: 2013,
    type: 'anime',
    season: 3,
    episode: 16,
    description: '2010s anime multi-season mid-point battle (Hero)',
    api: 'generate'
  },
  {
    id: 'TC-18',
    category: 'Era: 2010s',
    title: 'Interstellar',
    year: 2014,
    type: 'movie',
    season: 1,
    episode: 3,
    description: '2010s space epic complete storyline & ending',
    api: 'generate'
  },
  {
    id: 'TC-19',
    category: 'Era: 2010s',
    title: 'Stranger Things',
    year: 2016,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2010s 80s sci-fi nostalgia pilot (Vanishing of Will Byers)',
    api: 'generate'
  },
  {
    id: 'TC-20',
    category: 'Era: 2010s',
    title: 'Stranger Things',
    year: 2016,
    type: 'tv',
    season: 4,
    episode: 7,
    description: '2010s sci-fi late season reveal (Massacre at Hawkins Lab)',
    api: 'generate'
  },
  {
    id: 'TC-21',
    category: 'Era: 2010s (Indian OTT)',
    title: 'Mirzapur',
    year: 2018,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2010s Indian crime drama pilot (Purvanchal power struggle)',
    api: 'generate'
  },
  {
    id: 'TC-22',
    category: 'Era: 2010s',
    title: 'The Boys',
    year: 2019,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2010s subversive superhero pilot (Robin & Vought bugging)',
    api: 'generate'
  },
  {
    id: 'TC-23',
    category: 'Era: 2010s',
    title: 'The Boys',
    year: 2019,
    type: 'tv',
    season: 3,
    episode: 6,
    description: '2010s subversive superhero mid-season milestone (Herogasm)',
    api: 'generate'
  },

  // --- ERA 5: 2020s (Modern Global & Recent Releases) ---
  {
    id: 'TC-24',
    category: 'Era: 2020s',
    title: 'Squid Game',
    year: 2021,
    type: 'tv',
    season: 1,
    episode: 6,
    description: '2020s Korean global phenomenon milestone (Gganbu)',
    api: 'generate'
  },
  {
    id: 'TC-25',
    category: 'Era: 2020s (Indian OTT)',
    title: 'Panchayat',
    year: 2020,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2020s Indian rural slice-of-life pilot (Phulera arrival)',
    api: 'generate'
  },
  {
    id: 'TC-26',
    category: 'Era: 2020s',
    title: 'RRR',
    year: 2022,
    type: 'movie',
    season: 1,
    episode: 3,
    description: '2020s Indian global blockbuster complete movie synopsis',
    api: 'generate'
  },
  {
    id: 'TC-27',
    category: 'Era: 2020s',
    title: 'House of the Dragon',
    year: 2022,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2020s Targaryen prequel pilot (Heirs of the Dragon)',
    api: 'generate'
  },
  {
    id: 'TC-28',
    category: 'Era: 2020s',
    title: 'Oppenheimer',
    year: 2023,
    type: 'movie',
    season: 1,
    episode: 3,
    description: '2020s historical biographical drama complete synopsis',
    api: 'generate'
  },
  {
    id: 'TC-29',
    category: 'Era: 2020s',
    title: 'Fallout',
    year: 2024,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2024 video game adaptation pilot (Vault 33 breach)',
    api: 'generate'
  },
  {
    id: 'TC-30',
    category: 'Era: 2020s',
    title: 'Shogun',
    year: 2024,
    type: 'tv',
    season: 1,
    episode: 1,
    description: '2024 feudal Japan historical epic pilot',
    api: 'generate'
  },

  // --- SEARCH ENGINE RANKING & SUGGESTION TESTS ---
  {
    id: 'TC-31',
    category: 'Search Engine',
    query: 'Dea',
    categoryParam: 'all',
    expectedTopMatch: 'Death Note',
    description: 'Search prefix ranking: "Dea" prefix matches Death Note',
    api: 'search'
  },
  {
    id: 'TC-32',
    category: 'Search Engine',
    query: 'Death Note',
    categoryParam: 'anime',
    expectedTopMatch: 'Death Note',
    description: 'Search exact title match with category=anime',
    api: 'search'
  },
  {
    id: 'TC-33',
    category: 'Search Engine',
    query: 'Inception',
    categoryParam: 'movie',
    expectedTopMatch: 'Inception',
    description: 'Search movie exact title match with category=movie',
    api: 'search'
  },
  {
    id: 'TC-34',
    category: 'Search Engine',
    query: 'मिर्ज़ापुर',
    categoryParam: 'all',
    expectedTopMatch: 'Mirzapur',
    description: 'Search Hindi bilingual query for Mirzapur',
    api: 'search'
  },
  {
    id: 'TC-35',
    category: 'Search Engine',
    query: 'a',
    categoryParam: 'all',
    expectedEmpty: true,
    description: 'Edge case: single-character query should return empty array (< 2 chars)',
    api: 'search'
  },

  // --- EDGE CASES & FAILURE BOUNDARY TESTS ---
  {
    id: 'TC-36',
    category: 'Edge Case: Validation',
    payload: {},
    expectedStatus: 400,
    description: 'Missing title in generate request should return HTTP 400 Bad Request',
    api: 'generate_edge'
  },
  {
    id: 'TC-37',
    category: 'Edge Case: Validation',
    payload: { title: '   ', type: 'tv' },
    expectedStatus: 400,
    description: 'Whitespace-only title in generate request should return HTTP 400',
    api: 'generate_edge'
  },
  {
    id: 'TC-38',
    category: 'Edge Case: Special Characters',
    title: 'Steins;Gate',
    type: 'anime',
    season: 1,
    episode: 1,
    description: 'Anime title with semicolon ("Steins;Gate")',
    api: 'generate'
  },
  {
    id: 'TC-39',
    category: 'Edge Case: Punctuation & Subtitle',
    title: 'Spider-Man: Across the Spider-Verse',
    type: 'movie',
    season: 1,
    episode: 3,
    description: 'Movie title with colon and hyphens',
    api: 'generate'
  },
  {
    id: 'TC-40',
    category: 'Edge Case: Format Normalization',
    title: 'The Dark Knight',
    type: 'movie',
    season: 4,
    episode: 12,
    description: 'Movie passed with Season 4 Episode 12 (should gracefully normalize to Season 1)',
    api: 'generate'
  },
  {
    id: 'TC-41',
    category: 'Edge Case: Extreme Episode Number',
    title: 'Stranger Things',
    type: 'tv',
    season: 1,
    episode: 999,
    description: 'Episode 999 requested on 8-episode season (should clamp/handle gracefully)',
    api: 'generate'
  },
  {
    id: 'TC-42',
    category: 'Edge Case: Obscure / Gibberish Title',
    title: 'ZzQqXxRandomUnknownShow98765',
    type: 'tv',
    season: 1,
    episode: 1,
    description: 'Completely unknown non-existent title (should fallback gracefully, no 500 crash)',
    api: 'generate'
  }
];

async function runTest(testCase) {
  const startTime = Date.now();
  const result = {
    ...testCase,
    status: 'PENDING',
    latencyMs: 0,
    httpStatus: 0,
    assertions: [],
    details: {},
    notes: ''
  };

  try {
    if (testCase.api === 'search') {
      const url = `${BASE_URL}/api/search/suggestions?q=${encodeURIComponent(
        testCase.query
      )}&category=${testCase.categoryParam || 'all'}`;
      const res = await fetch(url);
      result.latencyMs = Date.now() - startTime;
      result.httpStatus = res.status;

      if (!res.ok) {
        result.status = 'FAIL';
        result.notes = `HTTP ${res.status} returned by search suggestions API`;
        return result;
      }

      const data = await res.json();
      result.details = {
        resultsCount: data.results?.length || 0,
        topTitles: (data.results || []).slice(0, 3).map((r) => r.title)
      };

      if (testCase.expectedEmpty) {
        if (data.results?.length === 0) {
          result.status = 'PASS';
          result.notes = 'Correctly returned 0 results for single-character query';
        } else {
          result.status = 'FAIL';
          result.notes = `Expected 0 results for < 2 chars, got ${data.results.length}`;
        }
        return result;
      }

      const topTitle = data.results?.[0]?.title || '';
      const containsExpected = (data.results || []).some((r) =>
        r.title.toLowerCase().includes(testCase.expectedTopMatch.toLowerCase())
      );

      if (topTitle.toLowerCase().includes(testCase.expectedTopMatch.toLowerCase())) {
        result.status = 'PASS';
        result.notes = `Rank #1 match: "${topTitle}"`;
      } else if (containsExpected) {
        result.status = 'WARN';
        result.notes = `Expected "${testCase.expectedTopMatch}" as #1, but ranked lower. Top was "${topTitle}".`;
      } else {
        result.status = 'FAIL';
        result.notes = `Expected "${testCase.expectedTopMatch}" in results, but found none.`;
      }
      return result;
    }

    if (testCase.api === 'generate_edge') {
      const res = await fetch(`${BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testCase.payload)
      });
      result.latencyMs = Date.now() - startTime;
      result.httpStatus = res.status;

      if (res.status === testCase.expectedStatus) {
        result.status = 'PASS';
        result.notes = `Correctly returned expected HTTP ${res.status}`;
      } else {
        result.status = 'FAIL';
        result.notes = `Expected HTTP ${testCase.expectedStatus}, got HTTP ${res.status}`;
      }
      return result;
    }

    // Default: api === 'generate'
    const payload = {
      title: testCase.title,
      type: testCase.type,
      season: testCase.season,
      episode: testCase.episode
    };

    const res = await fetch(`${BASE_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    result.latencyMs = Date.now() - startTime;
    result.httpStatus = res.status;

    if (!res.ok) {
      result.status = 'FAIL';
      result.notes = `HTTP ${res.status} returned by generate API`;
      return result;
    }

    const data = await res.json();
    if (!data.success) {
      result.status = 'FAIL';
      result.notes = `API returned success=false: ${data.error || 'Unknown error'}`;
      return result;
    }

    const show = data.show || {};
    const recap = data.recap || {};
    const storyBook = recap.storyBook || show.storyBook || {};
    const characterGuide = recap.characterGuide || storyBook.characterGuide || {};
    const characters = characterGuide.characters || data.characterStatuses || [];
    const chapters = storyBook.chapters || [];

    const gistLength = (recap.episodeGist || '').length;
    const storyRecapLength = (recap.storyRecap || '').length;
    const chaptersCount = chapters.length;
    const totalWordCount = chapters.reduce((sum, ch) => {
      const paras = ch.paragraphs || [];
      return sum + paras.join(' ').split(/\s+/).length;
    }, 0);

    result.details = {
      returnedTitle: show.title,
      episodeTitle: recap.episodeTitle,
      totalSeasons: show.totalSeasons,
      totalEpisodes: show.totalEpisodes,
      gistLengthChars: gistLength,
      storyRecapLengthChars: storyRecapLength,
      characterCount: characters.length,
      chaptersCount: chaptersCount,
      storyBookWords: totalWordCount,
      hasCharacterGuide: !!characterGuide.worldPremise || characters.length > 0,
      hasEndingExplained: !!storyBook.endingExplained,
      timeSavedText: storyBook.watchTimeSaved || 'N/A',
      fillersRemoved: storyBook.fillersRemovedCount || 0
    };

    // Quality assertions
    const issues = [];
    if (gistLength < 100) {
      issues.push(`Episode gist is short (${gistLength} chars)`);
    }
    if (chaptersCount < 2) {
      issues.push(`Story-Book has fewer than 2 chapters (${chaptersCount})`);
    }
    if (!storyBook.endingExplained) {
      issues.push('Missing Ending Explained in Story-Book');
    }
    if (characters.length === 0) {
      issues.push('Missing beginner character primer');
    }

    if (issues.length === 0) {
      result.status = 'PASS';
      result.notes = `High Quality: ${chaptersCount} chapters (${totalWordCount} words), ${characters.length} characters, ${gistLength} char gist`;
    } else if (issues.length === 1 && gistLength >= 80) {
      result.status = 'WARN';
      result.notes = `Acceptable with warnings: ${issues.join('; ')}`;
    } else {
      result.status = 'FAIL';
      result.notes = `Quality issues detected: ${issues.join('; ')}`;
    }

    return result;
  } catch (err) {
    result.latencyMs = Date.now() - startTime;
    result.status = 'FAIL';
    result.notes = `Execution exception: ${err.message}`;
    return result;
  }
}

async function main() {
  console.log(`\n======================================================`);
  console.log(`  WhereWasI End-to-End Test Suite Execution Started   `);
  console.log(`  Base Target: ${BASE_URL}                            `);
  console.log(`  Total Test Cases: ${TEST_CASES.length}              `);
  console.log(`======================================================\n`);

  const results = [];
  let passCount = 0;
  let warnCount = 0;
  let failCount = 0;

  for (let i = 0; i < TEST_CASES.length; i++) {
    const tc = TEST_CASES[i];
    process.stdout.write(
      `[${i + 1}/${TEST_CASES.length}] Running ${tc.id}: ${tc.title || tc.query || 'Edge'} (${
        tc.category
      })... `
    );

    const res = await runTest(tc);
    results.push(res);

    if (res.status === 'PASS') {
      passCount++;
      console.log(`\x1b[32mPASS\x1b[0m (${res.latencyMs}ms)`);
    } else if (res.status === 'WARN') {
      warnCount++;
      console.log(`\x1b[33mWARN\x1b[0m (${res.latencyMs}ms) - ${res.notes}`);
    } else {
      failCount++;
      console.log(`\x1b[31mFAIL\x1b[0m (${res.latencyMs}ms) - ${res.notes}`);
    }

    // Small pacing pause to be gentle on external public APIs (TVMaze / Wikipedia)
    await new Promise((r) => setTimeout(r, 150));
  }

  const summary = {
    executedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    totalTests: TEST_CASES.length,
    passed: passCount,
    warnings: warnCount,
    failed: failCount,
    passRatePercent: Math.round((passCount / TEST_CASES.length) * 1000) / 10,
    results
  };

  const outputPath = path.join(process.cwd(), 'test-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2), 'utf-8');

  console.log(`\n======================================================`);
  console.log(`  Test Suite Completed!`);
  console.log(`  Passed: ${passCount} | Warnings: ${warnCount} | Failed: ${failCount}`);
  console.log(`  Pass Rate: ${summary.passRatePercent}%`);
  console.log(`  Raw Results Saved To: ${outputPath}`);
  console.log(`======================================================\n`);
}

main().catch((e) => {
  console.error('Fatal error running test suite:', e);
  process.exit(1);
});
