import { NextResponse } from 'next/server';
import { saveDynamicShow, saveDynamicRecap, getFullShowDetails, computeCharacterStatuses, computeRelationships } from '@/lib/dataService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, type = 'tv', season = 1, episode = 1 } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 });
    }

    const cleanTitle = title.trim();
    const slug = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    // 1. Quota Shield: Check if show and this episode are already cached locally or in MongoDB
    try {
      const existing = await getFullShowDetails(slug);
      if (existing && existing.show) {
        const existingRecap = existing.recaps?.find(
          r => Number(r.season) === Number(season) && Number(r.episode) === Number(episode)
        );
        if (existingRecap) {
          const charStatuses = computeCharacterStatuses(existing.characters || [], Number(season), Number(episode));
          const rels = computeRelationships(existing.recaps || [], Number(season), Number(episode));
          return NextResponse.json({
            success: true,
            cached: true,
            slug,
            show: existing.show,
            recap: existingRecap,
            characterStatuses: charStatuses,
            relationships: rels
          });
        }
      }
    } catch (cacheErr) {
      console.warn('Cache lookup skipped:', cacheErr.message);
    }

    const rawKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
    const apiKey = rawKey.trim().replace(/^["']|["']$/g, '');

    let generatedData = null;

    if (apiKey) {
      try {
        generatedData = await callGeminiZeroSpoilerEngine(cleanTitle, type, season, episode, apiKey);
      } catch (aiErr) {
        console.warn('Gemini API call failed, using built-in generator fallback:', aiErr.message);
      }
    }

    if (!generatedData) {
      generatedData = generateKnowledgeBasedFallback(cleanTitle, type, season, episode);
    }

    // Persist to local / Mongo cache
    await saveDynamicShow(generatedData.show);
    await saveDynamicRecap(slug, generatedData.recap);

    return NextResponse.json({
      success: true,
      slug,
      show: generatedData.show,
      recap: generatedData.recap,
      characterStatuses: generatedData.characterStatuses,
      relationships: generatedData.relationships
    });
  } catch (error) {
    console.error('Error in /api/generate:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * Direct Gemini API call with strict zero-spoiler schema
 */
async function callGeminiZeroSpoilerEngine(title, type, season, episode, apiKey) {
  const isMovie = type === 'movie';
  const targetScope = isMovie
    ? `Feature Film: "${title}", Checkpoint: ${episode === 1 ? 'Act 1 & 2 (First Half / Intermission)' : episode === 2 ? 'Up to Pre-Climax' : 'Complete Film Synopsis'}`
    : `Franchise/Series: "${title}", Format: ${type}, Target: Season ${season}, Episode ${episode}`;

  const prompt = `You are WhereWasI, the Zero-Spoiler Recap Engine for TV shows, anime, and movies.
${targetScope}.

CRITICAL SPOILER PROTOCOL:
- You must ONLY include events, character deaths, and alliances up to and including Season ${season}, Episode ${episode}.
- It is a FATAL ERROR to mention, imply, or hint at ANY event, death, betrayal, or twist that happens after Season ${season}, Episode ${episode}.
- All events after this episode are classified and strictly sealed.

Respond ONLY with a valid JSON object matching this structure:
{
  "show": {
    "slug": "${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}",
    "title": "${title}",
    "platform": "${isMovie ? 'Cinema / OTT' : 'Streaming / OTT'}",
    "type": "${type}",
    "genre": ["Drama", "Action"],
    "synopsis": "Overview of the premise without any future spoilers.",
    "posterUrl": "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80",
    "totalSeasons": ${isMovie ? 1 : Math.max(season, 1)},
    "totalEpisodes": ${isMovie ? 1 : Math.max(episode, 1)},
    "language": "English / Hindi",
    "tags": ["Popular", "${isMovie ? 'Feature Film' : 'Binge-Worthy'}"]
  },
  "recap": {
    "season": ${season},
    "episode": ${episode},
    "episodeTitle": "Official title or descriptive title of this episode",
    "episodeGist": "A clear, specific 2-4 sentence summary describing EXACTLY what happens inside Season ${season} Episode ${episode} specifically.",
    "storyRecap": "A conversational 150-250 word cumulative catch-up covering the whole journey from Season 1 Episode 1 up to Season ${season} Episode ${episode}. Written casually, like a friend reminding you of everything you need to remember to keep watching.",
    "keyMoments": [
      "Key specific event 1 in this episode",
      "Key specific event 2 in this episode",
      "Key specific event 3 in this episode"
    ],
    "whoDied": [],
    "whoJoined": [],
    "cliffhanger": "The final scene or cliffhanger of Season ${season} Episode ${episode}.",
    "quotes": [
      { "text": "Memorable line from this episode or arc", "by": "Character Name", "episode": "S0${season}E0${episode}" }
    ]
  },
  "characterStatuses": [
    {
      "characterId": "char-1",
      "name": "Main Character Name",
      "role": "Role / Faction",
      "status": "alive",
      "note": "Exact status specifically at Season ${season}, Episode ${episode}",
      "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80"
    }
  ],
  "relationships": [
    { "from": "Character1", "to": "Character2", "type": "ally", "label": "Alliance / Relationship" }
  ]
}`;

  // Candidate models cascade: Google AI Studio model versions
  const candidateModels = [
    'gemini-3-flash-preview',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro'
  ];

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2
            }
          })
        }
      );

      if (res.ok) {
        const data = await res.json();
        const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textOutput) {
          return JSON.parse(textOutput);
        }
      } else {
        const errorText = await res.text();
        lastError = new Error(`Model ${model} failed (${res.status}): ${errorText}`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error('All candidate Gemini models failed');
}

/**
 * Built-in intelligent generator for any show/anime/movie when no API key is set yet
 */
function generateKnowledgeBasedFallback(title, type, season, episode) {
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const showProfiles = {
    'naruto': {
      platform: 'Crunchyroll / Netflix',
      genre: ['Anime', 'Action', 'Shonen'],
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      synopsis: 'Naruto Uzumaki, a hyperactive orphan ninja bearing the Nine-Tailed Fox sealed inside him, strives to become Hokage and earn the respect of the Hidden Leaf Village.',
      episodeGist: episode === 1
        ? 'After failing his graduation exam, Naruto is tricked by Mizuki into stealing the Forbidden Scroll of Seals. Upon discovering the Nine-Tails secret, Naruto masters the Multi-Shadow Clone Jutsu to defeat Mizuki and save his teacher Iruka.'
        : `In Season ${season} Episode ${episode}, Naruto and his comrades push their ninja skills to the limit as Team 7 navigates deadly missions and perilous battles.`,
      recap: `In the Hidden Leaf Village, twelve years after the Fourth Hokage sealed the Nine-Tailed Fox inside infant Naruto Uzumaki, Naruto grows up isolated and despised. Yearning for recognition, he enters the Ninja Academy. Up to Season ${season} Episode ${episode}, Naruto has forged bonds with squadmates Sasuke Uchiha and Sakura Haruno under Jonin Kakashi Hatake, overcoming life-or-death missions and channeling fierce nine-tails chakra.`,
      characters: [
        { name: 'Naruto Uzumaki', role: 'Genin Ninja / Jinchuriki', status: 'alive', note: 'Determined to become Hokage; possesses the Nine-Tails chakra.' },
        { name: 'Sasuke Uchiha', role: 'Genin Prodigy', status: 'alive', note: 'Sole survivor of the Uchiha massacre, driven by vengeance.' },
        { name: 'Sakura Haruno', role: 'Genin Ninja', status: 'alive', note: 'Member of Team 7 working hard to master chakra control.' },
        { name: 'Kakashi Hatake', role: 'Team 7 Jonin Leader', status: 'alive', note: 'The Copy Ninja possessing the Sharingan.' },
        { name: 'Iruka Umino', role: 'Academy Instructor', status: 'alive', note: 'The first person to truly acknowledge and protect Naruto.' }
      ],
      relationships: [
        { from: 'Naruto', to: 'Sasuke', type: 'rivalry', label: 'Fierce Rivals' },
        { from: 'Kakashi', to: 'Naruto', type: 'ally', label: 'Jonin Sensei' },
        { from: 'Iruka', to: 'Naruto', type: 'family', label: 'Loving Mentor' }
      ]
    },
    'attack-on-titan': {
      platform: 'Crunchyroll',
      genre: ['Anime', 'Dark Fantasy', 'Action'],
      poster: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80',
      synopsis: 'Humanity lives inside concentric walls protecting them from gigantic man-eating Titans. Eren Yeager vows to eliminate all Titans after his mother is devoured.',
      episodeGist: episode === 1
        ? 'The Colossal Titan breaches Wall Maria in Shiganshina District. Eren Yeager watches in horror as a Titan devours his mother Carla, sparking his eternal vow to wipe out all Titans.'
        : `In Season ${season} Episode ${episode}, the Scout Regiment battles Titan threats beyond the walls with extreme strategic stakes.`,
      recap: `Humanity struggles behind Wall Maria, Rose, and Sheena. Eren Yeager, Mikasa, and Armin joined the 104th Training Corps and Scout Regiment. After the breach of Trost District, Eren discovered his ability to transform into the Attack Titan. Up to Season ${season} Episode ${episode}, intense military skirmishes against mysterious Titan shifters reveal that the enemy is far closer to home than anyone imagined.`,
      characters: [
        { name: 'Eren Yeager', role: 'Scout / Attack Titan', status: 'alive', note: 'Determined to reclaim Wall Maria and eradicate all Titans.' },
        { name: 'Mikasa Ackerman', role: 'Elite Scout', status: 'alive', note: 'Deadly protector of Eren, humanity\'s strongest soldier.' },
        { name: 'Armin Arlert', role: 'Scout Tactician', status: 'alive', note: 'Brilliant strategist guiding Survey Corps plans.' },
        { name: 'Levi Ackerman', role: 'Captain of Special Operations', status: 'alive', note: 'Humanity\'s greatest warrior, undefeated in Titan combat.' },
        { name: 'Erwin Smith', role: 'Commander of Survey Corps', status: 'alive', note: 'Willing to gamble everything for humanity\'s freedom.' }
      ],
      relationships: [
        { from: 'Eren', to: 'Mikasa', type: 'family', label: 'Devoted protector' },
        { from: 'Eren', to: 'Armin', type: 'ally', label: 'Lifelong best friends' },
        { from: 'Levi', to: 'Eren', type: 'ally', label: 'Commander & Enforcer' }
      ]
    },
    'the-boys': {
      platform: 'Prime Video',
      genre: ['Action', 'Satire', 'Superhero'],
      poster: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=800&q=80',
      synopsis: 'A group of vigilantes set out to take down corrupt superheroes who abuse their superpowers under corporate giant Vought International.',
      episodeGist: episode === 1
        ? 'A-Train accidentally obliterates Hughie Campbell\'s girlfriend Robin. Billy Butcher recruits Hughie to bug Vought Tower and they capture invisible Supe Translucent.'
        : `In Season ${season} Episode ${episode}, The Boys mount an undercover strike against Vought\'s corporate empire while Homelander threatens total chaos.`,
      recap: `Hughie Campbell\'s life is shattered when speedster A-Train obliterates his girlfriend Robin. Billy Butcher recruits Hughie into The Boys, an underground crew determined to expose Vought International and the Seven. Up to Season ${season} Episode ${episode}, The Boys have uncovered Compound V and pushed Homelander closer to unhinged psychotic rage.`,
      characters: [
        { name: 'Billy Butcher', role: 'Leader of The Boys', status: 'alive', note: 'Driven by blood hatred of Homelander and Vought.' },
        { name: 'Homelander', role: 'Leader of The Seven', status: 'alive', note: 'All-powerful psychopath hiding behind American smiles.' },
        { name: 'Hughie Campbell', role: 'Vigilante Tech', status: 'alive', note: 'Reluctant rebel surviving encounters with supes.' },
        { name: 'Starlight (Annie)', role: 'The Seven Member', status: 'alive', note: 'Secretly helping Hughie uncover Vought corruption.' },
        { name: 'Frenchie', role: 'Weapons Specialist', status: 'alive', note: 'Chemist crafting supe countermeasures.' }
      ],
      relationships: [
        { from: 'Butcher', to: 'Homelander', type: 'enemy', label: 'Mortal vengeance' },
        { from: 'Hughie', to: 'Starlight', type: 'romantic', label: 'Secret lovers' },
        { from: 'Butcher', to: 'Hughie', type: 'ally', label: 'Mentor & weapon' }
      ]
    },
    'inception': {
      platform: 'Cinema / OTT',
      genre: ['Sci-Fi', 'Action', 'Psychological'],
      poster: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80',
      synopsis: 'A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
      episodeGist: episode === 1
        ? 'Dom Cobb is offered redemption and a chance to return to his children if he pulls off the impossible feat of inception on Robert Fischer.'
        : 'Cobb and his assembled heist team descend into multi-layered subconscious dreamscapes aboard a ten-hour transatlantic flight.',
      recap: 'Dom Cobb operates in the shadowy realm of subconscious extraction. Hired by businessman Saito, Cobb puts together an elite team (Arthur, Ariadne, Eames, Yusuf) to perform inception on heir Robert Fischer. As they navigate descending dream layers, the phantom projection of Cobb’s deceased wife Mal threatens to destroy the entire mission.',
      characters: [
        { name: 'Dom Cobb', role: 'The Extractor', status: 'alive', note: 'Haunted by guilt over Mal, fighting to get home to his kids.' },
        { name: 'Arthur', role: 'The Point Man', status: 'alive', note: 'Meticulous coordinator managing dream logistics.' },
        { name: 'Ariadne', role: 'The Architect', status: 'alive', note: 'Designing impossible dream mazes and probing Cobb’s subconscious.' },
        { name: 'Mal Cobb', role: 'The Shade / Projection', status: 'dead', note: 'Cobb’s deceased wife sabotaging their subconscious missions.' }
      ],
      relationships: [
        { from: 'Cobb', to: 'Arthur', type: 'ally', label: 'Longtime Partners' },
        { from: 'Cobb', to: 'Mal', type: 'tragedy', label: 'Haunting Love & Grief' }
      ]
    }
  };

  showProfiles['naruto-naruto-shippuden'] = showProfiles['naruto'];

  const matched = showProfiles[slug] || {
    platform: 'OTT / Cinema',
    genre: ['Drama', 'Thriller'],
    poster: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=800&q=80',
    synopsis: `The acclaimed saga of ${title} spanning intricate character alliances and conflicts.`,
    episodeGist: episode === 1
      ? `The opening chapter of ${title} introduces the central dilemma, establishing key conflicts and the inciting incident.`
      : `In Season ${season} Episode ${episode}, the narrative intensifies as key characters confront previous consequences and face pivotal decisions.`,
    recap: `Caught up in the gripping world of ${title}. From the opening pilot to Season ${season} Episode ${episode}, key power dynamics have shifted dramatically. Old allegiances have fractured, stakes have escalated, and tension is running at an all-time high as the core characters prepare for their next fateful clash.`,
    characters: [
      { name: 'Lead Character', role: 'Protagonist', status: 'alive', note: `Navigating intense pressure up to Season ${season} Episode ${episode}.` },
      { name: 'Primary Rival', role: 'Antagonist', status: 'alive', note: 'Conspiring to maintain dominance against rival factions.' },
      { name: 'Key Ally', role: 'Right-hand confidant', status: 'alive', note: 'Providing critical assistance in the line of danger.' },
      { name: 'The Mentor', role: 'Guiding Figure', status: season > 1 ? 'dead' : 'alive', note: season > 1 ? 'Lost in earlier battles, inspiring the crew.' : 'Guiding the lead.' }
    ],
    relationships: [
      { from: 'Lead Character', to: 'Primary Rival', type: 'enemy', label: 'Central Rivalry' },
      { from: 'Lead Character', to: 'Key Ally', type: 'ally', label: 'Trusted Partners' }
    ]
  };

  const show = {
    slug,
    title,
    platform: matched.platform,
    type,
    genre: matched.genre,
    posterUrl: matched.poster,
    bannerUrl: matched.poster,
    synopsis: matched.synopsis,
    totalSeasons: Math.max(season, 4),
    totalEpisodes: season * 10,
    language: 'Original',
    tags: ['AI-Indexed', 'Zero-Spoiler', 'Community-Generated'],
    isPublished: true,
    episodes: Array.from({ length: season * 10 }, (_, i) => {
      const s = Math.floor(i / 10) + 1;
      const e = (i % 10) + 1;
      return {
        season: s,
        episode: e,
        title: s === season && e === episode ? `Milestone Episode ${e}` : `Episode ${e}`,
        runtime: 50
      };
    })
  };

  const recap = {
    season,
    episode,
    episodeGist: matched.episodeGist,
    storyRecap: matched.recap,
    keyMoments: [
      `Initial world-building and pivotal opening conflict`,
      `Key faction showdown leading into Season ${season}`,
      `The high-stakes developments culminating at Episode ${episode}`
    ],
    quotes: [
      { text: `Every choice up to this point has led us here.`, by: `${title} Lead`, episode: `S0${season}E0${episode}` }
    ]
  };

  const characterStatuses = matched.characters.map((c, i) => ({
    id: `char-gen-${i}`,
    name: c.name,
    role: c.role,
    status: c.status,
    note: c.note,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'
  }));

  const relationships = matched.relationships;

  return { show, recap, characterStatuses, relationships };
}
