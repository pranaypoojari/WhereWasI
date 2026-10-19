/**
 * Pure client-safe algorithms for episode timeline computation.
 * No fs or database dependencies.
 */

function isOnOrBefore(item, season, episode) {
  const s = Number(item.season);
  const e = Number(item.episode);
  return s < season || (s === season && e <= episode);
}

/**
 * Returns character statuses accurately computed up to a given season and episode.
 * If a status entry occurred on or before (targetSeason, targetEpisode), the latest one wins.
 *
 * Spoiler shield rules:
 * - Characters whose first timeline entry is AFTER the target point are hidden entirely
 *   (their mere existence would be a spoiler).
 * - `futureFate` holds the first later entry whose status differs from the current one.
 *   The UI keeps it blurred until the user explicitly reveals it.
 * - `hasTimeline` tells the UI whether this character has fate data at all, so the shield
 *   can be shown for every tracked character (showing it only for those who change would leak).
 */
export function computeCharacterStatuses(characters, season, episode) {
  if (!characters) return [];
  const targetSeason = Number(season) || 1;
  const targetEpisode = Number(episode) || 1;

  return characters
    .map((char) => {
      const timeline = Array.isArray(char.statusTimeline) ? char.statusTimeline : [];
      const base = {
        id: char.id,
        name: char.name,
        aliases: char.aliases,
        role: char.role,
        avatar: char.avatar,
        primer: char.primer || char.explanation || null,
        hasTimeline: timeline.length > 0
      };

      if (timeline.length === 0) {
        return {
          ...base,
          status: char.status || 'alive',
          note: char.note || 'Initial introduction',
          futureFate: null
        };
      }

      const relevant = timeline.filter((item) => isOnOrBefore(item, targetSeason, targetEpisode));
      if (relevant.length === 0) return null;

      const latest = relevant[relevant.length - 1];
      const future = timeline.filter((item) => !isOnOrBefore(item, targetSeason, targetEpisode));
      const fateChange = future.find((item) => item.status !== latest.status) || null;

      return {
        ...base,
        status: latest.status,
        note: latest.note,
        futureFate: fateChange
          ? {
              status: fateChange.status,
              season: Number(fateChange.season),
              episode: Number(fateChange.episode),
              note: fateChange.note
            }
          : null
      };
    })
    .filter(Boolean);
}

/**
 * Returns relationship links up to a given season and episode.
 */
export function computeRelationships(recaps, season, episode) {
  if (!recaps || recaps.length === 0) return [];

  const validRecaps = recaps.filter((r) => {
    if (r.season < season) return true;
    if (r.season === season && r.episode <= episode) return true;
    return false;
  });

  if (validRecaps.length === 0) {
    return recaps[0].relationships || [];
  }

  const latestRecap = validRecaps[validRecaps.length - 1];
  return latestRecap.relationships || [];
}

/**
 * Filters relationships that carry their own `since` marker ({ season, episode }).
 * Relationships without a marker are always visible.
 */
export function filterRelationshipsByEpisode(relationships = [], season, episode) {
  const targetSeason = Number(season) || 1;
  const targetEpisode = Number(episode) || 1;
  return relationships.filter((rel) => !rel.since || isOnOrBefore(rel.since, targetSeason, targetEpisode));
}

/**
 * Finds or interpolates cumulative recap for exact or nearest preceding episode boundary.
 */
export function getRecapForEpisode(recaps, season, episode) {
  if (!recaps || recaps.length === 0) return null;

  const exact = recaps.find((r) => r.season === season && r.episode === episode);
  if (exact) return exact;

  const prior = recaps
    .filter((r) => r.season < season || (r.season === season && r.episode <= episode))
    .sort((a, b) => (b.season * 1000 + b.episode) - (a.season * 1000 + a.episode));

  if (prior.length > 0) {
    return prior[0];
  }

  return recaps[0];
}
