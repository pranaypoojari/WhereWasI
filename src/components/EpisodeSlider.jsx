'use client';
import { useMemo } from 'react';
import { Lock, ChevronLeft, ChevronRight, Sliders, ShieldCheck } from 'lucide-react';
import DecryptedText from './reactbits/DecryptedText';
import ShinyText from './reactbits/ShinyText';

export default function EpisodeSlider({
  episodes = [],
  currentSeason,
  currentEpisode,
  onChange,
  showTitle = "Show"
}) {
  // Find current index
  const currentIndex = useMemo(() => {
    const idx = episodes.findIndex(
      (ep) => ep.season === currentSeason && ep.episode === currentEpisode
    );
    return idx >= 0 ? idx : 0;
  }, [episodes, currentSeason, currentEpisode]);

  const currentEpData = episodes[currentIndex] || {
    season: currentSeason,
    episode: currentEpisode,
    title: 'Episode'
  };

  // Group seasons for quick jump pills
  const seasons = useMemo(() => {
    const set = new Set();
    episodes.forEach((ep) => set.add(ep.season));
    return Array.from(set).sort((a, b) => a - b);
  }, [episodes]);

  const handleSliderChange = (e) => {
    const newIdx = parseInt(e.target.value, 10);
    const target = episodes[newIdx];
    if (target) {
      onChange(target.season, target.episode);
    }
  };

  const handleStep = (direction) => {
    const nextIdx = currentIndex + direction;
    if (nextIdx >= 0 && nextIdx < episodes.length) {
      const target = episodes[nextIdx];
      onChange(target.season, target.episode);
    }
  };

  const handleSeasonJump = (seasonNum) => {
    const firstOfSeason = episodes.find((ep) => ep.season === seasonNum);
    if (firstOfSeason) {
      onChange(firstOfSeason.season, firstOfSeason.episode);
    }
  };

  const percentProgress = episodes.length > 1 ? (currentIndex / (episodes.length - 1)) * 100 : 0;

  return (
    <div className="w-full bg-gradient-to-b from-cinema-card to-cinema-surface border border-cinema-border/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-950/20 backdrop-blur-xl relative overflow-hidden">
      {/* Ambient background glow line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-80" />

      {/* Top Bar: Anti-spoiler lock & status */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
              Zero-Spoiler Scrubber
            </span>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Future episodes strictly locked</span>
            </div>
          </div>
        </div>

        {/* Season Jump Pills */}
        <div className="flex items-center gap-1.5 bg-cinema-black/70 p-1 rounded-xl border border-cinema-border">
          <span className="text-[10px] text-slate-400 uppercase tracking-widest px-2 font-mono">
            Jump Season:
          </span>
          {seasons.map((s) => (
            <button
              key={s}
              onClick={() => handleSeasonJump(s)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                s === currentSeason
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30 scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              S{s}
            </button>
          ))}
        </div>
      </div>

      {/* Hero Display: Large Episode indicator & Decrypted Title */}
      <div className="py-4 my-2 text-center sm:text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-y border-cinema-border/50">
        <div>
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono">
              S{String(currentEpData.season).padStart(2, '0')}E{String(currentEpData.episode).padStart(2, '0')}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              Episode {currentIndex + 1} of {episodes.length}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-200 mt-1 flex items-center justify-center sm:justify-start gap-2">
            <span>Episode:</span>
            <DecryptedText
              key={`${currentEpData.season}-${currentEpData.episode}`}
              text={currentEpData.title}
              speed={25}
              className="text-rose-400 font-bold"
            />
          </h2>
        </div>

        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => handleStep(-1)}
            disabled={currentIndex === 0}
            className="p-3 rounded-2xl bg-cinema-black border border-cinema-border text-slate-300 hover:text-white hover:border-rose-500/50 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Previous Episode"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center px-3">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider block font-mono">
              Position
            </span>
            <span className="text-sm font-bold text-white">
              {Math.round(percentProgress)}%
            </span>
          </div>
          <button
            onClick={() => handleStep(1)}
            disabled={currentIndex === episodes.length - 1}
            className="p-3 rounded-2xl bg-cinema-black border border-cinema-border text-slate-300 hover:text-white hover:border-rose-500/50 disabled:opacity-30 disabled:pointer-events-none transition"
            title="Next Episode"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* The Scrubber Bar */}
      <div className="mt-6 mb-2">
        <div className="relative flex items-center">
          {/* Active progress fill */}
          <div
            className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 rounded-l-full bg-gradient-to-r from-rose-600 via-rose-500 to-rose-400 pointer-events-none shadow-[0_0_15px_rgba(244,63,94,0.6)]"
            style={{ width: `${percentProgress}%` }}
          />
          <input
            type="range"
            min="0"
            max={Math.max(episodes.length - 1, 0)}
            value={currentIndex}
            onChange={handleSliderChange}
            className="w-full relative z-10"
            aria-label="Episode scrubber slider"
          />
        </div>

        {/* Labels under slider */}
        <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
          <span>Start (S01E01)</span>
          <span className="hidden sm:inline-block text-[11px] text-slate-500">
            Drag to exact moment you stopped watching
          </span>
          <span className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-rose-500" />
            Locked beyond this point
          </span>
        </div>
      </div>
    </div>
  );
}
