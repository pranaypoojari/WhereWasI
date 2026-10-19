'use client';
import { useState, useEffect, useMemo } from 'react';
import SpotlightCard from './reactbits/SpotlightCard';
import ShinyText from './reactbits/ShinyText';
import StoryBookReader from './StoryBookReader';
import {
  buildFallbackStoryBook,
  buildRecapMarkdown,
  copyTextToClipboard,
  normalizeStoryBook
} from '@/lib/storyBookUtils';
import {
  BookOpen,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Film,
  Library,
  ChevronLeft,
  ChevronRight,
  Users,
  ClipboardCopy,
  Check
} from 'lucide-react';

export default function RecapCard({
  recap,
  season,
  episode,
  nextEpisodeData,
  showTitle = '',
  slug = '',
  shareBasePath,
  view,
  onViewChange,
  onStepEpisode
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [copyState, setCopyState] = useState('idle'); // 'idle' | 'copied' | 'failed'
  // Controlled when the parent passes `view` (needed for the "B" keyboard shortcut); local otherwise.
  const [localView, setLocalView] = useState('cumulative');
  const summaryView = view ?? localView;
  const setSummaryView = (next) => {
    if (onViewChange) onViewChange(next);
    else setLocalView(next);
  };

  // Stop the quick audio recap when switching views or unmounting (the Story-Book has its own narrator).
  useEffect(() => {
    setIsPlayingAudio(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [summaryView, season, episode]);

  useEffect(() => {
    if (copyState === 'idle') return;
    const t = setTimeout(() => setCopyState('idle'), 2000);
    return () => clearTimeout(t);
  }, [copyState]);

  const storyBook = recap?.storyBook || null;
  const characterGuide =
    recap?.characterGuide || storyBook?.characterGuide || null;

  const effectiveStoryBook = useMemo(
    () =>
      normalizeStoryBook(
        storyBook || buildFallbackStoryBook({ recap, showTitle, season, episode, characterGuide })
      ),
    [storyBook, recap, showTitle, season, episode, characterGuide]
  );

  const activeText =
    summaryView === 'gist'
      ? recap?.episodeGist || recap?.safeSummary || recap?.storyRecap || 'No episode gist available.'
      : recap?.storyRecap || recap?.safeSummary || recap?.episodeGist || 'No story recap available.';

  const toggleAudio = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported by your browser.');
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

  const handleCopyMarkdown = async () => {
    const url =
      typeof window !== 'undefined'
        ? `${window.location.origin}${window.location.pathname}${window.location.search}`
        : '';
    const markdown = buildRecapMarkdown({
      showTitle,
      season,
      episode,
      view: summaryView,
      recap,
      storyBook: effectiveStoryBook,
      url
    });
    const ok = await copyTextToClipboard(markdown);
    setCopyState(ok ? 'copied' : 'failed');
  };

  const handlePrevEpisode = () => {
    if (!onStepEpisode) return;
    if (Number(episode) > 1) {
      onStepEpisode(Number(season), Number(episode) - 1);
    } else if (Number(season) > 1) {
      onStepEpisode(Number(season) - 1, 1);
    }
  };

  const handleNextEpisode = () => {
    if (!onStepEpisode) return;
    const nextS = nextEpisodeData?.season || Number(season);
    const nextE = nextEpisodeData?.episode || Number(episode) + 1;
    onStepEpisode(nextS, nextE);
  };

  if (!recap) {
    return (
      <SpotlightCard className="p-8 text-center text-slate-400">
        <BookOpen className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
        <p className="text-base font-medium">Recap in progress for this episode position.</p>
        <p className="text-xs text-slate-500 mt-1">
          Use the Next / Prev episode buttons or slider to load any episode.
        </p>
      </SpotlightCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Story Recap / Book Reader Card */}
      <SpotlightCard
        className="p-6 sm:p-8"
        spotlightColor={
          summaryView === 'storybook'
            ? 'rgba(245, 158, 11, 0.16)'
            : 'rgba(244, 63, 94, 0.15)'
        }
        borderColor={
          summaryView === 'storybook'
            ? 'rgba(245, 158, 11, 0.4)'
            : 'rgba(244, 63, 94, 0.35)'
        }
      >
        {/* Header Bar with Direct Prev (<) and Next (>) Episode Stepper */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-cinema-border/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                summaryView === 'storybook'
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
              }`}
            >
              {summaryView === 'storybook' ? (
                <Library className="w-5 h-5" />
              ) : summaryView === 'gist' ? (
                <Film className="w-5 h-5" />
              ) : (
                <BookOpen className="w-5 h-5" />
              )}
            </div>
            <div>
              <span
                className={`text-xs font-mono uppercase tracking-wider ${
                  summaryView === 'storybook' ? 'text-amber-400' : 'text-rose-400'
                }`}
              >
                {summaryView === 'storybook'
                  ? 'Complete Start-to-End Novelization • Zero Fillers'
                  : summaryView === 'gist'
                  ? `Single Episode Synopsis (${recap.episodeTitle || `S${season}E${episode}`})`
                  : 'Cumulative Zero-Spoiler Arc'}
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {summaryView === 'storybook'
                  ? 'Story-Book Mode'
                  : summaryView === 'gist'
                  ? `What Happens in S${String(season).padStart(2, '0')}E${String(
                      episode
                    ).padStart(2, '0')}${
                      recap.episodeTitle ? `: "${recap.episodeTitle}"` : ''
                    }`
                  : `Full Story Catch-Up (S01E01 → S${String(season).padStart(
                      2,
                      '0'
                    )}E${String(episode).padStart(2, '0')})`}
              </h3>
            </div>
          </div>

          {/* Right Controls: Direct Episode Stepper (< Prev | Next >) + Audio Recap */}
          <div className="flex flex-wrap items-center gap-2">
            {onStepEpisode && (
              <div className="inline-flex items-center rounded-xl bg-cinema-black/90 border border-cinema-border p-1">
                <button
                  type="button"
                  onClick={handlePrevEpisode}
                  disabled={Number(season) <= 1 && Number(episode) <= 1}
                  title="Previous Episode"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-white/10 disabled:opacity-35 disabled:pointer-events-none flex items-center gap-1 transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-rose-400" />
                  <span>Prev</span>
                </button>
                <span className="px-2.5 text-xs font-mono font-bold text-white border-x border-cinema-border/60">
                  S{String(season).padStart(2, '0')}E{String(episode).padStart(2, '0')}
                </span>
                <button
                  type="button"
                  onClick={handleNextEpisode}
                  title="Next Episode"
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-rose-300 hover:text-white hover:bg-rose-500/20 flex items-center gap-1 transition"
                >
                  <span>Next Ep</span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleCopyMarkdown}
              title="Copy as Markdown for Discord / Reddit"
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                copyState === 'copied'
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                  : 'bg-cinema-black/80 text-slate-300 border-cinema-border hover:text-white hover:border-rose-500/40'
              }`}
            >
              {copyState === 'copied' ? (
                <Check className="w-4 h-4" />
              ) : (
                <ClipboardCopy className="w-4 h-4 text-rose-400" />
              )}
              <span>
                {copyState === 'copied' ? 'Copied!' : copyState === 'failed' ? 'Copy blocked' : 'Copy Recap'}
              </span>
            </button>

            {summaryView !== 'storybook' && (
              <button
                type="button"
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
            )}
          </div>
        </div>

        {/* 3-Mode View Switcher Buttons */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-cinema-black/85 border border-cinema-border/70 mb-6 w-fit">
          <button
            type="button"
            onClick={() => setSummaryView('cumulative')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryView === 'cumulative'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Story Recap (Start → S{season}E{episode})</span>
          </button>

          <button
            type="button"
            onClick={() => setSummaryView('gist')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryView === 'gist'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Episode S{season}E{episode} Gist</span>
          </button>

          <button
            type="button"
            onClick={() => setSummaryView('storybook')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              summaryView === 'storybook'
                ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-lg shadow-amber-500/25'
                : 'text-amber-300/90 hover:text-white bg-amber-500/10 border border-amber-500/25'
            }`}
          >
            <Library className="w-3.5 h-3.5" />
            <span>📖 Read Full Story-Book (Start → End • No Fillers)</span>
          </button>
        </div>

        {/* NEWCOMER'S GUIDE: WHO'S WHO & KEY CHARACTERS EXPLAINED */}
        {characterGuide?.characters?.length > 0 && (
          <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-cinema-black/70 border border-cinema-border/80 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-amber-400 font-bold">
                <Users className="w-4 h-4 text-rose-400" />
                <span>Who&apos;s Who — Key Characters & Roles Explained</span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Beginner-friendly character guide
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {characterGuide.characters.map((char, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-cinema-card/90 border border-white/10 space-y-1"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-white text-xs sm:text-sm">
                      {char.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-rose-400 block">
                    {char.role}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed pt-0.5">
                    {char.explanation}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MODE A & B: Cumulative Recap or Single Episode Gist */}
        {summaryView !== 'storybook' ? (
          <>
            <div className="text-slate-200 text-base leading-relaxed sm:leading-loose font-normal whitespace-pre-line">
              {activeText}
            </div>

            {/* Key Moments */}
            {recap.keyMoments && recap.keyMoments.length > 0 && (
              <div className="mt-6 pt-5 border-t border-cinema-border/50">
                <h4 className="text-xs uppercase font-mono tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Key Milestones Covered
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
          </>
        ) : (
          /* MODE C: 📖 COMPLETE START-TO-END STORY-BOOK (ZERO FILLERS) */
          <StoryBookReader
            storyBook={effectiveStoryBook}
            showTitle={showTitle}
            slug={slug}
            shareBasePath={shareBasePath}
          />
        )}
      </SpotlightCard>

      {/* Bottom Next Episode Stepper & Book Mode CTA Card */}
      {nextEpisodeData && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-cinema-card to-cinema-card border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-11 h-11 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
              <ArrowRight className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider font-mono text-rose-400 font-semibold block">
                Continue Episode-by-Episode
              </span>
              <p className="text-sm font-semibold text-white">
                Next up: Season {nextEpisodeData.season}, Episode {nextEpisodeData.episode}{' '}
                {nextEpisodeData.title ? `— "${nextEpisodeData.title}"` : ''}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 w-full sm:w-auto">
            {onStepEpisode && (
              <button
                type="button"
                onClick={handleNextEpisode}
                className="px-5 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-500/30 flex items-center justify-center gap-1.5 transition transform hover:-translate-y-0.5"
              >
                <span>
                  Next Episode (S{String(nextEpisodeData.season).padStart(2, '0')}E
                  {String(nextEpisodeData.episode).padStart(2, '0')})
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {summaryView !== 'storybook' && (
              <button
                type="button"
                onClick={() => setSummaryView('storybook')}
                className="px-4 py-2.5 rounded-xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-cinema-black border border-amber-500/40 font-bold text-xs tracking-wide transition"
              >
                <ShinyText className="font-bold">
                  Or Read Full Story-Book 📖
                </ShinyText>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
