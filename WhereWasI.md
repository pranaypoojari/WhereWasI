# Implementation Plan: `WhereWasI` — Zero-Spoiler Recap Engine for Series, Movies & Anime

> [!IMPORTANT]
> **Pure Focus:** `WhereWasI` is 100% dedicated to **TV Series, Movie Franchises, and Anime**.
> It solves the #1 pain point of modern entertainment: **accidental spoilers when catching up after a break**.

---

## 1. The Problem & The Solution

You paused *Mirzapur* after Season 2 two years ago. Season 3 just dropped. You forgot who betrayed who and who survived the wedding massacre. 
**If you Google a character's name, autocomplete instantly spoils that they die in Season 3.** Reddit threads, Wikipedia, and Fandom wikis are all spoiler minefields.

The same problem happens for:
- **Movie Universes / Franchises:** Paused the MCU before *Avengers: Endgame*? Watching *Harry Potter* with friends who stopped at *Prisoner of Azkaban*?
- **Anime & Manga:** 1,000+ episodes of *One Piece*, complex shifting Titan allegiances in *Attack on Titan*, power systems in *Jujutsu Kaisen*.
- **Indian OTT:** Multi-year season gaps in *Family Man*, *Asur*, *Panchayat*, *Sacred Games*, *Farzi*, *Kota Factory*.

### The Core Solution: The Time-Locked Episode / Movie Slider
You scrub to the exact episode (e.g. `S02E04`) or movie milestone (e.g. `Harry Potter: Movie 3`). 
**Everything after that point is physically filtered out and locked.**

```
┌───────────────────────────────────────────────────────────┐
│ 1. Search: Any Series, Movie Franchise, or Anime         │
│ 2. Drag Slider → Season 2, Episode 4 (or Movie 3)        │
│ 3. Instant Zero-Spoiler Output:                          │
│    ├── 📖 60-Second Cumulative Story Recap               │
│    ├── 🗺️ Character Status Board (Alive ✅ / Dead ☠️)    │
│    ├── 🕸️ Interactive Alliance & Betrayal Web            │
│    ├── 💬 Memorable Quotes up to that point              │
│    └── 🎬 "Ready to Watch S02E05?" Next Episode CTA      │
└───────────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Search & AI Model Architecture

### How does a user search for ANY show or movie?
Instead of being restricted to hardcoded JSON files, `WhereWasI` uses a **3-tier data engine**:

1. **Tier 1: High-Speed Cache & Seed Shows (Instant)**:
   - Popular shows (Mirzapur, Panchayat, Breaking Bad, Attack on Titan, etc.) are pre-indexed in MongoDB / JSON with full avatars, quotes, and timeline snapshots.
2. **Tier 2: TMDB / Open Search API (Metadata & Cast)**:
   - Users can search any show or movie franchise in the world.
   - Fetches official poster, synopsis, seasons, episode titles, and cast list.
3. **Tier 3: AI Zero-Spoiler Generator (Model API — Gemini / OpenAI)**:
   - When a user picks a show and episode that isn't cached yet, the AI Model API generates:
     - The cumulative recap strictly locked to `S{season}E{episode}`
     - The character status board with statuses (`ALIVE`, `DEAD`, `INJURED`, `BETRAYED`, `MISSING`)
     - The relationship web edges (`ALLY`, `ENEMY`, `FAMILY`, `ROMANTIC`, `BETRAYED`)
     - Memorable quotes up to that episode
   - The result is cached in MongoDB so future users get it instantly!

---

## 3. Tech Stack

- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + Framer Motion
- **Interactive UI:** React Bits (`SpotlightCard`, `DecryptedText`, `ShinyText`, `AuroraBackground`, `Magnet`)
- **Visual Graph:** Responsive SVG Interactive Relationship Web
- **Search:** Fuse.js (instant client fuzzy search) + AI / TMDB Dynamic Search
- **AI Model Integration:** Gemini API / OpenAI API with structured JSON output
- **Database:** MongoDB Atlas (with seamless local fallback when offline)

---

## 4. Database Schema

### `shows` (Series & Movie Franchises)
```javascript
{
  slug: "mirzapur",
  title: "Mirzapur",
  titleHindi: "मिर्ज़ापुर",
  platform: "Prime Video",
  type: "tv", // tv | movie_franchise | anime
  genre: ["Crime", "Thriller", "Action"],
  posterUrl: "https://...",
  totalSeasons: 3,
  totalEpisodes: 29,
  episodes: [
    { season: 1, episode: 1, title: "Jhandu", runtime: 54 },
    // ...
  ]
}
```

### `recaps` (Episode-Locked Brain)
```javascript
{
  showSlug: "mirzapur",
  season: 2,
  episode: 4,
  storyRecap: "...",
  keyMoments: ["...", "..."],
  quotes: [{ text: "...", by: "...", episode: "S01E03" }],
  characterStatuses: [
    { characterId: "guddu", name: "Guddu Pandit", status: "alive", note: "..." },
    { characterId: "bablu", name: "Bablu Pandit", status: "dead", note: "Killed in S01E09" }
  ],
  relationships: [
    { from: "Guddu", to: "Munna", type: "enemy", label: "Blood feud" },
    { from: "Guddu", to: "Golu", type: "ally", label: "Partners" }
  ]
}
```
