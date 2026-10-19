import { NextResponse } from 'next/server';
import dns from 'node:dns';
import {
  saveDynamicShow,
  saveDynamicRecap
} from '@/lib/dataService';
import { computeCharacterStatuses, filterRelationshipsByEpisode } from '@/lib/timelineUtils';
import { countWords, formatEpisodeCode, minutesForWords, normalizeStoryBook } from '@/lib/storyBookUtils';

// Some hosts resolve AAAA records first and then hang on broken IPv6 routes to TVMaze/Jikan.
// setDefaultResultOrder only exists on Node >= 16.4 / 17, so feature-detect before calling it.
try {
  if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch {
  // Not supported in this runtime; default resolution order is fine.
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ALLOWED_TYPES = new Set(['tv', 'anime', 'movie', 'movie_franchise']);
const MAX_TITLE_LENGTH = 120;
const MIN_PREMISE_WORDS = 150;
const DEFAULT_RUNTIME_MINUTES = { tv: 45, anime: 24, movie: 140, movie_franchise: 140 };

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * JSON fetch with a hard timeout and exponential backoff on 429 / 5xx (honours Retry-After).
 * Returns null instead of throwing so every source in the cascade can fail independently.
 */
async function fetchJson(url, { headers = {}, timeoutMs = 8000, retries = 0, backoffMs = 800 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) {
          const retryAfter = Number(res.headers.get('retry-after'));
          const wait =
            Number.isFinite(retryAfter) && retryAfter > 0
              ? Math.min(retryAfter * 1000, 5000)
              : backoffMs * 2 ** attempt;
          await sleep(wait);
          continue;
        }
        return null;
      }
      if (!res.ok) return null;
      const text = (await res.text()).trim();
      if (!text.startsWith('{') && !text.startsWith('[')) return null;
      return JSON.parse(text);
    } catch {
      if (attempt < retries) {
        await sleep(backoffMs * 2 ** attempt);
        continue;
      }
      return null;
    }
  }
  return null;
}

/**
 * Strip HTML tags from TVMaze / web summaries cleanly
 */
