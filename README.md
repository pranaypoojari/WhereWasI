# WhereWasI 🎬 — Zero-Spoiler Recap Engine for Series, Movies & Anime

> **Catch up on any show, anime, or movie franchise without getting spoiled.**
> Drag the scrubber to where you paused — everything afterward is physically locked and invisible.

Built with **Next.js 14 (App Router)**, **Tailwind CSS**, **React Bits** interactive components, **AI Zero-Spoiler Engine**, and **MongoDB Atlas** (with offline-ready fallback).

---

## ⚡ The Core Problem & Our Solution

You paused *Mirzapur* after Season 2 two years ago. Season 3 just dropped. You forgot who betrayed who.
**If you Google a character's name, autocomplete instantly spoils that they die.** Reddit threads and fandom wikis are spoiler minefields.

`WhereWasI` gives you a **Time-Locked Episode Scrubber**:
1. Search or pick any series, movie franchise, or anime.
2. Drag the slider to your exact watched point (e.g. `S02E04` or `Movie 3`).
3. Instantly view:
   - 📖 **60-Second Story Recap** (with built-in Audio Reader / Text-to-Speech)
   - 🗺️ **Character Status Board** (`ALIVE 🟢`, `DEAD ☠️`, `INJURED 🩹`, `BETRAYED 🗡️`, `MISSING ❓`)
   - 🕸️ **Interactive SVG Relationship Web** (Allies in green, Enemies in red, Betrayals in purple)
   - 💬 **Memorable Quotes & Key Moments**
   - 📱 **Shareable Instagram / WhatsApp Resuming Card**

---

## 🤖 Dynamic AI Zero-Spoiler Generator (`/generate`)

Users can search and generate zero-spoiler timelines for **ANY TV show, anime, or movie franchise in the world**:
- Enter any title (e.g. *Attack on Titan*, *The Boys*, *Game of Thrones*, *The Family Man*, *Asur*, *Harry Potter*, *Marvel MCU*).
- Specify Season & Episode.
- The AI Engine synthesizes a 100% spoiler-safe recap, alive/dead character matrix, and relationship web.
- **Model API Integration**:
  - Add your Gemini API key in `.env.local`:
    ```env
    GEMINI_API_KEY=your_gemini_api_key_here
    ```
  - If no API key is set, WhereWasI automatically uses its smart built-in knowledge generator so it works out of the box!

---

## 🚀 Running the App

### Development Server
```bash
npm run dev
```

### Production Build & Launch
```bash
npm run build
npx next start -p 3005
```

Live on **`http://localhost:3005`**.

---

## 📁 Project Architecture

```
WhereWasI/
├── archive_relivethatyear/     # Preserved ReliveThatYear nostalgia components for separate project
├── data/
│   └── seed/
│       ├── mirzapur.json
│       ├── panchayat.json
│       ├── breaking-bad.json
│       └── requests.json
├── src/
│   ├── app/
│   │   ├── layout.jsx
│   │   ├── page.jsx            # Series & Movies Hero + search + trending
│   │   ├── generate/page.jsx   # Dynamic AI Zero-Spoiler Synthesizer
│   │   ├── browse/page.jsx     # Browse by OTT platform and genre
│   │   ├── request/page.jsx    # Community request board
│   │   ├── [slug]/
│   │   │   ├── page.jsx
│   │   │   └── ShowDetailClient.jsx # Episode slider, character board, relationship web
│   │   └── api/
│   │       ├── generate/route.js # AI Model API integration (Gemini / Fallback)
│   │       ├── recaps/route.js
│   │       ├── shows/route.js
│   │       └── requests/route.js
│   ├── components/
│   │   ├── reactbits/
│   │   │   ├── SpotlightCard.jsx
│   │   │   ├── DecryptedText.jsx
│   │   │   ├── ShinyText.jsx
│   │   │   ├── AuroraBackground.jsx
│   │   │   └── Magnet.jsx
│   │   ├── Navbar.jsx
│   │   ├── SearchBar.jsx
│   │   ├── ShowCard.jsx
│   │   ├── EpisodeSlider.jsx
│   │   ├── RecapCard.jsx
│   │   ├── CharacterBoard.jsx
│   │   ├── RelationshipWeb.jsx
│   │   ├── QuoteCarousel.jsx
│   │   └── ShareCardModal.jsx
│   ├── lib/
│   │   ├── constants.js
│   │   ├── mongodb.js
│   │   ├── dataService.js
│   │   ├── timelineUtils.js
│   │   └── utils.js
│   └── styles/
│       └── globals.css
├── package.json
└── jsconfig.json
```
