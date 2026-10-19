/**
 * Pure helpers shared by the Story-Book reader, recap card and API route.
 * Client-safe: no fs, no window access at import time.
 */

export const WORDS_PER_MINUTE = 230;

export function formatEpisodeCode(season, episode) {
  return `S${String(Number(season) || 1).padStart(2, '0')}E${String(Number(episode) || 1).padStart(2, '0')}`;
}

export function countWords(text = '') {
  if (!text) return 0;
  const matches = String(text).trim().match(/\S+/g);
  return matches ? matches.length : 0;
}

export function minutesForWords(words) {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function chapterAnchorId(chapterNumber) {
  return `chapter-${chapterNumber}`;
}

/**
 * Story-Book used when neither the seed data nor the API supplied one.
 * Built strictly from the recap the user is already allowed to see (zero spoilers).
 */
export function buildFallbackStoryBook({ recap, showTitle, season, episode, characterGuide }) {
  const code = formatEpisodeCode(season, episode);
  return {
    title: `${showTitle || 'Complete Series'} — Start-to-End Story-Book`,
    subtitle:
      'Every essential canon plot point from the opening scene to your checkpoint, with filler subplots stripped out.',
    watchTimeSaved: null,
    fillersRemovedCount: 0,
    characterGuide,
    chapters: [
      {
        chapterNumber: 1,
        roman: 'I',
        title: 'Chapter I: The Opening Premise & Inciting Conflict',
        episodesCovered: 'Opening Arc (Start)',
        arcBadge: '100% Canon • Zero Filler',
        paragraphs: [
          recap?.storyRecap ||
            recap?.safeSummary ||
            'The story opens by introducing the core world, central characters, and the pivotal conflict that sets the entire narrative in motion.'
        ],
        keyTakeaway: recap?.keyMoments?.[0] || 'Sets the foundational stakes for all main characters.'
      },
      {
        chapterNumber: 2,
        roman: 'II',
        title: `Chapter II: Turning Points Through ${code}`,
        episodesCovered: `Up to ${code}`,
        arcBadge: 'Core Plot Progression',
        paragraphs: [
          recap?.episodeGist ||
            recap?.storyRecap ||
            'Alliances fracture and hidden motives surface as the protagonists are forced into their most dangerous confrontation yet.'
        ],
        keyTakeaway:
          recap?.cliffhanger ||
          recap?.keyMoments?.[recap?.keyMoments?.length - 1] ||
          'High-stakes turning point leading into the next act.'
      }
    ],
    endingExplained: null
  };
}

/**
 * Adds stable anchor ids, per-chapter word counts and cumulative offsets so the reader
 * can compute "% read" and "time remaining" without re-scanning text on every scroll.
 */
export function normalizeStoryBook(storyBook) {
  if (!storyBook) return null;
  let runningWords = 0;
  const chapters = (storyBook.chapters || []).map((ch, idx) => {
    const chapterNumber = ch.chapterNumber || idx + 1;
    const paragraphs = (ch.paragraphs || []).filter((p) => typeof p === 'string' && p.trim());
    const words = paragraphs.reduce((sum, p) => sum + countWords(p), 0) + countWords(ch.keyTakeaway);
    const chapter = {
      ...ch,
      chapterNumber,
      id: chapterAnchorId(chapterNumber),
      paragraphs,
      words,
      wordsBefore: runningWords
    };
    runningWords += words;
    return chapter;
  });

  const endingWords = countWords(storyBook.endingExplained);
  const totalWords = runningWords + endingWords;

  return {
    ...storyBook,
    chapters,
    totalWords,
    readingTimeMinutes: storyBook.readingTimeMinutes || minutesForWords(totalWords)
  };
}

/**
 * Splits text into bionic-reading segments: the first 3 letters of every word are emphasised
 * (1 letter for words of 3 characters or fewer so short words don't turn fully bold).
 */
export function toBionicSegments(text = '') {
  return String(text)
    .split(/(\s+)/)
    .map((token) => {
      if (!token || /^\s+$/.test(token)) return { lead: '', rest: token };
      const match = token.match(/^([^\p{L}\p{N}]*)([\p{L}\p{N}][\s\S]*)$/u);
      if (!match) return { lead: '', rest: token };
      const [, prefix, word] = match;
      const letters = word.match(/^[\p{L}\p{N}'’-]+/u)?.[0] || word;
      const boldLen = letters.length <= 3 ? 1 : 3;
      return { prefix, lead: word.slice(0, boldLen), rest: word.slice(boldLen) };
    });
}

/**
 * Splits a paragraph into speakable chunks. Chrome silently stops utterances longer than
 * ~15 seconds, so long paragraphs are broken at sentence boundaries (max ~220 chars).
 */
export function toSpeechChunks(text = '', maxLen = 220) {
  const sentences = String(text).match(/[^.!?]+[.!?]+["'”’)]*\s*|[^.!?]+$/g) || [String(text)];
  const chunks = [];
  let current = '';
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current) {
      chunks.push(current.trim());
      current = '';
    }
    current += sentence;
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Discord / Reddit friendly Markdown export of whatever the user is currently viewing.
 */
export function buildRecapMarkdown({ showTitle, season, episode, view, recap, storyBook, url }) {
  const code = formatEpisodeCode(season, episode);
  const lines = [];

  if (view === 'storybook' && storyBook) {
    lines.push(`## 📖 ${storyBook.title || `${showTitle} — Story-Book`}`);
    if (storyBook.watchTimeSaved) lines.push(`*${storyBook.watchTimeSaved} • ~${storyBook.readingTimeMinutes} min read*`);
    lines.push('');
    for (const ch of storyBook.chapters || []) {
      lines.push(`### ${ch.title}`);
      if (ch.episodesCovered) lines.push(`*Covers: ${ch.episodesCovered}*`);
      lines.push('');
      if (ch.keyTakeaway) lines.push(`**Key plot turn:** ${ch.keyTakeaway}`);
      lines.push('');
    }
  } else {
    const body =
      view === 'gist'
        ? recap?.episodeGist || recap?.safeSummary || recap?.storyRecap
        : recap?.storyRecap || recap?.safeSummary || recap?.episodeGist;
    lines.push(`## ${showTitle} — Recap up to ${code} (Zero Spoilers)`);
    if (recap?.episodeTitle) lines.push(`**Episode:** "${recap.episodeTitle}"`);
    lines.push('');
    if (body) {
      // Discord collapses single newlines inside paragraphs; keep paragraph breaks explicit.
      lines.push(String(body).replace(/\n{3,}/g, '\n\n'));
      lines.push('');
    }
    if (recap?.keyMoments?.length) {
      lines.push('### Key moments');
      for (const moment of recap.keyMoments) lines.push(`- ${moment}`);
      lines.push('');
    }
  }

  lines.push(`> 🛡️ Spoiler-free up to ${code} via WhereWasI${url ? ` — ${url}` : ''}`);
  return lines.join('\n').trim();
}

/**
 * Clipboard write with a textarea fallback for browsers / iframes without the async API.
 */
export async function copyTextToClipboard(text) {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to legacy path (e.g. permissions policy blocked)
    }
  }
  if (typeof document === 'undefined') return false;
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(textarea);
  return ok;
}