function stripHtml(html = '') {
  if (!html) return '';
  return html
    .replace(/<\/p>/gi, ' ')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect whether an episode is likely a filler / recap / clip-show episode.
 * Titles are matched on single keywords; summaries only on unambiguous phrases, because words
 * like "special" or "recap" appear in ordinary plot synopses ("a special agent arrives").
 */
const FILLER_TITLE_PATTERNS = [
  /\brecap\b/i,
  /\bclip show\b/i,
  /\bspecial\b/i,
  /\bfiller\b/i,
  /\bomake\b/i,
  /\bcompilation\b/i,
  /\bretrospective\b/i,
  /\bbehind the scenes\b/i,
  /\bmaking of\b/i,
  /\bbonus episode\b/i
];
const FILLER_SUMMARY_PATTERNS = [
  /\brecap (episode|special)\b/i,
  /\bclip show\b/i,
  /\bfiller (episode|arc|story)\b/i,
  /\bnon-canon\b/i,
  /\bside story\b/i,
  /\blooks back (at|on) (the|previous|past)\b/i,
  /\bbehind[- ]the[- ]scenes\b/i,
  /\bmaking of\b/i,
  /\bcompilation of (scenes|clips|footage|highlights)\b/i,
  /\bsummar(y|ises|izes) (of )?the (story|events|series|season) so far\b/i
];

function isFillerEpisode(epTitle = '', epSummary = '', tvMazeType = '') {
  if (tvMazeType === 'insignificant_special') return true;
  return (
    FILLER_TITLE_PATTERNS.some((re) => re.test(epTitle)) ||
    FILLER_SUMMARY_PATTERNS.some((re) => re.test(epSummary))
  );
}

function formatTimeSaved(minutes) {
  if (minutes < 60) return `${Math.max(1, Math.round(minutes))} Minutes Saved`;
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `${hours} Hours Saved`;
}

function splitParagraphs(text = '') {
  return String(text)
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function splitSentences(text = '') {
  return String(text).match(/[^.!?]+[.!?]+["'”’)]*|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) || [];
}

/**
 * Guarantees the World Premise clears MIN_PREMISE_WORDS using only spoiler-safe sources
 * (synopsis, article lead, MAL background), then factual metadata. Never pulls later plot sections.
 */
function ensureWorldPremise(premise, { officialTitle, type, platform, genres, totalSeasons, totalEpisodes, wikiIntro, jikanBackground, synopsis }) {
  const parts = splitParagraphs(premise);
  const seen = (text) => parts.some((p) => p.includes(text.slice(0, 80)) || text.includes(p.slice(0, 80)));
  const wordTotal = () => countWords(parts.join(' '));

  for (const candidate of [synopsis, wikiIntro, jikanBackground]) {
    for (const para of splitParagraphs(candidate)) {
      if (wordTotal() >= MIN_PREMISE_WORDS) break;
      if (para.length > 60 && !seen(para)) parts.push(para);
    }
  }

  if (wordTotal() < MIN_PREMISE_WORDS) {
    const noun = type === 'anime' ? 'anime series' : type === 'movie' || type === 'movie_franchise' ? 'film' : 'series';
    const genreText = genres?.length ? genres.slice(0, 3).join(', ').toLowerCase() : 'drama';
    const scope =
      type === 'movie' || type === 'movie_franchise'
        ? 'told across three acts'
        : `spanning ${totalSeasons} season${totalSeasons === 1 ? '' : 's'} and ${totalEpisodes} episodes`;
    parts.push(
      `${officialTitle} is a ${genreText} ${noun} ${scope}, available on ${platform}. ` +
        `The story is driven by its central characters, the goals that put them on a collision course, and the ` +
        `consequences of every alliance and betrayal along the way. If you are new to it, start with the Who's Who ` +
        `guide below: it explains each major character's role and motivation in plain language, so names and ` +
        `relationships make sense from the very first chapter.`
    );
  }

  if (wordTotal() < MIN_PREMISE_WORDS) {
    parts.push(
      `Everything on this page is locked to the checkpoint you choose. The recap, the character status board and ` +
        `the relationship web only reflect events up to that episode, and any later fates stay hidden behind an ` +
        `explicit spoiler warning. Move the checkpoint forward one episode at a time, or switch to the Story-Book ` +
        `to read the whole canon storyline as a novel with filler episodes removed.`
    );
  }

  return parts.join('\n\n');
}

/**
 * Guarantees the episode gist has at least two paragraphs by appending spoiler-safe context.
 */
function ensureMinParagraphs(text, extras = [], min = 2) {
  const parts = splitParagraphs(text);
  for (const extra of extras) {
    if (parts.length >= min) break;
    const clean = (extra || '').trim();
    if (clean && !parts.some((p) => p.includes(clean.slice(0, 80)))) parts.push(clean);
  }
  return parts.join('\n\n');
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];

/**
 * Guarantees at least two chapters, splitting a single long chapter at a paragraph or
 * sentence boundary so every Story-Book has a beginning and an end.
 */
function ensureMinChapters(chapters, { isMovie }) {
  if (chapters.length >= 2) return chapters;
  const only = chapters[0];
  if (!only) return chapters;

  let first = only.paragraphs;
  let second = [];
  if (only.paragraphs.length >= 2) {
    const mid = Math.ceil(only.paragraphs.length / 2);
    first = only.paragraphs.slice(0, mid);
    second = only.paragraphs.slice(mid);
  } else {
    const sentences = splitSentences(only.paragraphs[0] || '');
    if (sentences.length < 2) return chapters;
    const mid = Math.ceil(sentences.length / 2);
    first = [sentences.slice(0, mid).join(' ')];
    second = [sentences.slice(mid).join(' ')];
  }

  const labels = isMovie ? ['Act 1 of 2', 'Act 2 of 2'] : ['First half', 'Second half'];
  return [
    {
      ...only,
      chapterNumber: 1,
      roman: 'I',
      title: 'Chapter I: The World Setup, Core Rules & Inciting Incident',
      episodesCovered: only.episodesCovered && !isMovie ? `${only.episodesCovered} (${labels[0]})` : labels[0],
      paragraphs: first,
      keyTakeaway: splitSentences(first[first.length - 1]).slice(-1)[0] || only.keyTakeaway
    },
    {
      ...only,
      chapterNumber: 2,
      roman: 'II',
      title: 'Chapter II: Turning Points & The Road to the Climax',
      episodesCovered: only.episodesCovered && !isMovie ? `${only.episodesCovered} (${labels[1]})` : labels[1],
      paragraphs: second,
      keyTakeaway: only.keyTakeaway
    }
  ];
}

/**
 * Picks the best avatar for a curated character by name instead of list position
 * (Jikan / TVMaze order rarely matches the primer order, which mismatched faces).
 */
function matchAvatarByName(primerName, candidates = []) {
  const parts = primerName
    .replace(/["“”]/g, '')
    .split(/[()&]/)
    .map((p) => p.trim().toLowerCase())
    .filter(Boolean);
  const hit = candidates.find((c) => {
    const n = (c.name || '').toLowerCase();
    return n && parts.some((p) => n === p || n.startsWith(`${p} `));
  });
  return hit?.avatar || '';
}

/**
 * Deep curated World Primers, Character Guides ("Who's Who"), and Multi-Chapter Novel Lore
 * Ensures even a 100% newcomer who has never seen 1 second of the show understands every character & plot twist.
 */
const DEEP_SHOW_ENCYCLOPEDIA = {
  'death-note': {
    worldPremise:
      'Light Yagami, a brilliant 17-year-old Japanese student disgusted by global crime, picks up a supernatural black notebook called the "Death Note" dropped by a bored Death God (Shinigami) named Ryuk. The notebook carries one absolute rule: any human whose real name is written inside while the writer pictures their face will die—defaulting to a fatal heart attack within 40 seconds. Light secretly begins executing criminals worldwide under the public alias "Kira" (from the English word "Killer"), planning to rule over a crime-free utopia as its living God. Because Kira only needs a name and a face to kill anyone on Earth, Interpol turns to "L"—the world\'s greatest, shadowy master detective who hides his face and real name behind a digital screen, triggering the ultimate psychological cat-and-mouse war.',
    characterPrimer: [
      {
        name: 'Light Yagami ("Kira")',
        role: 'The Protagonist / Secret Vigilante God',
        explanation:
          'Japan’s #1 high school prodigy and the son of the Police Chief. After finding the Death Note, he becomes "Kira," secretly executing criminals worldwide while joining the police task force to hunt himself from the inside.'
      },
      {
        name: 'L (L Lawliet)',
        role: 'The World’s Greatest Detective (Kira’s Arch-Nemesis)',
        explanation:
          'An eccentric, sleep-deprived, barefoot genius obsessed with sweets who has solved every impossible case in history. Because Light needs both a real name and a face to kill with the Death Note, L operates in total secrecy—communicating through a voice changer and a single Gothic letter "L".'
      },
      {
        name: 'Ryuk',
        role: 'The Shinigami (God of Death)',
        explanation:
          'A bored Death God from the Shinigami Realm who intentionally dropped an extra Death Note into the human world just to watch the chaos. Only humans who have touched the notebook can see or hear him.'
      },
      {
        name: 'Soichiro Yagami',
        role: 'Chief of the Japanese Kira Task Force',
        explanation:
          'Light’s honorable, deeply moral father and head of the police investigation—tragically unaware that the mass murderer Kira he is risking his life to catch is his own teenage son.'
      },
      {
        name: 'Misa Amane ("The Second Kira")',
        role: 'Pop Idol with the Shinigami Eyes',
        explanation:
          'A famous model who worships Kira for killing her parents’ murderer. She obtains a second Death Note and trades half her remaining lifespan for the "Shinigami Eyes"—the deadly ability to see any person’s real name just by looking at their face.'
      },
      {
        name: 'Near & Mello',
        role: 'L’s Chosen Successors',
        explanation:
          'Two young geniuses raised at Wammy’s House (an orphanage for prodigies founded by L’s handler Watari) who step forward in the second half of the saga to finish L’s war against Kira.'
      }
    ],
    // Status changes keyed by primer name. Only entries on/before the user's checkpoint are shown;
    // the first later change is the blurred "future fate" behind the spoiler shield.
    fateTimelines: {
      'Light Yagami ("Kira")': [
        { season: 1, episode: 1, status: 'alive', note: 'Finds the Death Note and begins executing criminals worldwide as "Kira".' },
        { season: 1, episode: 26, status: 'alive', note: 'Operates as both Kira and the new "L" at the head of the Task Force.' },
        { season: 1, episode: 37, status: 'dead', note: 'Exposed at the Yellow Box Warehouse; Ryuk writes his name in his own Death Note.' }
      ],
      'L (L Lawliet)': [
        { season: 1, episode: 1, status: 'alive', note: 'The faceless detective Interpol turns to once the Kira killings begin.' },
        { season: 1, episode: 2, status: 'alive', note: 'Pins Kira to the Kanto region with the Lind L. Tailor broadcast trap.' },
        { season: 1, episode: 25, status: 'dead', note: 'Dies of a heart attack after Rem writes his true name to protect Misa.' }
      ],
      Ryuk: [
        { season: 1, episode: 1, status: 'alive', note: 'Drops his spare Death Note into the human world purely out of boredom.' }
      ],
      'Soichiro Yagami': [
        { season: 1, episode: 1, status: 'alive', note: 'Leads the police investigation into the Kira killings.' },
        { season: 1, episode: 29, status: 'dead', note: "Dies from wounds suffered in the raid on Mello's hideout." }
      ],
      'Misa Amane ("The Second Kira")': [
        { season: 1, episode: 11, status: 'alive', note: 'Sends the "Second Kira" videotapes to Sakura TV.' },
        { season: 1, episode: 13, status: 'alive', note: 'Tracks Light down and pledges herself to Kira.' }
      ],
      'Near & Mello': [
        { season: 1, episode: 26, status: 'alive', note: "Wammy's House prodigies who step forward to finish L's case." },
        { season: 1, episode: 35, status: 'alive', note: 'Mello dies after kidnapping Kiyomi Takada; Near carries the case alone.' }
      ]
    },
    relationships: [
      { from: 'Light Yagami ("Kira")', to: 'L (L Lawliet)', type: 'enemy', label: 'Rival • Hunter vs. Hunted', since: { season: 1, episode: 2 } },
      { from: 'Light Yagami ("Kira")', to: 'Ryuk', type: 'ally', label: 'Notebook owner & Shinigami', since: { season: 1, episode: 1 } },
      { from: 'Light Yagami ("Kira")', to: 'Soichiro Yagami', type: 'family', label: 'Father & son', since: { season: 1, episode: 1 } },
      { from: 'Light Yagami ("Kira")', to: 'Misa Amane ("The Second Kira")', type: 'ally', label: 'Ally / Pawn', since: { season: 1, episode: 13 } },
      { from: 'L (L Lawliet)', to: 'Soichiro Yagami', type: 'ally', label: 'Kira Task Force', since: { season: 1, episode: 2 } },
      { from: 'Near & Mello', to: 'L (L Lawliet)', type: 'ally', label: "L's chosen successors", since: { season: 1, episode: 26 } },
      { from: 'Near & Mello', to: 'Light Yagami ("Kira")', type: 'enemy', label: 'Closing in on Kira', since: { season: 1, episode: 26 } }
    ],
    deepEpisodeExpansions: {
      1: 'In Episode 1 ("Rebirth"), brilliant high school senior Light Yagami stares out his classroom window and sees a black notebook titled "Death Note" fall from the sky into the school courtyard. Taking it home, he reads the English instructions inside: "The human whose name is written in this note shall die." Assuming it is a prank, he tests it on a hostage-taker shown on live TV (Kurou Otoharada)—and watches in shock as the criminal dies of a heart attack 40 seconds later. Five days later, the Death God Ryuk appears in Light’s bedroom, revealing that Light now owns the notebook and that within those five days, Light has already filled pages with the names of hundreds of hardened criminals, vowing to become the "God of a New World."',
      2: 'In Episode 2 ("Confrontation"), criminals around the globe are dropping dead of mysterious heart attacks, and the internet begins worshipping the unseen killer as "Kira." Interpol calls upon "L," the world’s most legendary detective whose face and real name have never been revealed. To trap Kira, L broadcasts a live television address claiming to be speaking globally, with a man claiming to be "L" taunting Kira to kill him. Enraged, Light writes the man’s name—Lind L. Tailor—into the Death Note. Tailor dies on live TV, but the true L hijacks the screen immediately after: he reveals that Lind L. Tailor was actually a death-row convict used as bait, and that the broadcast was aired ONLY in the Kanto region of Japan! In a single brilliant move, L proves that Kira is real, cannot kill without a name and face, and lives right in Kanto, Japan.',
      3: 'In Episode 3 ("Dealings"), Light realizes L is closing in after discovering that the victims’ times of death match the schedule of a Japanese high school student (between 4 PM and midnight). Using his father Soichiro Yagami’s police computer files, Light intentionally changes the killing schedule so criminals die every single hour on the hour—signaling to L that Kira has access to confidential Japanese police leaks. Meanwhile, Ryuk warns Light that a shadowy figure (FBI agent Raye Penber) has begun physically tailing him, and tells Light about the "Shinigami Eye Deal"—trading half one’s lifespan to see anyone’s true name above their head.'
    },
    bookChapters: [
      {
        chapterNumber: 1,
        roman: 'I',
        title: 'Chapter I: The Notebook from the Sky & L’s Kanto Broadcast Trap',
        episodesCovered: 'S01E01 → S01E07 (The Awakening Arc)',
        arcBadge: '100% Canon • Zero Filler',
        paragraphs: [
          'The story begins in Tokyo with 17-year-old Light Yagami, the highest-scoring student in all of Japan and the son of Police Chief Soichiro Yagami. Disillusioned by a world rotting with unpunished crime, Light sees a black notebook labeled "Death Note" fall from the sky onto his school grounds. It was dropped intentionally by Ryuk, a bored Shinigami (God of Death) who wanted entertainment. The notebook’s rule is chillingly simple: write any person’s full name while picturing their face, and they will die of a heart attack in 40 seconds unless you write a more specific cause of death.',
          'After testing the notebook on two criminals and realizing its power is real, Light overcomes his initial horror and decides that he alone is intelligent and righteous enough to cleanse humanity. Within days, he executes hundreds of fugitives across the globe. The public notices criminals dropping dead simultaneously and names their unseen savior "Kira." When Ryuk finally reveals himself in Light’s bedroom, he tells Light that using the Death Note carries neither heaven nor hell—only the weight of playing God.',
          'Alarmed by the mass killings, Interpol hires "L"—a mysterious, genius detective who has solved every major case in history without ever showing his face or revealing his true name. L immediately sets a brilliant televised trap: he puts a death-row inmate named Lind L. Tailor on live TV pretending to be L and insulting Kira. Light falls for the bait and kills Tailor on air, allowing the real L to announce that the broadcast only aired in the Kanto region of Japan. In seconds, L proves Kira is real, lives in Kanto, and requires both a name and a face to kill. When L dispatches 12 undercover FBI agents (including Raye Penber) to tail suspects linked to the Japanese police, Light orchestrates a terrifying subway hijacking trick that forces Penber to unknowingly write the names of all 12 FBI agents on a hidden page of the Death Note—wiping out the entire FBI team in Japan.'
        ],
        keyTakeaway:
          'Light claims the Death Note as "Kira," L traps him into revealing he lives in Kanto, Japan, and Light eliminates all 12 FBI agents sent to investigate him.'
      },
      {
        chapterNumber: 2,
        roman: 'II',
        title: 'Chapter II: Face-to-Face With L & The Arrival of the Second Kira',
        episodesCovered: 'S01E08 → S01E15 (The Cat-and-Mouse Escalation)',
        arcBadge: '100% Canon • Zero Filler',
        paragraphs: [
          'After Raye Penber’s fiancée, former FBI agent Naomi Misora, deduces that Kira can kill by means other than heart attacks, Light intercepts her outside police headquarters, tricks her into revealing her real name on her driver’s license, and writes that she walks away to end her own life—narrowly preventing her from reaching L. Suspicious of the Yagami household, L secretly installs 64 hidden wiretaps and miniature cameras inside Light’s bedroom. Displaying superhuman composure, Light hides a mini LCD television inside a bag of potato chips, continuing to watch news broadcasts and write criminals’ names with one hand while appearing to study calmly on camera.',
          'Unable to catch Light on tape, L makes the boldest move of his life: he enrolls at Toho University right alongside Light and sits next to him at the entrance ceremony, casually whispering, "I am L." To protect himself, L introduces himself under the alias of a famous Japanese pop idol (Hideki Ryuga)—meaning if Light tries to write that name in the Death Note, Light might accidentally picture the pop star’s face and expose himself! L invites Light onto the official Kira Task Force so they can "work together" while testing every word Light says.',
          'Just as L corners Light psychologically, a wild card shatters the stalemate: a "Second Kira" broadcasts videotapes to Sakura TV, killing news anchors instantly just by looking at their faces on screen without knowing their names! This Second Kira is Misa Amane, a famous model whose parents’ killer was executed by Light. Misa possesses a second Death Note given to her by a devoted female Shinigami named Rem, and Misa has made the "Shinigami Eye Deal"—halving her lifespan so she can see anyone’s real name floating above their head. Misa tracks down Light in Shibuya and pledges absolute obedience to him, giving Light the ultimate weapon required to learn L’s true name.'
        ],
        keyTakeaway:
          'L reveals his face to Light at university, and pop star Misa Amane ("The Second Kira") joins Light with the Shinigami Eyes capable of seeing L’s real name.'
      },
      {
        chapterNumber: 3,
        roman: 'III',
        title: 'Chapter III: The Memory-Wipe Masterplan & The Death of L',
        episodesCovered: 'S01E16 → S01E25 (The Yotsuba & Rem Gambit)',
        arcBadge: '100% Canon • Zero Filler',
        paragraphs: [
          'Before Misa can tell Light what L’s real name is after seeing L at the university campus, L arrests Misa on suspicion of being the Second Kira after finding physical evidence on her tapes. Realizing Misa will break under torture and L is moments away from proving Light is Kira, Light executes the most complex masterplan in anime history: he voluntarily demands to be locked in solitary confinement and secretly relinquishes ownership of both Death Notes. By rule of the notebook, giving up ownership erases ALL of Light’s and Misa’s memories of ever being Kira!',
          'With his memories completely gone, Light genuinely believes he is innocent and works shoulder-to-shoulder with L—even chained to L’s wrist by a pair of handcuffs—to hunt the new "Third Kira," a corrupt businessman named Kyosuke Higuchi at the Yotsuba Corporation whom Ryuk and Rem were instructed to give the notebook to. Together, the innocent Light and L trap Higuchi in a dramatic police helicopter chase.',
          'The moment Higuchi is captured and Light touches the recovered Death Note inside the police helicopter, EVERY memory of being Kira floods back into Light’s brain! Wearing a watch with a hidden scrap of the Death Note’s paper inside, Light kills Higuchi right in front of L, reclaiming permanent ownership of the notebook. When Light then manipulates Misa to start killing again, the Shinigami Rem realizes L is about to sentence Misa to death. Because a Shinigami who uses their Death Note to save a human they love will turn to dust and die, Rem sacrifices herself by writing L’s true name (L Lawliet) and his handler Watari’s name into her Death Note. As L collapses from a heart attack, Light catches him in his arms and flashes a chilling, victorious smirk—giving L final proof in his dying second that Light Yagami was Kira all along.'
        ],
        keyTakeaway:
          'Light erases and regains his own memories to clear his name, then manipulates the Shinigami Rem into killing L Lawliet—leaving Light as BOTH Kira and the new "L".'
      },
      {
        chapterNumber: 4,
        roman: 'IV',
        title: 'Chapter IV: Five Years Later — Near, Mello & The SPK War',
        episodesCovered: 'S01E26 → S01E34 (The Successors Arc)',
        arcBadge: '100% Canon • Zero Filler',
        paragraphs: [
          'With L dead, 23-year-old Light Yagami assumes the dual mantle of both "Kira" and the official police detective "L," ruling the world virtually unchallenged for five years as global crime drops by 70% and nations bow to Kira. However, an automated dead-man’s switch on Watari’s computer alerts Wammy’s House in England that L has fallen. Two brilliant young heirs step onto the world stage: Near (N), a calm, white-haired prodigy who leads the American-backed Special Provision for Kira (SPK), and Mello (M), a ruthless, volatile genius who joins the Mafia to beat Near to Kira’s head.',
          'Mello kidnaps the Japanese Police Director and then Light’s younger sister Sayu, forcing Chief Soichiro Yagami to hand over the Task Force’s Death Note in exchange for Sayu’s life. In a desperate raid to recover the notebook from Mello’s compound, Soichiro Yagami makes the Shinigami Eye Deal himself—and dies in the hospital believing Light is innocent because he can still see Light’s human lifespan above his head (since Light had temporarily given his own notebook to Misa).',
          'Realizing Near is rapidly deducing that the new "L" on the Japanese Task Force is actually Kira, Light recruits a fanatical prosecutor named Teru Mikami ("X-Kira") and Light’s college ex-girlfriend, TV anchor Kiyomi Takada, to carry out killings on his behalf while Light remains under 24/7 surveillance by his increasingly suspicious Task Force colleagues (Matsuda, Aizawa, and Ide).'
        ],
        keyTakeaway:
          'L’s successors Near and Mello corner Light from the outside while Chief Soichiro Yagami dies in battle, forcing Light to entrust the real Death Note to prosecutor Teru Mikami.'
      },
      {
        chapterNumber: 5,
        roman: 'V',
        title: 'Chapter V: The Yellow Box Warehouse Finale & The End of Kira',
        episodesCovered: 'S01E35 → S01E37 (Series Finale & True Ending)',
        arcBadge: '100% Canon • Finale Explained',
        paragraphs: [
          'Everything culminates at the abandoned Yellow Box Warehouse, where Near and the SPK agree to meet Light and the Japanese Task Force face-to-face. Near knows that Light’s follower Teru Mikami will peer through the warehouse doorway and write the real names of everyone inside using his Shinigami Eyes—except for Light Yagami, which will prove Light is Kira! However, Light believes he is one step ahead: knowing Near had his agent Gevanni tamper with Mikami’s notebook, Light claims Mikami had been carrying a fake notebook all along and only brought the real hidden Death Note to the warehouse today.',
          'As Mikami writes everyone’s names and counts down the 40 seconds, Light laughs triumphantly and declares before everyone, "Well, Near, it looks like I win!"—practically confessing aloud. Forty seconds pass... and nobody dies. Near calmly reveals the fatal mistake that doomed Kira: earlier, when Mello kidnapped Kiyomi Takada, BOTH Light and Mikami panicked. Unaware that Light already had a scrap of the Death Note to kill Takada, Mikami broke his strict daily routine and went to his secret bank vault a second time to write Takada’s name in the REAL hidden Death Note—leading Near’s agent straight to the real notebook inside the bank vault so Near could swap the entire real notebook with a counterfeit replica!',
          'Exposed with his own name as the only one Mikami did NOT write in the counterfeit notebook, Light snaps into madness, trying to write Near’s name in his watch scrap with his own blood before rookie detective Matsuda shoots him repeatedly. Bleeding out and humiliated, Light flees the warehouse as Mikami takes his own life in shock. True to his word from Episode 1—"When the time comes, I will be the one to write your name in my Death Note"—the Shinigami Ryuk decides the game is over and writes "Light Yagami" into his own notebook. Light dies of a heart attack on a sunlit staircase as a fleeting vision of L stands over him, bringing the reign of Kira to an end.'
        ],
        keyTakeaway:
          'Mello’s final sacrifice exposes Teru Mikami’s hidden bank vault to Near; when the swapped notebook fails at the Yellow Box Warehouse, Light is exposed and Ryuk writes Light Yagami’s name in his own Death Note.'
      }
    ],
    endingExplained:
      'At the Yellow Box Warehouse finale (Episode 37), Near defeats Light because Mello’s kidnapping of Kiyomi Takada caused Light’s follower Teru Mikami to break rank and visit his bank vault early—allowing Near’s agent to replace the real hidden Death Note with a replica. When Mikami writes everyone’s names except Light’s, nobody dies, proving beyond doubt that Light is Kira. After being shot by Matsuda and fleeing in agony, Light Yagami’s name is written by the Shinigami Ryuk in his own Death Note, fulfilling Ryuk’s promise from Episode 1.'
  }
};

const WIKI_HEADERS = {
  'User-Agent': 'WhereWasI/1.0 (https://wherewasi.vercel.app; contact: 159417361+pranaypoojari@users.noreply.github.com)'
};

const safeJsonFetch = (url) => fetchJson(url, { headers: WIKI_HEADERS, retries: 1 });

/**
 * Fetch full Wikipedia article plain text & extract Plot / Synopsis / Overview sections
 */
async function fetchWikipediaPlotAndInfo(title, type) {
  const result = {
    pageTitle: title,
    intro: '',
    plotParagraphs: [],
    characterParagraphs: [],
    episodeMap: {}, // key: overallEpisodeNumber or "S1E1" -> detailed episode paragraph
    castLines: [],
    imageUrl: ''
  };

  try {
    const searchQueries =
      type === 'movie'
        ? [`${title} (film)`, `${title} film`, title]
        : type === 'anime'
        ? [title, `${title} (anime)`, `${title} (TV series)`]
        : [title, `${title} (TV series)`];

    let bestPageTitle = null;

    for (const q of searchQueries) {
      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&srlimit=3&format=json`;
      const sData = await safeJsonFetch(searchUrl);
      if (!sData) continue;
      const hits = sData?.query?.search || [];
      const lowerTarget = title.toLowerCase();

      const exactOrPrefix = hits.find((h) => {
        const ht = h.title.toLowerCase();
        return (
          ht === lowerTarget ||
          ht.startsWith(`${lowerTarget} (`) ||
          ht.includes(lowerTarget)
        );
      });

      if (exactOrPrefix) {
        bestPageTitle = exactOrPrefix.title;
        break;
      } else if (hits.length > 0 && !bestPageTitle) {
        bestPageTitle = hits[0].title;
      }
    }

    if (!bestPageTitle) {
      bestPageTitle = title;
    }
    result.pageTitle = bestPageTitle;

    // Fetch main article + "List of <title> episodes" in parallel
    const cleanBaseTitle = bestPageTitle.replace(/\s*\([^)]*\)\s*$/, '');
    const epListTitle = `List of ${cleanBaseTitle} episodes`;

    const [eData, epData, summaryData] = await Promise.all([
      safeJsonFetch(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(
          bestPageTitle
        )}&redirects=1&format=json`
      ),
      type !== 'movie'
        ? safeJsonFetch(
            `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&titles=${encodeURIComponent(
              epListTitle
            )}&redirects=1&format=json`
          )
        : Promise.resolve(null),
      // REST summary: lead image (used as the movie poster, since TVMaze has no films) + short extract
      safeJsonFetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
          bestPageTitle.replace(/ /g, '_')
        )}`
      )
    ]);

    result.imageUrl = summaryData?.originalimage?.source || summaryData?.thumbnail?.source || '';

    if (eData) {
      const pages = eData?.query?.pages || {};
      const pageObj = Object.values(pages)[0];
      const fullText = pageObj?.extract || '';

      if (fullText) {
        const sections = fullText.split(/\n==\s*([^=]+?)\s*==\n/);
        const leadParagraphs = (sections[0] || '')
          .split('\n')
          .map((p) => p.trim())
          .filter((p) => p.length > 50);

        result.intro = leadParagraphs.slice(0, 3).join('\n\n');

        for (let i = 1; i < sections.length; i += 2) {
          const secHeading = (sections[i] || '').toLowerCase().trim();
          const secBody = sections[i + 1] || '';

          if (
            secHeading.includes('plot') ||
            secHeading.includes('synopsis') ||
            secHeading.includes('story') ||
            secHeading.includes('premise') ||
            secHeading.includes('overview')
          ) {
            const paras = secBody
              .split('\n')
              .map((p) => p.trim())
              .filter(
                (p) =>
                  p.length > 60 &&
                  !p.startsWith('===') &&
                  !p.startsWith('Main article:') &&
                  !p.startsWith('See also:')
              );
            if (paras.length > 0) {
              result.plotParagraphs.push(...paras);
            }
          }

          if (secHeading.includes('character') || secHeading.includes('cast')) {
            const cParas = secBody
              .split('\n')
              .map((p) => p.trim())
              .filter((p) => p.length > 35 && !p.startsWith('Main article:'))
              .slice(0, 8);
            result.characterParagraphs.push(...cParas);
          }
        }

        if (result.plotParagraphs.length === 0 && leadParagraphs.length > 0) {
          result.plotParagraphs = leadParagraphs;
        }
      }
    }

    // Parse detailed episode descriptions from "List of <Show> episodes" if available
    if (epData) {
      const pages = epData?.query?.pages || {};
      const epPageObj = Object.values(pages)[0];
      const epFullText = epPageObj?.extract || '';
      if (epFullText && epFullText.length > 300) {
        const lines = epFullText
          .split('\n')
          .map((l) => l.trim())
          .filter((l) => l.length > 110 && !l.startsWith('==') && !l.startsWith('Main article:'));
        lines.forEach((line, idx) => {
          result.episodeMap[idx + 1] = line;
        });
      }
    }

    // Fallback: if the action API returned no plot paragraphs, use the REST summary extract
    if (result.plotParagraphs.length === 0 && summaryData?.extract && summaryData.extract.length > 50) {
      result.intro = result.intro || summaryData.extract;
      result.plotParagraphs = [summaryData.extract];
    }
  } catch (err) {
    console.warn('Wikipedia fetch warning:', err.message);
  }

  return result;
}

/**
 * Fetch TVMaze show + all embedded episodes + cast in a single zero-key request
 */
async function fetchTVMazeShowAndEpisodes(title) {
  const url = `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(
    title
  )}&embed[]=episodes&embed[]=cast`;
  // TVMaze allows ~20 calls / 10s per IP and answers 429 beyond that.
  return fetchJson(url, { headers: { 'User-Agent': 'WhereWasI-StoryEngine/3.0' }, retries: 2 });
}

/**
 * Fetch Jikan / MyAnimeList metadata + top characters.
 * Jikan is limited to 3 req/s and 60 req/min, so both calls retry with backoff on 429.
 */
async function fetchJikanAnimeData(title) {
  const jikanOpts = { retries: 2, backoffMs: 1000, timeoutMs: 9000 };
  const data = await fetchJson(
    `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(title)}&limit=1`,
    jikanOpts
  );
  const anime = data?.data?.[0];
  if (!anime) return null;

  // Space the second call out so it doesn't trip the per-second limit right away.
  await sleep(350);
  const charJson = await fetchJson(`https://api.jikan.moe/v4/anime/${anime.mal_id}/characters`, jikanOpts);
  const chars = (charJson?.data || []).slice(0, 12).map((c) => ({
    name: c.character?.name ? c.character.name.split(', ').reverse().join(' ') : '',
    role: c.role || 'Main Character',
    avatar: c.character?.images?.jpg?.image_url || ''
  }));

  return { ...anime, charactersList: chars };
}

/**
 * Build the Beginner-Friendly "Who's Who & World Primer" for ANY show/movie
 */
function buildCharacterGuideAndWorldPrimer({
  slug,
  officialTitle,
  synopsis,
  wikiData,
  jikanData,
  characterStatuses
}) {
  const curated = DEEP_SHOW_ENCYCLOPEDIA[slug];
  if (curated) {
    return {
      worldPremise: curated.worldPremise,
      characters: curated.characterPrimer
    };
  }

  let worldPremise =
    (wikiData?.plotParagraphs?.length > 0
      ? `${synopsis}\n\n${wikiData.plotParagraphs[0]}`
      : null) ||
    jikanData?.synopsis ||
    wikiData?.intro ||
    synopsis;

  if (!worldPremise || worldPremise.length < 120) {
    worldPremise = `${officialTitle} is an acclaimed narrative renowned for its dramatic stakes, rich character alliances, and high-tension turning points. From the opening premise through the critical confrontations, the characters face life-altering dilemmas that drive the overarching story.`;
  }

  const characters = characterStatuses.slice(0, 6).map((c, idx) => ({
    name: c.name,
    role: c.role || (idx === 0 ? 'Central Protagonist' : 'Key Story Figure'),
    explanation:
      wikiData?.characterParagraphs?.[idx] ||
      `${c.name} (${c.role}) plays a central role in the overarching conflict of ${officialTitle}, driving the critical decisions and alliances across the storyline.`
  }));

  return {
    worldPremise,
    characters
  };
}

/**
 * Build the "📖 Story-Book Mode (Start-to-End • Zero Fillers)" object
 * Combines Curated Deep Lore + Wikipedia Full Plot Paragraphs + Jikan Synopsis + Detailed Canon Episodes
 * so every chapter is multi-paragraph, rich, and crystal-clear to a complete newcomer.
 */
function buildCompleteStoryBook({
  slug,
  title,
  type,
  synopsis,
  characterGuide,
  episodesWithSummaries = [],
  wikiPlotParagraphs = [],
  jikanSynopsis = ''
}) {
  const isMovie = type === 'movie';
  const curated = DEEP_SHOW_ENCYCLOPEDIA[slug];

  const totalEpCount = episodesWithSummaries.length;
  const fillerEpisodes = episodesWithSummaries.filter((ep) => ep.isFiller);
  const canonEpisodes = episodesWithSummaries.filter(
    (ep) => !ep.isFiller && ep.summary && ep.summary.length > 20
  );
  const fillersRemoved = fillerEpisodes.length;

  // Real watch time from per-episode runtimes; movies fall back to a typical feature length.
  const fallbackRuntime = DEFAULT_RUNTIME_MINUTES[type] || 45;
  const watchMinutes = isMovie
    ? fallbackRuntime
    : episodesWithSummaries.reduce((sum, ep) => sum + (Number(ep.runtime) || fallbackRuntime), 0) ||
      12 * fallbackRuntime;

  const finalize = (book) => {
    const chapters = ensureMinChapters(book.chapters, { isMovie });
    const normalized = normalizeStoryBook({ ...book, chapters, readingTimeMinutes: undefined });
    const readingMinutes = minutesForWords(normalized.totalWords);
    return {
      ...book,
      chapters,
      readingTimeMinutes: readingMinutes,
      watchMinutes,
      watchTimeSaved: formatTimeSaved(Math.max(0, watchMinutes - readingMinutes)),
      fillersRemovedCount: fillersRemoved,
      fillerEpisodes: fillerEpisodes.map((ep) => formatEpisodeCode(ep.season, ep.episode))
    };
  };

  // If we have a curated deep novel breakdown (e.g. Death Note), use its rich chapters
  if (curated && curated.bookChapters) {
    return finalize({
      title: `${title} — Complete Start-to-End Story-Book`,
      subtitle: `Read the entire saga from Episode 1 to the Finale like a novel — including full explanations of the rules, Light vs. L, and the true ending`,
      totalCanonEpisodes: canonEpisodes.length || totalEpCount,
      characterGuide,
      chapters: curated.bookChapters,
      endingExplained: curated.endingExplained
    });
  }

  // Otherwise, combine ALL rich paragraphs (Wikipedia Plot + Jikan Synopsis + Canon Episode Blocks)
  const combinedRichPlot = [];
  if (jikanSynopsis && jikanSynopsis.length > 100) {
    combinedRichPlot.push(...jikanSynopsis.split('\n\n').filter((p) => p.trim().length > 60));
  }
  if (wikiPlotParagraphs.length > 0) {
    combinedRichPlot.push(...wikiPlotParagraphs);
  }

  const Chapters = [];
  const chapterRomana = ROMAN;
  const chapterArcTitles = [
    'The World Setup, Core Rules & Inciting Incident',
    'Rising Alliances, Rivals & Escalation',
    'Major Twists, Betrayals & Turning Points',
    'High-Stakes War & The Final Gambit',
    'The Final Climax & True Ending Explained'
  ];

  if (!isMovie && canonEpisodes.length >= 3) {
    const targetChapterCount = Math.min(5, Math.max(3, Math.ceil(canonEpisodes.length / 8)));
    const chunkSize = Math.ceil(canonEpisodes.length / targetChapterCount);

    for (let c = 0; c < targetChapterCount; c++) {
      const slice = canonEpisodes.slice(c * chunkSize, (c + 1) * chunkSize);
      if (slice.length === 0) continue;

      const firstEp = slice[0];
      const lastEp = slice[slice.length - 1];
      const rangeLabel = `S${String(firstEp.season).padStart(2, '0')}E${String(
        firstEp.episode
      ).padStart(2, '0')} → S${String(lastEp.season).padStart(2, '0')}E${String(
        lastEp.episode
      ).padStart(2, '0')}`;

      const paragraphs = [];

      // Inject overarching Wikipedia/Jikan narrative context at the start of the chapter
      if (combinedRichPlot[c]) {
        paragraphs.push(combinedRichPlot[c]);
      } else if (c === 0 && characterGuide?.worldPremise) {
        paragraphs.push(characterGuide.worldPremise);
      }

      // Group episodes in this chapter into smooth, flowing multi-sentence narrative paragraphs (3-4 episodes per paragraph)
      const groupSize = Math.max(2, Math.ceil(slice.length / 3));
      for (let g = 0; g < slice.length; g += groupSize) {
        const epGroup = slice.slice(g, g + groupSize);
        const narrativeBlock = epGroup
          .map(
            (ep) =>
              `In S${String(ep.season).padStart(2, '0')}E${String(ep.episode).padStart(
                2,
                '0'
              )} ("${ep.title}"), ${ep.summary.charAt(0).toLowerCase() + ep.summary.slice(1)}`
          )
          .join(' Following this, ');
        paragraphs.push(narrativeBlock);
      }

      Chapters.push({
        chapterNumber: c + 1,
        roman: chapterRomana[c] || String(c + 1),
        title: `Chapter ${chapterRomana[c] || c + 1}: ${
          chapterArcTitles[c] || 'The Concluding Arc'
        }`,
        episodesCovered: rangeLabel,
        arcBadge: '100% Canon • Fillers Stripped',
        paragraphs,
        keyTakeaway: `By ${
          lastEp.title
        } (S${String(lastEp.season).padStart(2, '0')}E${String(lastEp.episode).padStart(
          2,
          '0'
        )}): ${lastEp.summary}`
      });
    }
  } else if (combinedRichPlot.length > 0) {
    const numChapters = Math.min(4, Math.max(2, combinedRichPlot.length));
    const perChapter = Math.ceil(combinedRichPlot.length / numChapters);

    for (let c = 0; c < numChapters; c++) {
      const slice = combinedRichPlot.slice(c * perChapter, (c + 1) * perChapter);
      if (slice.length === 0) continue;
      Chapters.push({
        chapterNumber: c + 1,
        roman: chapterRomana[c] || String(c + 1),
        title: `Chapter ${chapterRomana[c] || c + 1}: ${
          chapterArcTitles[c] || `Act ${c + 1}`
        }`,
        episodesCovered: isMovie ? `Act ${c + 1} of ${numChapters}` : `Arc ${c + 1}`,
        arcBadge: 'Essential Plot • Zero Filler',
        paragraphs: slice,
        keyTakeaway: slice[slice.length - 1]
      });
    }
  } else {
    Chapters.push(
      {
        chapterNumber: 1,
        roman: 'I',
        title: 'Chapter I: The Core Premise & World Introduction',
        episodesCovered: isMovie ? 'Opening Act' : 'Introductory Arc',
        arcBadge: '100% Canon',
        paragraphs: [
          characterGuide?.worldPremise || synopsis,
          `From the opening scenes of ${title}, the central characters are introduced against the backdrop of an escalating conflict that shapes the entire journey.`
        ],
        keyTakeaway: `Establishes the core premise and stakes of ${title}.`
      },
      {
        chapterNumber: 2,
        roman: 'II',
        title: 'Chapter II: Major Turning Points & Final Climax',
        episodesCovered: isMovie ? 'Final Act' : 'Climax Arc',
        arcBadge: 'Zero Filler',
        paragraphs: [
          `As the stakes reach their peak, the narrative of ${title} moves decisively through high-pressure confrontations, leading directly to the ultimate resolution and character fates.`
        ],
        keyTakeaway: `Delivers the definitive conclusion and fallout for ${title}.`
      }
    );
  }

  const lastChapter = Chapters[Chapters.length - 1];
  const lastParagraph = lastChapter?.paragraphs?.[lastChapter.paragraphs.length - 1];
  let endingCandidate = combinedRichPlot[combinedRichPlot.length - 1] || lastParagraph || synopsis;
  let endingParagraph = endingCandidate;
  if (!endingParagraph || endingParagraph === lastParagraph) {
    endingParagraph = `In the final resolution of ${title}, the overarching conflicts reach their definitive climax as the surviving characters confront the long-term consequences of their choices, bringing the canon narrative to its conclusion.`;
  }

  return finalize({
    title: `${title} — Complete Start-to-End Story-Book`,
    subtitle: isMovie
      ? `Read the entire film from opening scene to final twist like a detailed novel`
      : fillersRemoved > 0
      ? `Every canon storyline, character explanation, and ending from Episode 1 to the Finale — ${fillersRemoved} filler/recap episode${fillersRemoved === 1 ? '' : 's'} stripped out`
      : `Every canon storyline, character explanation, and ending from Episode 1 to the Finale`,
    totalCanonEpisodes: canonEpisodes.length || totalEpCount || 1,
    characterGuide,
    chapters: Chapters,
    endingExplained: endingParagraph
  });
}

/**
 * Main Public Web Data Engine (TVMaze + Wikipedia + Jikan + Deep Encyclopedia)
 */
async function fetchLivePublicShowEngine(title, type, rawSeason, rawEpisode) {
  const isMovie = type === 'movie';
  const targetSeason = isMovie ? 1 : Math.max(1, Number(rawSeason) || 1);
  const targetEpisode = isMovie
    ? Math.min(3, Math.max(1, Number(rawEpisode) || 1))
    : Math.max(1, Number(rawEpisode) || 1);

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const [tvMazeData, wikiData, jikanData] = await Promise.all([
    !isMovie ? fetchTVMazeShowAndEpisodes(title) : Promise.resolve(null),
    fetchWikipediaPlotAndInfo(title, type),
    type === 'anime' ? fetchJikanAnimeData(title) : Promise.resolve(null)
  ]);

  const officialTitle =
    tvMazeData?.name || jikanData?.title_english || jikanData?.title || title;
  const platform =
    tvMazeData?.webChannel?.name ||
    tvMazeData?.network?.name ||
    (type === 'movie'
      ? 'Theatrical / OTT'
      : type === 'anime'
      ? 'Crunchyroll / Netflix'
      : 'Streaming / OTT');
  const genres =
    tvMazeData?.genres?.length > 0
      ? tvMazeData.genres
      : jikanData?.genres?.length > 0
      ? jikanData.genres.map((g) => g.name)
      : type === 'movie'
      ? ['Feature Film', 'Drama']
      : ['Drama', 'Thriller'];

  const posterUrl =
    tvMazeData?.image?.original ||
    tvMazeData?.image?.medium ||
    jikanData?.images?.jpg?.large_image_url ||
    wikiData.imageUrl ||
    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80';

  const curated = DEEP_SHOW_ENCYCLOPEDIA[slug];

  const synopsis =
    curated?.worldPremise ||
    jikanData?.synopsis ||
    stripHtml(tvMazeData?.summary) ||
    wikiData.intro ||
    `Complete zero-spoiler timeline and full start-to-end story-book for ${officialTitle}.`;

  // Extract Real Cast & Characters first so we can include them in the Newcomer Character Primer.
  // `characters` is the raw form (with statusTimeline where curated) that gets persisted;
  // `characterStatuses` is the spoiler-safe view computed for the requested checkpoint.
  const rawCast = tvMazeData?._embedded?.cast || [];
  const checkpointCode = formatEpisodeCode(targetSeason, targetEpisode);
  let characters = [];

  if (curated?.characterPrimer) {
    const avatarCandidates = [
      ...(jikanData?.charactersList || []),
      ...rawCast.map((c) => ({ name: c.character?.name, avatar: c.character?.image?.medium || '' }))
    ];
    characters = curated.characterPrimer.map((cp, idx) => ({
      id: `char-curated-${idx}`,
      name: cp.name,
      role: cp.role,
      primer: cp.explanation,
      status: 'alive',
      note: cp.explanation,
      statusTimeline: curated.fateTimelines?.[cp.name] || [],
      avatar: matchAvatarByName(cp.name, avatarCandidates)
    }));
  } else if (rawCast.length > 0) {
    const seenNames = new Set();
    for (const c of rawCast) {
      const charName = c.character?.name || c.person?.name;
      if (!charName || seenNames.has(charName)) continue;
      seenNames.add(charName);
      characters.push({
        id: `char-${seenNames.size}`,
        name: charName,
        role: c.person?.name ? `Portrayed by ${c.person.name}` : 'Main Cast',
        status: 'alive',
        note:
          wikiData.characterParagraphs[seenNames.size - 1] ||
          `Key character active in the storyline through ${checkpointCode}`,
        avatar: c.character?.image?.medium || c.person?.image?.medium || ''
      });
      if (characters.length >= 8) break;
    }
  } else if (jikanData?.charactersList?.length > 0) {
    characters = jikanData.charactersList.slice(0, 8).map((c, idx) => ({
      id: `char-jikan-${idx}`,
      name: c.name,
      role: c.role,
      status: 'alive',
      note:
        wikiData.characterParagraphs[idx] || `Central character in ${officialTitle} through ${checkpointCode}`,
      avatar: c.avatar || ''
    }));
  }

  if (characters.length === 0) {
    characters = [
      {
        id: 'char-1',
        name: `${officialTitle} Lead`,
        role: 'Central Protagonist',
        status: 'alive',
        note: `Driving the core story arc through ${checkpointCode}`,
        avatar: ''
      },
      {
        id: 'char-2',
        name: 'Primary Rival / Antagonist',
        role: 'Opposing Force',
        status: 'alive',
        note: `Challenging the protagonist through ${checkpointCode}`,
        avatar: ''
      }
    ];
  }

  const characterStatuses = computeCharacterStatuses(characters, targetSeason, targetEpisode);

  // Build Beginner-Friendly Character & World Primer
  const characterGuide = buildCharacterGuideAndWorldPrimer({
    slug,
    officialTitle,
    synopsis,
    wikiData,
    jikanData,
    characterStatuses
  });

  // Process all episodes from TVMaze + Wikipedia Episode List + Curated Deep Expansions
  const rawEpisodes = tvMazeData?._embedded?.episodes || [];
  const cleanEpisodes = rawEpisodes.map((ep, idx) => {
    const epNum = Number(ep.number) || idx + 1;
    const sNum = Number(ep.season) || 1;
    const baseSummary = stripHtml(ep.summary) || '';
    const wikiEpSummary = wikiData.episodeMap[idx + 1] || '';
    const curatedDeepSummary =
      sNum === 1 && curated?.deepEpisodeExpansions?.[epNum]
        ? curated.deepEpisodeExpansions[epNum]
        : '';

    // Combine curated/Wikipedia deep paragraph with TVMaze summary so it's NEVER a 1-line blurb
    let richSummary = curatedDeepSummary;
    if (!richSummary) {
      if (wikiEpSummary && wikiEpSummary.length > baseSummary.length) {
        richSummary = baseSummary ? `${baseSummary} ${wikiEpSummary}` : wikiEpSummary;
      } else {
        richSummary = baseSummary;
      }
    }

    const epTitle = ep.name || `Episode ${epNum}`;
    return {
      season: sNum,
      episode: epNum,
      overallNumber: idx + 1,
      title: epTitle,
      runtime: Number(ep.runtime) || DEFAULT_RUNTIME_MINUTES[type] || 45,
      summary: richSummary,
      isFiller: isFillerEpisode(epTitle, baseSummary, ep.type)
    };
  });

  // Guarantee a substantial (>150 word) World Premise from spoiler-safe sources only
  characterGuide.worldPremise = ensureWorldPremise(characterGuide.worldPremise, {
    officialTitle,
    type,
    platform,
    genres,
    totalSeasons: cleanEpisodes.length > 0 ? Math.max(...cleanEpisodes.map((e) => e.season)) : 1,
    totalEpisodes: cleanEpisodes.length || 1,
    wikiIntro: wikiData.intro,
    jikanBackground: jikanData?.background || '',
    synopsis
  });

  let targetEpObj = cleanEpisodes.find(
    (e) => e.season === Number(targetSeason) && e.episode === Number(targetEpisode)
  );
  if (!targetEpObj && cleanEpisodes.length > 0) {
    targetEpObj =
      cleanEpisodes.find((e) => e.overallNumber === Number(targetEpisode)) ||
      cleanEpisodes[Math.min(cleanEpisodes.length - 1, Math.max(0, Number(targetEpisode) - 1))];
  }

  let episodesUpToTarget = cleanEpisodes.filter(
    (e) =>
      e.season < Number(targetSeason) ||
      (e.season === Number(targetSeason) && e.episode <= Number(targetEpisode))
  );
  if (episodesUpToTarget.length === 0 && targetEpObj) {
    episodesUpToTarget = cleanEpisodes.filter(
      (e) => e.overallNumber <= targetEpObj.overallNumber
    );
  }

  // 1. Construct Detailed Multi-Paragraph Episode Gist (Never a 1-sentence answer!)
  let episodeGist = '';
  let episodeTitle =
    targetEpObj?.title || `Season ${targetSeason}, Episode ${targetEpisode}`;

  if (type === 'movie') {
    const plotParas = wikiData.plotParagraphs;
    if (plotParas.length > 0) {
      if (Number(targetEpisode) === 1) {
        episodeTitle = 'Act I & II • Opening & Midpoint';
        episodeGist = `${characterGuide.worldPremise}\n\n${plotParas
          .slice(0, Math.ceil(plotParas.length / 2))
          .join('\n\n')}`;
      } else if (Number(targetEpisode) === 2) {
        episodeTitle = 'Act III • Pre-Climax Setup';
        const mid = Math.max(1, Math.floor(plotParas.length * 0.65));
        episodeGist = `${characterGuide.worldPremise}\n\n${plotParas
          .slice(0, mid)
          .join('\n\n')}`;
      } else {
        episodeTitle = 'Complete Film Plot & Ending';
        episodeGist = `${characterGuide.worldPremise}\n\n${plotParas.join('\n\n')}`;
      }
    } else {
      episodeGist = characterGuide.worldPremise;
    }
  } else if (targetEpObj && targetEpObj.summary) {
    // Provide BOTH the World/Character Context AND the detailed plot of this specific episode
    const prevEp =
      cleanEpisodes.find((e) => e.overallNumber === targetEpObj.overallNumber - 1) || null;
    const prevContext = prevEp
      ? `Entering Season ${targetEpObj.season}, Episode ${targetEpObj.episode} ("${targetEpObj.title}"), the story picks up directly after "${prevEp.title}" (${prevEp.summary}).`
      : `Season ${targetEpObj.season}, Episode ${targetEpObj.episode} ("${targetEpObj.title}") launches the core conflict of ${officialTitle}. ${characterGuide.worldPremise}`;

    episodeGist = `${prevContext}\n\nWhat Happens in S${String(targetEpObj.season).padStart(
      2,
      '0'
    )}E${String(targetEpObj.episode).padStart(2, '0')} ("${targetEpObj.title}"):\n${
      targetEpObj.summary
    }`;

    // Thin synopsis? Add the season's earlier beats (all before the checkpoint, so spoiler-safe).
    if (countWords(targetEpObj.summary) < 80) {
      const earlier = cleanEpisodes
        .filter(
          (e) =>
            e.season === targetEpObj.season &&
            e.overallNumber < targetEpObj.overallNumber - 1 &&
            !e.isFiller &&
            e.summary
        )
        .slice(-3);
      if (earlier.length > 0) {
        episodeGist += `\n\nEarlier this season: ${earlier
          .map((e) => `in "${e.title}", ${(splitSentences(e.summary)[0] || e.summary).replace(/^./, (c) => c.toLowerCase())}`)
          .join(' Then, ')}`;
      }
    }
  } else {
    episodeGist = `${characterGuide.worldPremise}\n\nIn Season ${targetSeason}, Episode ${targetEpisode} of ${officialTitle}, the central conflict escalates as the key characters confront the direct fallout of earlier turning points.`;
  }

  // Minimum content guarantee: the gist is never a single paragraph.
  episodeGist = ensureMinParagraphs(episodeGist, [characterGuide.worldPremise, wikiData.intro, synopsis]);

  // 2. Construct Deep Cumulative Story Recap (S01E01 -> S{targetSeason}E{targetEpisode})
  let storyRecap = '';
  const keyMoments = [];

  if (type === 'movie') {
    storyRecap = episodeGist;
    wikiData.plotParagraphs.slice(0, 4).forEach((p, idx) => {
      keyMoments.push(`Act ${idx + 1}: ${p.split('.')[0]}.`);
    });
  } else if (episodesUpToTarget.length > 0) {
    const withSummaries = episodesUpToTarget.filter(
      (e) => e.summary && e.summary.length > 15
    );

    const sampled =
      withSummaries.length <= 6
        ? withSummaries
        : withSummaries.filter(
            (_, idx) =>
              idx === 0 ||
              idx === 1 ||
              idx === withSummaries.length - 1 ||
              idx % Math.ceil(withSummaries.length / 4) === 0
          );

    const episodeBreakdownText = sampled
      .map(
        (e) =>
          `• Episode ${e.episode} — "${e.title}" (S${String(e.season).padStart(
            2,
            '0'
          )}E${String(e.episode).padStart(2, '0')}):\n${e.summary}`
      )
      .join('\n\n');

    storyRecap =
      `THE CORE PREMISE & WORLD SETUP:\n${characterGuide.worldPremise}\n\n` +
      `EPISODE-BY-EPISODE CATCH-UP (S01E01 → S${String(targetSeason).padStart(
        2,
        '0'
      )}E${String(targetEpisode).padStart(2, '0')}):\n` +
      episodeBreakdownText;

    sampled.slice(-4).forEach((e) => {
      keyMoments.push(
        `S${String(e.season).padStart(2, '0')}E${String(e.episode).padStart(2, '0')} • "${
          e.title
        }": ${e.summary.split('.')[0]}.`
      );
    });
  } else {
    storyRecap = `THE CORE PREMISE & WORLD SETUP:\n${characterGuide.worldPremise}`;
  }

  // 3. Build Complete Start-to-End Story-Book (No Fillers Mode)
  const storyBook = buildCompleteStoryBook({
    slug,
    title: officialTitle,
    type,
    synopsis,
    characterGuide,
    episodesWithSummaries: cleanEpisodes,
    wikiPlotParagraphs: wikiData.plotParagraphs,
    jikanSynopsis: jikanData?.synopsis || ''
  });

  // 4. Relationships
  // Curated shows carry real, episode-gated relationships. For everything else we only know who
  // shares the main storyline, so links stay neutral rather than inventing rivalries.
  const allRelationships = curated?.relationships
    ? curated.relationships
    : characterStatuses.slice(1, 4).map((c) => ({
        from: characterStatuses[0].name,
        to: c.name,
        type: 'ally',
        label: 'Shares the main storyline'
      }));
  const relationships = filterRelationshipsByEpisode(allRelationships, targetSeason, targetEpisode);

  const totalSeasonsCount =
    cleanEpisodes.length > 0
      ? Math.max(...cleanEpisodes.map((e) => e.season), Number(targetSeason))
      : Math.max(Number(targetSeason), 1);

  const showObj = {
    slug,
    title: officialTitle,
    platform,
    type,
    genre: genres,
    posterUrl,
    bannerUrl: posterUrl,
    synopsis,
    totalSeasons: totalSeasonsCount,
    totalEpisodes: cleanEpisodes.length || Math.max(Number(targetEpisode), 12),
    language: tvMazeData?.language || 'English / Multilingual',
    tags: ['Complete Story-Book', 'Zero-Spoiler', 'Character Guide Included'],
    isPublished: true,
    storyBook,
    episodes:
      cleanEpisodes.length > 0
        ? cleanEpisodes
        : Array.from({ length: Math.max(Number(targetEpisode), 10) }, (_, i) => ({
            season: Number(targetSeason),
            episode: i + 1,
            title: `Episode ${i + 1}`,
            runtime: 45,
            summary: ''
          }))
  };

  const recapObj = {
    season: Number(targetSeason),
    episode: Number(targetEpisode),
    episodeTitle,
    episodeGist,
    storyRecap,
    characterGuide,
    storyBook,
    isRealWebData: true,
    deepVersion: 2,
    keyMoments,
    quotes: [
      {
        text: episodeGist.split('.')[0] + '.',
        by: characterStatuses[0]?.name || officialTitle,
        episode: `S${String(targetSeason).padStart(2, '0')}E${String(targetEpisode).padStart(
          2,
          '0'
        )}`
      }
    ],
    relationships: allRelationships
  };

  return {
    show: showObj,
    recap: recapObj,
    characters,
    characterStatuses,
    relationships
  };
}

export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 });
    }
    const { title, season = 1, episode = 1 } = body || {};
    const type = ALLOWED_TYPES.has(body?.type) ? body.type : 'tv';

    if (typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim().slice(0, MAX_TITLE_LENGTH);
    const slug = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const generatedData = await fetchLivePublicShowEngine(
      cleanTitle,
      type,
      Number(season) || 1,
      Number(episode) || 1
    );

    await saveDynamicShow(generatedData.show, generatedData.characters);
    await saveDynamicRecap(slug, generatedData.recap);

    return NextResponse.json({
      success: true,
      slug,
      show: generatedData.show,
      recap: generatedData.recap,
      characters: generatedData.characters,
      characterStatuses: generatedData.characterStatuses,
      relationships: generatedData.relationships
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json(
      { success: false, error: 'Could not build this story guide right now. Please try again.' },
      { status: 500 }
    );
  }
}
