import Link from 'next/link';
import { getAllShows } from '@/lib/dataService';
import SearchBar from '@/components/SearchBar';
import ShowCard from '@/components/ShowCard';
import DecryptedText from '@/components/reactbits/DecryptedText';
import ShinyText from '@/components/reactbits/ShinyText';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import Magnet from '@/components/reactbits/Magnet';
import {
  ShieldCheck,
  Sparkles,
  Sliders,
  Network,
  ArrowRight,
  Zap,
  Bell,
  Film,
  Search,
  Wand2,
  Tv
} from 'lucide-react';

export default async function HomePage() {
  const shows = await getAllShows();

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs sm:text-sm font-semibold mb-6 shadow-inner">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>The Zero-Spoiler Catch-Up Engine for Series, Movies &amp; Anime</span>
        </div>

        {/* Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight">
          Forgot who died before the new season?{' '}
          <span className="block mt-2">
            <ShinyText className="bg-gradient-to-r from-rose-500 via-rose-300 to-rose-500 bg-clip-text text-transparent">
              Zero Spoilers. Period.
            </ShinyText>
          </span>
        </h1>

        <p className="mt-6 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
          Google search autocomplete spoils character deaths in 2 seconds. Reddit is a spoiler minefield. Drag our{' '}
          <strong className="text-white">Episode Slider</strong> to where you paused, and see who was alive, who betrayed who, and get refreshed in 60 seconds.
        </p>

        {/* Fuzzy Search Bar */}
        <div className="mt-10 max-w-2xl mx-auto">
          <SearchBar shows={shows} />
        </div>

        {/* Quick Suggestion Tags */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-slate-400">
          <span>Popular right now:</span>
          {shows.map((show) => (
            <Link
              key={show.slug}
              href={`/${show.slug}`}
              className="px-2.5 py-1 rounded-lg bg-cinema-card border border-cinema-border hover:border-rose-500/50 hover:text-white transition"
            >
              {show.title}
            </Link>
          ))}
          <Link
            href="/generate"
            className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:text-white transition flex items-center gap-1 font-semibold"
          >
            <Wand2 className="w-3 h-3 text-amber-400" />
            <span>Generate ANY Show with AI →</span>
          </Link>
        </div>
      </section>

      {/* New Season Drop Alert */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/60 via-cinema-card to-cinema-surface border border-rose-500/40 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <Bell className="w-7 h-7 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold block mb-1">
                New Season Drop Alert
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Mirzapur Season 3 &amp; Panchayat Season 3 are out
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Stopped at S02E04 or S02E08? Catch up instantly without accidentally finding out who dies or takes the throne in Season 3.
              </p>
            </div>
          </div>

          <Magnet padding={20} magnetStrength={3}>
            <Link
              href="/mirzapur"
              className="px-6 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-500/30 transition flex items-center gap-2 whitespace-nowrap"
            >
              <span>Catch Up on Mirzapur</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Magnet>
        </div>
      </section>

      {/* Featured Zero-Spoiler Series & Movies Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-wider text-rose-400 font-semibold block">
              Curated Master Timelines
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
              Featured Shows With Zero-Spoiler Checkpoints
            </h2>
          </div>
          <Link
            href="/browse"
            className="text-sm font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 transition"
          >
            <span>Browse Full Catalog</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <ShowCard key={show.slug} show={show} />
          ))}
        </div>
      </section>

      {/* ✨ AI TIMELINE GENERATOR CALLOUT FOR ANY SHOW OR MOVIE */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SpotlightCard
          className="p-8 sm:p-12 border-rose-500/40 relative overflow-hidden"
          spotlightColor="rgba(244, 63, 94, 0.2)"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 text-center lg:text-left max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold">
                <Wand2 className="w-3.5 h-3.5" />
                <span>DYNAMIC AI ZERO-SPOILER ENGINE</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                Watching a different show or movie franchise?
              </h2>
              <p className="text-slate-300 text-sm leading-relaxed">
                Whether it&apos;s <strong className="text-white">Attack on Titan</strong>, <strong className="text-white">Game of Thrones</strong>, <strong className="text-white">The Boys</strong>, <strong className="text-white">Harry Potter</strong>, or <strong className="text-white">The Family Man</strong>—enter any title and your exact episode. Our AI model synthesizes a 100% spoiler-safe recap, character alive/dead grid, and relationship web on the fly!
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 pt-2">
                {['Attack on Titan (S03E12)', 'The Boys (S03E06)', 'Stranger Things (S04E07)', 'Harry Potter (Movie 4)'].map((ex) => (
                  <span
                    key={ex}
                    className="text-xs px-2.5 py-1 rounded-lg bg-cinema-black/80 border border-cinema-border text-slate-300 font-mono"
                  >
                    {ex}
                  </span>
                ))}
              </div>
            </div>

            <Magnet padding={25} magnetStrength={3}>
              <Link
                href="/generate"
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:opacity-90 text-white font-bold text-sm tracking-wide shadow-2xl shadow-rose-500/30 flex items-center gap-2 whitespace-nowrap transition transform hover:scale-105"
              >
                <Wand2 className="w-4 h-4 text-white" />
                <ShinyText className="text-white font-bold">
                  Generate Zero-Spoiler Timeline →
                </ShinyText>
              </Link>
            </Magnet>
          </div>
        </SpotlightCard>
      </section>

      {/* Why WhereWasI Fills the 4 Big Gaps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
            The Problem &amp; Why We Win
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
            Why Other Recap Sites Fail You
          </h2>
          <p className="text-sm text-slate-400 mt-3">
            Competitors like Preon TV or ReCap deliver boring AI text walls with zero Indian OTT or episode-locked status tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SpotlightCard className="p-6" spotlightColor="rgba(244, 63, 94, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">
              Indian OTT, Anime &amp; Movies
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Full coverage of Mirzapur, Panchayat, Family Man, anime series, and film universes where multi-year season gaps make viewers forget key details.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-6" spotlightColor="rgba(244, 63, 94, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">
              The Episode Slider
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Drag to exact S02E04 or Chapter 45. Everything after is physically sealed and classified so you never get accidentally spoiled.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-6" spotlightColor="rgba(244, 63, 94, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">
              Character Status Board
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Visual status cards for each character (Alive, Dead, Injured, Missing, Betrayed) synced precisely to your chosen episode.
            </p>
          </SpotlightCard>

          <SpotlightCard className="p-6" spotlightColor="rgba(244, 63, 94, 0.15)">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
              <Network className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base mb-2">
              Interactive Relationship Web
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Animated node graph mapping alliances, betrayals, and family feuds that morph and update as you scrub across episodes.
            </p>
          </SpotlightCard>
        </div>
      </section>

      {/* Community Request CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <SpotlightCard className="p-8 sm:p-12 border-rose-500/30">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
            Community Driven
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-2">
            Want a dedicated show added permanently?
          </h2>
          <p className="text-sm text-slate-400 mt-3 max-w-lg mx-auto">
            Vote on upcoming series and anime on our community request board.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/request"
              className="px-6 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/20 transition flex items-center gap-2"
            >
              <span>View Community Request Board</span>
              <ArrowRight className="w-4 h-4 text-rose-400" />
            </Link>
          </div>
        </SpotlightCard>
      </section>
    </div>
  );
}
