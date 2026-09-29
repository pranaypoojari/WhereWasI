'use client';
import { useState, useEffect } from 'react';
import SpotlightCard from './reactbits/SpotlightCard';
import ShinyText from './reactbits/ShinyText';
import {
  BookOpen,
  CheckCircle2,
  Volume2,
  VolumeX,
  Sparkles,
  ArrowRight,
  Film,
  Library,
  Clock,
  Zap,
  Scissors,
  Flag
} from 'lucide-react';

export default function RecapCard({
  recap,
  season,
  episode,
  nextEpisodeData,
  showTitle = '',
  initialView = 'cumulative'
}) {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [summaryView, setSummaryView] = useState(initialView); // 'cumulative' | 'gist' | 'storybook'

  useEffect(() => {
    if (initialView) {
      setSummaryView(initialView);
    }
  }, [initialView]);

  const storyBook = recap?.storyBook || null;

  // Build fallback chapters on the fly if a static catalog show doesn't have storyBook pre-attached yet
  const effectiveStoryBook = storyBook || {
    title: `${showTitle || 'Complete Series'} — Start-to-End Story-Book`,
    subtitle:
      'Every essential canon plot point from the opening scene to the climax, with all filler subplots stripped out.',
    readingTimeMinutes: 4,
    watchTimeSaved: '10+ Hours Saved',
    fillersRemovedCount: 3,
    chapters: [
      {
        chapterNumber: 1,
        roman: 'I',
        title: 'Chapter I: The Opening Premise & Inciting Conflict',
        episodesCovered: 'Opening Arc (Start)',
        arcBadge: '100% Canon • Zero Filler',
        paragraphs: [
          recap?.storyRecap ||
            recap?.safeSummary ||
            'The story opens by introducing the core world, central characters, and the pivotal conflict that sets the entire narrative in motion.'
        ],
        keyTakeaway:
          recap?.keyMoments?.[0] || 'Sets the foundational stakes for all main characters.'
      },
      {
        chapterNumber: 2,
        roman: 'II',
        title: `Chapter II: Turning Points & Climax Through S${String(season).padStart(
          2,
          '0'
        )}E${String(episode).padStart(2, '0')}`,
        episodesCovered: `Up to S${String(season).padStart(2, '0')}E${String(episode).padStart(
          2,
          '0'
        )}`,
        arcBadge: 'Core Plot Progression',
        paragraphs: [
          recap?.episodeGist ||
            recap?.storyRecap ||
            'Alliances fracture and hidden motives surface as the protagonists are forced into their most dangerous confrontation yet.'
        ],
        keyTakeaway:
          recap?.cliffhanger ||
          recap?.keyMoments?.[recap?.keyMoments?.length - 1] ||
          'High-stakes turning point leading into the final act.'
      }
    ],
    endingExplained:
      recap?.cliffhanger ||
      recap?.episodeGist ||
      'All major character arcs collide as the overarching conflict reaches its decisive culmination.'
  };

  const activeText =
    summaryView === 'storybook'
      ? effectiveStoryBook.chapters
          .map((ch) => `${ch.title}. ${ch.paragraphs.join(' ')}`)
          .join('\n\n') + `\n\nEnding Explained: ${effectiveStoryBook.endingExplained}`
      : summaryView === 'gist'
      ? recap?.episodeGist ||
        recap?.safeSummary ||
        recap?.storyRecap ||
        'No episode gist available.'
      : recap?.storyRecap ||
        recap?.safeSummary ||
        recap?.episodeGist ||
        'No story recap available.';

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

  if (!recap) {
    return (
      <SpotlightCard className="p-8 text-center text-slate-400">
        <BookOpen className="w-8 h-8 text-rose-500 mx-auto mb-2 opacity-50" />
        <p className="text-base font-medium">Recap in progress for this episode position.</p>
        <p className="text-xs text-slate-500 mt-1">
          Drag the slider to any season or episode to fetch its live synopsis.
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
        {/* Header Bar */}
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
                  ? effectiveStoryBook.title
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

          {/* Audio Recap / Audiobook Button */}
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
                <span>
                  {summaryView === 'storybook'
                    ? 'Listen as Audiobook'
                    : 'Listen Audio Recap'}
                </span>
              </>
            )}
          </button>
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
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Book Value / Time-Saved Banner */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-cinema-black to-rose-950/30 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> 100% Canon • All Fillers Removed
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <Zap className="w-3 h-3" /> {effectiveStoryBook.watchTimeSaved}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-white/5 text-slate-300 border border-white/10 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-400" /> ~
                    {effectiveStoryBook.readingTimeMinutes} Min Book Read
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300 pt-1">
                  {effectiveStoryBook.subtitle}
                </p>
              </div>
            </div>

            {/* Chapters List */}
            <div className="space-y-6">
              {effectiveStoryBook.chapters.map((chapter) => (
                <div
                  key={chapter.chapterNumber}
                  className="p-5 sm:p-7 rounded-2xl bg-cinema-black/75 border border-cinema-border/80 hover:border-amber-500/40 transition space-y-4 shadow-inner"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cinema-border/50">
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-serif font-black text-sm flex items-center justify-center">
                        {chapter.roman || chapter.chapterNumber}
                      </span>
                      <div>
                        <h4 className="text-base sm:text-lg font-bold text-white font-serif">
                          {chapter.title}
                        </h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          Covers: {chapter.episodesCovered}
                        </span>
                      </div>
                    </div>

                    <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                      {chapter.arcBadge || 'Canon Plot'}
                    </span>
                  </div>

                  <div className="space-y-3 text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
                    {chapter.paragraphs.map((para, pIdx) => (
                      <p key={pIdx} className="leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>

                  {chapter.keyTakeaway && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs text-amber-200 flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-amber-300">Key Plot Turn: </span>
                        <span>{chapter.keyTakeaway}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Ending Explained Box */}
            {effectiveStoryBook.endingExplained && (
              <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-rose-950/50 via-cinema-black to-amber-950/40 border border-rose-500/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-rose-400 font-bold">
                  <Flag className="w-4 h-4 text-amber-400" />
                  <span>Final Climax & True Ending Explained</span>
                </div>
                <p className="text-sm sm:text-base text-slate-100 leading-relaxed">
                  {effectiveStoryBook.endingExplained}
                </p>
              </div>
            )}
          </div>
        )}
      </SpotlightCard>

      {/* Next Episode CTA Card */}
      {nextEpisodeData && summaryView !== 'storybook' && (
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
                Next up to watch: Season {nextEpisodeData.season}, Episode{' '}
                {nextEpisodeData.episode} &ldquo;{nextEpisodeData.title}&rdquo;
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSummaryView('storybook')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-semibold text-xs tracking-wide shadow-lg shadow-rose-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0 text-center w-full sm:w-auto"
          >
            <ShinyText className="font-semibold text-white">
              Or Skip Watching → Read Full Story-Book 📖
            </ShinyText>
          </button>
        </div>
      )}
    </div>
  );
}
