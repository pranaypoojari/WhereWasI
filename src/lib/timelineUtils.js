/**
 * Pure client-safe algorithms for episode timeline computation.
 * No fs or database dependencies.
 */

/**
 * Returns character statuses accurately computed up to a given season and episode.
 * If a status entry occurred on or before (targetSeason, targetEpisode), the latest one wins.
 */
export function computeCharacterStatuses(characters, season, episode) {
  if (!characters) return [];

  return characters.map((char) => {
    const relevantStatuses = (char.statusTimeline || []).filter((item) => {
      if (item.season < season) return true;
      if (item.season === season && item.episode <= episode) return true;
      return false;
    });

    if (relevantStatuses.length === 0) {
      return {
        id: char.id,
        name: char.name,
        aliases: char.aliases,
        role: char.role,
        avatar: char.avatar,
        status: "alive",
        note: "Initial introduction"
      };
    }

    const latest = relevantStatuses[relevantStatuses.length - 1];
    return {
      id: char.id,
      name: char.name,
      aliases: char.aliases,
      role: char.role,
      avatar: char.avatar,
      status: latest.status,
      note: latest.note
    };
  });
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


