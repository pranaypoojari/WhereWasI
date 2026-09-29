'use client';
import { useState } from 'react';
import SpotlightCard from './reactbits/SpotlightCard';
import ShinyText from './reactbits/ShinyText';
import { BookOpen, CheckCircle2, Volume2, VolumeX, Sparkles, ArrowRight, Film } from 'lucide-react';

export default function RecapCard({ recap, season, episode, nextEpisodeData }) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [summaryView, setSummaryView] = useState('cumulative'); // 'cumulative' | 'gist'

  const activeText = summaryView === 'gist'
    ? (recap?.episodeGist || recap?.safeSummary || recap?.storyRecap || "No episode gist available.")
    : (recap?.storyRecap || recap?.safeSummary || recap?.episodeGist || "No story recap available.");

  const toggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported by your browser.");
      return;
    }

    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(activeText);
      utterance.rate = 1.0;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      setIsPlayingAudio(true);
    }
  };

  if (!recap) {
    return (
      <SpotlightCard className="p-8 text-center text-slate-400">
        <BookOpen className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
        <p className="text-base font-medium">Recap in progress for this episode position.</p>
        <p className="text-xs text-slate-500 mt-1">Drag the slider to nearby milestone episodes.</p>
      </SpotlightCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Story Recap Card */}
      <SpotlightCard
        className="p-6 sm:p-8"
        spotlightColor="rgba(244, 63, 94, 0.15)"
        borderColor="rgba(244, 63, 94, 0.35)"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-cinema-border/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              {summaryView === 'gist' ? <Film className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-rose-400">
                {summaryView === 'gist' ? `Single Episode Synopsis` : `Cumulative Zero-Spoiler Arc`}
              </span>
              <h3 className="text-lg font-bold text-white">
                {summaryView === 'gist'
                  ? `What Happens in S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`
                  : `Full Story Catch-Up (S01E01 → S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')})`}
              </h3>
            </div>
          </div>

          {/* Audio Recap Button */}
          <button
            onClick={toggleAudio}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
              isPlayingAudio
                ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 animate-pulse'
                : 'bg-cinema-black/80 text-slate-300 border-cinema-border hover:text-white hover:border-rose-500/40'
            }`}
          >
            {isPlayingAudio ? (
              <>
                <VolumeX className="w-4 h-4 text-white" />
                <span>Stop Audio</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-rose-400" />
                <span>Listen Audio Recap</span>
              </>
            )}
          </button>
        </div>

        {/* View Toggle Buttons */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-cinema-black/80 border border-cinema-border/70 mb-5 w-fit">
          <button
            onClick={() => setSummaryView('cumulative')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryView === 'cumulative'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Story Recap (Start → S{season}E{episode})</span>
          </button>
          <button
            onClick={() => setSummaryView('gist')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryView === 'gist'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Episode S{season}E{episode} Gist</span>
          </button>
        </div>

        {/* Narrative text */}
        <p className="text-slate-200 text-base leading-relaxed sm:leading-loose font-normal">
          {activeText}
        </p>

        {/* Key Moments */}
        {recap.keyMoments && recap.keyMoments.length > 0 && (
          <div className="mt-6 pt-5 border-t border-cinema-border/50">
            <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              Key Moments Up To This Point
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {recap.keyMoments.map((moment, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-cinema-black/50 border border-cinema-border/40 text-xs text-slate-300"
                >
                  <CheckCircle2 className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{moment}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SpotlightCard>

      {/* Next Episode CTA Card */}
      {nextEpisodeData && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-cinema-card to-cinema-card border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-mono text-rose-400 font-semibold block">
                You are all caught up!
              </span>
              <p className="text-sm font-semibold text-white">
                Next up to watch: Season {nextEpisodeData.season}, Episode {nextEpisodeData.episode} &ldquo;{nextEpisodeData.title}&rdquo;
              </p>
            </div>
          </div>

          <a
            href="#ready"
            onClick={(e) => {
              e.preventDefault();
              alert(`Enjoy S${nextEpisodeData.season}E${nextEpisodeData.episode}! You are 100% refreshed with zero spoilers.`);
            }}
            className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs tracking-wide shadow-lg shadow-rose-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-center w-full sm:w-auto"
          >
            <ShinyText className="font-semibold text-white">
              Watch Next Episode Now →
            </ShinyText>
          </a>
        </div>
      )}
    </div>
  );
}
