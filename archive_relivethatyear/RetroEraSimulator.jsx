'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import SpotlightCard from './reactbits/SpotlightCard';
import DecryptedText from './reactbits/DecryptedText';
import ShinyText from './reactbits/ShinyText';
import Magnet from './reactbits/Magnet';
import {
  Tv,
  Film,
  Music,
  Radio,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Flame,
  Clapperboard,
  ArrowRight,
  Play,
  Volume2,
  Calendar,
  Layers,
  Award
} from 'lucide-react';

export default function RetroEraSimulator({ eras = [], initialEraId }) {
  const [activeEraIndex, setActiveEraIndex] = useState(() => {
    if (initialEraId) {
      const idx = eras.findIndex((e) => e.eraId === initialEraId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const [activeChannel, setActiveChannel] = useState(0); // 0: Music, 1: Vintage Ads, 2: Culture/Cricket
  const [activeSongIndex, setActiveSongIndex] = useState(0);

  const era = eras[activeEraIndex] || eras[0];

  const handleEraChange = (newIdx) => {
    if (newIdx >= 0 && newIdx < eras.length) {
      setActiveEraIndex(newIdx);
      setActiveSongIndex(0);
      setActiveChannel(0);
    }
  };

  const currentClip = era?.nostalgiaTVClips?.[activeChannel] || era?.nostalgiaTVClips?.[0];
  const currentSong = era?.topSongs?.[activeSongIndex] || era?.topSongs?.[0];

  return (
    <div className="space-y-10">
      {/* 🎚️ THE MASTER ERA TIME SLIDER */}
      <div className="bg-gradient-to-b from-cinema-card to-cinema-surface border border-cinema-border/90 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-500 opacity-80" />

        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block">
                Era Time-Machine Dial
              </span>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Current Era:</span>
                <span className="text-rose-400 font-mono">
                  {era.year} — {era.title.split('—')[0]}
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Year Jump Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 bg-cinema-black/80 p-1.5 rounded-2xl border border-cinema-border">
            {eras.map((e, idx) => (
              <button
                key={e.eraId}
                onClick={() => handleEraChange(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                  idx === activeEraIndex
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {e.year}
              </button>
            ))}
          </div>
        </div>

        {/* Range Slider Scrubber */}
        <div className="py-2">
          <div className="relative flex items-center">
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 rounded-l-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-500 pointer-events-none shadow-[0_0_15px_rgba(244,63,94,0.7)]"
              style={{
                width: `${(activeEraIndex / Math.max(eras.length - 1, 1)) * 100}%`
              }}
            />
            <input
              type="range"
              min="0"
              max={eras.length - 1}
              value={activeEraIndex}
              onChange={(e) => handleEraChange(parseInt(e.target.value, 10))}
              className="w-full relative z-10 cursor-pointer"
              aria-label="Era Time Machine Dial"
            />
          </div>

          <div className="flex justify-between items-center text-xs text-slate-400 mt-3 font-mono">
            <span>2011 (World Cup)</span>
            <span className="hidden sm:inline-block text-slate-500 text-[11px]">
              Drag slider to relive that specific year &amp; month
            </span>
            <span>2023 (Barbenheimer)</span>
          </div>
        </div>

        {/* Era Tagline */}
        <div className="mt-4 pt-4 border-t border-cinema-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <p className="text-slate-300 font-serif italic text-sm">
            &ldquo;{era.tagline}&rdquo;
          </p>
          <div className="flex items-center gap-2 text-rose-400 font-mono font-semibold shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Freeze Time at {era.year}</span>
          </div>
        </div>
      </div>

      {/* 📺 RETRO DEVICE SIMULATOR & CULTURAL PULSE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: The Retro TV / Phone Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <SpotlightCard
            className="p-6 border-cinema-border overflow-hidden"
            spotlightColor="rgba(244, 63, 94, 0.15)"
          >
            {/* TV Screen Top Bezel */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-cinema-border/60">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
                <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                  RETRO BROADCAST • CHANNEL {activeChannel + 1}: {currentClip?.channel}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-amber-400 border border-amber-400/20">
                {currentClip?.badge}
              </span>
            </div>

            {/* Video / Simulator Screen Area */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-cinema-black border-2 border-cinema-border shadow-2xl flex flex-col items-center justify-center group">
              {/* Scanlines overlay effect */}
              <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[length:100%_4px] pointer-events-none z-10 opacity-70" />

              {/* YouTube Video or Visual Fallback */}
              {currentClip?.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${currentClip.youtubeId}?autoplay=0&rel=0&modestbranding=1`}
                  title={currentClip.title}
                  className="w-full h-full relative z-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="p-8 text-center text-slate-400">
                  <Tv className="w-12 h-12 text-rose-500 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold text-white">{currentClip?.title}</p>
                </div>
              )}
            </div>

            {/* TV Channel Controls */}
            <div className="mt-4 pt-3 border-t border-cinema-border/50 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-mono text-slate-400">Switch Channel:</span>
              <div className="flex gap-2">
                {era?.nostalgiaTVClips?.map((clip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveChannel(idx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold font-mono transition-all ${
                      activeChannel === idx
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                        : 'bg-cinema-black/80 text-slate-400 hover:text-white border border-cinema-border'
                    }`}
                  >
                    CH {idx + 1}: {clip.channel}
                  </button>
                ))}
              </div>
            </div>
          </SpotlightCard>

          {/* 🎵 Era Jukebox / Top Songs of That Month */}
          <SpotlightCard className="p-5" spotlightColor="rgba(245, 158, 11, 0.12)">
            <div className="flex items-center gap-2 mb-3">
              <Music className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Top Charting Songs In {era.title.split('—')[0]}
              </h3>
            </div>
            <div className="space-y-2">
              {era?.topSongs?.map((song, idx) => (
                <div
                  key={idx}
                  onClick={() => setActiveSongIndex(idx)}
                  className={`p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition ${
                    activeSongIndex === idx
                      ? 'bg-amber-500/10 border border-amber-500/30 text-white'
                      : 'bg-cinema-black/50 border border-cinema-border/50 hover:bg-white/5 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-cinema-black flex items-center justify-center text-xs font-mono font-bold text-amber-400">
                      #{idx + 1}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white">{song.title}</h4>
                      <p className="text-[11px] text-slate-400">{song.artist}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/5">
                    {song.vibe}
                  </span>
                </div>
              ))}
            </div>
          </SpotlightCard>
        </div>

        {/* Right Column: Cultural Pulse & Economics (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Price & Economics Reality Check */}
          <SpotlightCard className="p-6" spotlightColor="rgba(16, 185, 129, 0.12)">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Economic Reality Check ({era.year})
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-cinema-black/80 border border-cinema-border">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Maggi Pack
                </span>
                <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                  {era.culturalSnapshot.maggiPrice}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-cinema-black/80 border border-cinema-border">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Petrol Price
                </span>
                <span className="text-lg font-black text-rose-400 font-mono mt-0.5 block">
                  {era.culturalSnapshot.petrolPrice}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-cinema-black/80 border border-cinema-border">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Movie Ticket
                </span>
                <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                  {era.culturalSnapshot.movieTicket}
                </span>
              </div>
            </div>

            {/* Slang Pills */}
            <div className="mt-4 pt-3 border-t border-cinema-border/50">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2">
                Slang On Everyone&apos;s Lips:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {era.culturalSnapshot.slang.map((s, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-200 font-medium"
                  >
                    &ldquo;{s}&rdquo;
                  </span>
                ))}
              </div>
            </div>
          </SpotlightCard>

          {/* Top Headlines of That Month */}
          <SpotlightCard className="p-6" spotlightColor="rgba(244, 63, 94, 0.12)">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-rose-500" />
              What Was Happening in the World
            </h3>
            <div className="space-y-2.5">
              {era.culturalSnapshot.topHeadlines.map((headline, i) => (
                <div
                  key={i}
                  className="p-3 rounded-xl bg-cinema-black/60 border border-cinema-border/60 text-xs text-slate-200 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <span>{headline}</span>
                </div>
              ))}
            </div>
          </SpotlightCard>

          {/* Viral Memes of That Month */}
          <SpotlightCard className="p-5" spotlightColor="rgba(168, 85, 247, 0.12)">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Viral Memes &amp; Trends That Month
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {era.culturalSnapshot.viralMemes.map((meme, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-purple-400">⚡</span>
                  <span>{meme}</span>
                </li>
              ))}
            </ul>
          </SpotlightCard>
        </div>
      </div>

      {/* 🎬 WHAT WAS PLAYING IN THEATRES (BOX OFFICE RADAR) */}
      <section className="space-y-4 pt-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-rose-400 text-xs font-mono uppercase font-bold">
              <Clapperboard className="w-4 h-4" />
              <span>Cinema &amp; Box Office Radar</span>
            </div>
            <h3 className="text-2xl font-black text-white tracking-tight mt-0.5">
              Movies Playing in Theatres in {era.year}
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {era.boxOfficeMovies?.length || 0} Blockbusters Documented
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {era.boxOfficeMovies?.map((movie, idx) => (
            <SpotlightCard
              key={idx}
              className="p-4 flex flex-col justify-between group hover:border-rose-500/50 transition-all duration-300"
              spotlightColor="rgba(244, 63, 94, 0.15)"
            >
              <div>
                <div className="relative h-44 w-full rounded-xl overflow-hidden bg-cinema-black mb-3 border border-cinema-border/60">
                  <Image
                    src={movie.poster}
                    alt={movie.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500 text-cinema-black font-mono shadow-md">
                      {movie.verdict}
                    </span>
                  </div>
                </div>

                <h4 className="font-bold text-base text-white group-hover:text-rose-400 transition">
                  {movie.title}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Director: {movie.director}
                </p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                  {movie.synopsis}
                </p>
              </div>

              <div className="mt-4 pt-2 border-t border-cinema-border/50 flex items-center justify-between text-[11px] text-slate-400">
                <span className="font-mono">In Cinema Halls</span>
                <span className="text-rose-400 font-semibold group-hover:translate-x-1 transition">
                  Release Milestone ★
                </span>
              </div>
            </SpotlightCard>
          ))}
        </div>
      </section>

      {/* 🌉 THE BRIDGE TO WHEREWASI: SHOWS AIRING THIS MONTH */}
      {era.linkedShowsActive && era.linkedShowsActive.length > 0 && (
        <section className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-950/40 via-cinema-card to-cinema-card border border-rose-500/40 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold block mb-1">
                The Bridge: What Were You Watching That Month?
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                Series Airing in {era.title.split('—')[0]}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                Click any show card to instantly open the zero-spoiler recap locked to that exact episode release!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {era.linkedShowsActive.map((item, idx) => (
              <Link
                key={idx}
                href={`/${item.slug}`}
                className="p-4 rounded-2xl bg-cinema-black/80 hover:bg-rose-500/10 border border-cinema-border hover:border-rose-500/50 transition flex items-center justify-between group shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
                    <Film className="w-5 h-5 group-hover:scale-110 transition" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white group-hover:text-rose-400 transition text-sm">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-400">{item.milestone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-rose-400 font-semibold group-hover:translate-x-1 transition shrink-0">
                  <span>Recap with 0% Spoilers</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
