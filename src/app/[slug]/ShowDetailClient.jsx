'use client';
import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EpisodeSlider from '@/components/EpisodeSlider';
import RecapCard from '@/components/RecapCard';
import CharacterBoard from '@/components/CharacterBoard';
import RelationshipWeb from '@/components/RelationshipWeb';
import QuoteCarousel from '@/components/QuoteCarousel';
import ShareCardModal from '@/components/ShareCardModal';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import {
  computeCharacterStatuses,
  computeRelationships,
  filterRelationshipsByEpisode,
  getRecapForEpisode
} from '@/lib/timelineUtils';
import { formatEpisodeCode } from '@/lib/storyBookUtils';
import useKeyboardShortcuts from '@/lib/useKeyboardShortcuts';

import {
  BookOpen,
  Users,
  GitFork,
  MessageSquareQuote,
  Share2,
  Tv,
  Film,
  ShieldCheck,
  ChevronRight,
  Library,
  Loader2,
  Keyboard
} from 'lucide-react';

export default function ShowDetailClient({
  initialData,
  initialSeason = 1,
  initialEpisode = 1,
  initialMode = 'cumulative'
}) {
  const { show, characters = [], recaps: initialRecaps = [] } = initialData;

  const [currentSeason, setCurrentSeason] = useState(initialSeason);
  const [currentEpisode, setCurrentEpisode] = useState(initialEpisode);

  const [activeTab, setActiveTab] = useState('recap'); // 'recap', 'characters', 'web', 'quotes'
  const [recapViewMode, setRecapViewMode] = useState(initialMode); // 'cumulative' | 'gist' | 'storybook'
  // Live-generated shows may have been cached without characters; the API response fills them in.
  const [characterSource, setCharacterSource] = useState(characters);
  const attemptedFetchKeys = useRef(new Set());
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [posterError, setPosterError] = useState(false);

  // Store dynamically fetched episode recaps & full episode list from TVMaze/Wikipedia
  const [dynamicRecaps, setDynamicRecaps] = useState(initialRecaps);
  const [liveEpisodeCatalog, setLiveEpisodeCatalog] = useState(show.episodes || []);
  const [globalStoryBook, setGlobalStoryBook] = useState(show.storyBook || null);
  const [fetchingEpisode, setFetchingEpisode] = useState(false);

  // Automatically fetch live episode data & Story-Book if the selected (season, episode) doesn't have its own exact recap
  useEffect(() => {
    const hasExactRecap = dynamicRecaps.some(
      (r) =>
        Number(r.season) === Number(currentSeason) &&
        Number(r.episode) === Number(currentEpisode) &&
        (r.episodeGist || r.isRealWebData)
    );

    // Check if we already have this episode's summary in liveEpisodeCatalog
    const catalogEp = liveEpisodeCatalog.find(
      (ep) =>
        Number(ep.season) === Number(currentSeason) &&
        Number(ep.episode) === Number(currentEpisode) &&
        ep.summary &&
        ep.summary.length > 20
    );

    const needsCharacters = characterSource.length === 0;
    if ((hasExactRecap || catalogEp) && !needsCharacters) return;

    // Never re-request the same checkpoint (the API clamps e.g. movie acts, which would loop forever).
    const fetchKey = `${currentSeason}:${currentEpisode}`;
    if (attemptedFetchKeys.current.has(fetchKey)) return;
    attemptedFetchKeys.current.add(fetchKey);

    let isCancelled = false;
    async function fetchLiveEpisodeRecap() {
      try {
        setFetchingEpisode(true);
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: show.title,
            type: show.type || 'tv',
            season: currentSeason,
            episode: currentEpisode
          })
        });
        if (!res.ok || isCancelled) return;
        const data = await res.json();
        if (data.success && !isCancelled) {
          if (data.show?.episodes?.length > 0) {
            setLiveEpisodeCatalog(data.show.episodes);
          }
          if (Array.isArray(data.characters) && data.characters.length > 0) {
            setCharacterSource((prev) => (prev.length > 0 ? prev : data.characters));
          }
          if (data.recap?.storyBook) {
            setGlobalStoryBook(data.recap.storyBook);
          }
          if (data.recap) {
            setDynamicRecaps((prev) => {
              const filtered = prev.filter(
                (r) =>
                  !(
                    Number(r.season) === Number(currentSeason) &&
                    Number(r.episode) === Number(currentEpisode)
                  )
              );
              return [...filtered, data.recap];
            });
          }
        }
      } catch (e) {
        console.warn('Live episode fetch fallback:', e.message);
      } finally {
        if (!isCancelled) setFetchingEpisode(false);
      }
    }

    fetchLiveEpisodeRecap();
    return () => {
      isCancelled = true;
    };
  }, [currentSeason, currentEpisode, show.title, show.type, dynamicRecaps, liveEpisodeCatalog, characterSource]);

  // Compute live state derived from slider (never repeats the same sentence across different episodes!)
  const liveRecap = useMemo(() => {
    const exact = dynamicRecaps.find(
      (r) =>
        Number(r.season) === Number(currentSeason) &&
        Number(r.episode) === Number(currentEpisode)
    );
    if (exact && (exact.episodeGist || exact.isRealWebData)) {
      return {
        ...exact,
        storyBook: exact.storyBook || globalStoryBook
      };
    }

    // Build exact episode recap on-the-fly from liveEpisodeCatalog if TVMaze episodes are loaded
    const epObj = liveEpisodeCatalog.find(
      (e) =>
        Number(e.season) === Number(currentSeason) &&
        Number(e.episode) === Number(currentEpisode)
    );

    const priorEps = liveEpisodeCatalog.filter(
      (e) =>
        (Number(e.season) < Number(currentSeason) ||
          (Number(e.season) === Number(currentSeason) &&
            Number(e.episode) <= Number(currentEpisode))) &&
        e.summary &&
        e.summary.length > 15
    );

    if (epObj && epObj.summary) {
      const sampled =
        priorEps.length <= 5
          ? priorEps
          : priorEps.filter(
              (_, i) =>
                i === 0 ||
                i === priorEps.length - 1 ||
                i % Math.ceil(priorEps.length / 4) === 0
            );

      const cumulativeText =
        sampled.length > 0
          ? `Cumulative story catch-up from Season 1, Episode 1 up to Season ${currentSeason}, Episode ${currentEpisode} (${priorEps.length} episodes covered):\n\n` +
            sampled
              .map(
                (e) =>
                  `• S${String(e.season).padStart(2, '0')}E${String(e.episode).padStart(
                    2,
                    '0'
                  )} ("${e.title}"): ${e.summary}`
              )
              .join('\n\n')
          : epObj.summary;

      return {
        season: currentSeason,
        episode: currentEpisode,
        episodeTitle: epObj.title,
        episodeGist: `In Season ${currentSeason}, Episode ${currentEpisode} ("${epObj.title}"): ${epObj.summary}`,
        storyRecap: cumulativeText,
        storyBook: globalStoryBook,
        keyMoments: sampled.slice(-4).map(
          (e) =>
            `S${String(e.season).padStart(2, '0')}E${String(e.episode).padStart(2, '0')} • ${
              e.title
            }: ${e.summary.split('.')[0]}.`
        ),
        quotes: exact?.quotes || []
      };
    }

    const base = getRecapForEpisode(dynamicRecaps, currentSeason, currentEpisode);
    if (!base) return null;
    return {
      ...base,
      storyBook: base.storyBook || globalStoryBook
    };
  }, [dynamicRecaps, liveEpisodeCatalog, currentSeason, currentEpisode, globalStoryBook]);

  const liveCharacters = useMemo(() => {
    return computeCharacterStatuses(characterSource, currentSeason, currentEpisode);
  }, [characterSource, currentSeason, currentEpisode]);

  const liveRelationships = useMemo(() => {
    return filterRelationshipsByEpisode(
      computeRelationships(dynamicRecaps, currentSeason, currentEpisode),
      currentSeason,
      currentEpisode
    );
  }, [dynamicRecaps, currentSeason, currentEpisode]);

  // Next episode calculation for CTA
  const nextEpisodeData = useMemo(() => {
    const epList = liveEpisodeCatalog.length > 0 ? liveEpisodeCatalog : show.episodes || [];
    const currIdx = epList.findIndex(
      (ep) =>
        Number(ep.season) === Number(currentSeason) &&
        Number(ep.episode) === Number(currentEpisode)
    );
    if (currIdx >= 0 && currIdx < epList.length - 1) {
      return epList[currIdx + 1];
    }
    return null;
  }, [liveEpisodeCatalog, show.episodes, currentSeason, currentEpisode]);

  const episodeList = liveEpisodeCatalog.length > 0 ? liveEpisodeCatalog : show.episodes || [];

  const handleSliderChange = useCallback((season, episode) => {
    setCurrentSeason(Number(season) || 1);
    setCurrentEpisode(Number(episode) || 1);
  }, []);

  const stepEpisode = useCallback(
    (direction) => {
      const idx = episodeList.findIndex(
        (ep) => Number(ep.season) === Number(currentSeason) && Number(ep.episode) === Number(currentEpisode)
      );
      const target = idx >= 0 ? episodeList[idx + direction] : null;
      if (target) {
        handleSliderChange(target.season, target.episode);
      } else if (direction > 0) {
        handleSliderChange(currentSeason, Number(currentEpisode) + 1);
      } else if (Number(currentEpisode) > 1) {
        handleSliderChange(currentSeason, Number(currentEpisode) - 1);
      }
    },
    [episodeList, currentSeason, currentEpisode, handleSliderChange]
  );

  useKeyboardShortcuts({
    ArrowRight: () => stepEpisode(1),
    ArrowLeft: () => stepEpisode(-1),
    b: () => {
      setActiveTab('recap');
      setRecapViewMode((v) => (v === 'storybook' ? 'cumulative' : 'storybook'));
    }
  });

  // Keep the address bar shareable (?s=2&e=10&mode=book) without adding history entries.
  const lastSynced = useRef(`${initialSeason}:${initialEpisode}:${initialMode}`);
  useEffect(() => {
    const key = `${currentSeason}:${currentEpisode}:${recapViewMode}`;
    if (key === lastSynced.current) return;
    lastSynced.current = key;
    const params = new URLSearchParams(window.location.search);
    params.set('s', String(currentSeason));
    params.set('e', String(currentEpisode));
    if (recapViewMode === 'storybook') params.set('mode', 'book');
    else params.delete('mode');
    const hash = recapViewMode === 'storybook' ? window.location.hash : '';
    window.history.replaceState(window.history.state, '', `${window.location.pathname}?${params.toString()}${hash}`);
  }, [currentSeason, currentEpisode, recapViewMode]);

  const tabs = [
    { id: 'recap', label: 'Story Recap & Book Mode', icon: BookOpen },
    {
      id: 'characters',
      label: 'Character Status Board',
      icon: Users,
      badge: liveCharacters.length
    },
    { id: 'web', label: 'Relationship Web', icon: GitFork },
    {
      id: 'quotes',
      label: 'Quotes',
      icon: MessageSquareQuote,
      badge: liveRecap?.quotes?.length
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center justify-between gap-3">
        <ol className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
          <li>
            <Link href="/" className="hover:text-white transition">
              Home
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </li>
          <li>
            <Link href="/browse" className="hover:text-white transition">
              Shows
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </li>
          <li>
            <Link href={`/${show.slug}`} className="text-rose-400 font-semibold hover:text-rose-300 transition">
              {show.title}
            </Link>
          </li>
          <li aria-hidden="true">
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          </li>
          <li aria-current="page" className="text-slate-200">
            {recapViewMode === 'storybook' ? 'Story-Book' : formatEpisodeCode(currentSeason, currentEpisode)}
          </li>
        </ol>
        <p className="hidden md:flex items-center gap-1.5 text-[11px] font-mono text-slate-500">
          <Keyboard className="w-3.5 h-3.5" />
          <kbd className="px-1.5 rounded bg-white/5 border border-white/10 text-slate-300">←</kbd>
          <kbd className="px-1.5 rounded bg-white/5 border border-white/10 text-slate-300">→</kbd>
          episodes
          <kbd className="ml-2 px-1.5 rounded bg-white/5 border border-white/10 text-slate-300">B</kbd>
          book mode
        </p>
      </nav>

      {/* Hero Show Header */}
      <SpotlightCard
        className="p-6 sm:p-8 overflow-hidden relative"
        spotlightColor="rgba(244, 63, 94, 0.18)"
        borderColor="rgba(244, 63, 94, 0.35)"
      >
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Show Poster */}
          <div className="relative w-full sm:w-56 h-80 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-cinema-border/80 bg-gradient-to-br from-rose-950 via-cinema-card to-cinema-black flex items-center justify-center">
            {!posterError && show.posterUrl ? (
              <Image
                src={show.posterUrl}
                alt={show.title}
                fill
                unoptimized
                onError={() => setPosterError(true)}
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 224px"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-rose-500 shadow-xl">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-white text-base font-serif">{show.title}</h3>
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                  {show.platform}
                </span>
              </div>
            )}
            <div className="absolute top-3 left-3 z-10">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cinema-black/85 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1 shadow">
                <Tv className="w-3 h-3 text-rose-400" />
                {show.platform}
              </span>
            </div>
          </div>

          {/* Show Metadata & Synopsis */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Zero-Spoiler & Full Story-Book Engine
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {show.totalSeasons} Seasons •{' '}
                  {liveEpisodeCatalog.length || show.totalEpisodes} Total Episodes
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-3 flex-wrap">
                <span>{show.title}</span>
                {show.titleHindi && (
                  <span className="text-xl sm:text-2xl text-slate-400 font-serif font-normal">
                    ({show.titleHindi})
                  </span>
                )}
              </h1>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">{show.synopsis}</p>

            {/* Tags & Genres */}
            <div className="flex flex-wrap gap-2 pt-2">
              {show.genre?.map((g) => (
                <span
                  key={g}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white/5 text-slate-200 border border-white/10"
                >
                  {g}
                </span>
              ))}
              {show.tags?.map((t) => (
                <span
                  key={t}
                  className="text-xs font-mono px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/20"
                >
                  #{t}
                </span>
              ))}
            </div>

            {/* Action Bar */}
            <div className="pt-4 border-t border-cinema-border/50 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('recap');
                  setRecapViewMode('storybook');
                }}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-amber-500/25 flex items-center gap-2 transition"
              >
                <Library className="w-4 h-4" />
                <span>📖 Read Complete Story-Book (Start → End • No Fillers)</span>
              </button>

              <button
                type="button"
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-cinema-black hover:bg-white/10 text-white font-semibold text-xs border border-cinema-border flex items-center gap-2 transition"
              >
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Share Story Card</span>
              </button>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Tracking: S{String(currentSeason).padStart(2, '0')}E
                {String(currentEpisode).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* THE HERO INTERACTION: Episode Slider */}
      <section className="space-y-4">
        <EpisodeSlider
          episodes={episodeList}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onChange={handleSliderChange}
          showTitle={show.title}
        />
        {fetchingEpisode && (
          <div className="flex items-center justify-center gap-2 text-xs text-rose-400 font-mono py-1">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>
              Fetching live episode synopsis for S{String(currentSeason).padStart(2, '0')}E
              {String(currentEpisode).padStart(2, '0')}...
            </span>
          </div>
        )}
      </section>

      {/* Tab Switcher */}
      <section className="space-y-6">
        <div className="flex items-center gap-2 border-b border-cinema-border/80 pb-3 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shrink-0 whitespace-nowrap ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-cinema-card text-slate-400 hover:text-white border border-cinema-border'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                      isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        <div className="transition-all duration-300">
          {activeTab === 'recap' && (
            <div className="space-y-8 animate-in fade-in duration-200">
              <RecapCard
                recap={liveRecap}
                season={currentSeason}
                episode={currentEpisode}
                nextEpisodeData={nextEpisodeData}
                showTitle={show.title}
                slug={show.slug}
                shareBasePath={`/${show.slug}?mode=book`}
                view={recapViewMode}
                onViewChange={setRecapViewMode}
                onStepEpisode={handleSliderChange}
              />
              {liveRecap?.quotes && liveRecap.quotes.length > 0 && (
                <div className="mt-8">
                  <QuoteCarousel quotes={liveRecap.quotes} />
                </div>
              )}
            </div>
          )}

          {activeTab === 'characters' && (
            <div className="animate-in fade-in duration-200">
              <CharacterBoard
                characters={liveCharacters}
                season={currentSeason}
                episode={currentEpisode}
              />
            </div>
          )}

          {activeTab === 'web' && (
            <div className="animate-in fade-in duration-200">
              <RelationshipWeb
                characters={liveCharacters}
                relationships={liveRelationships}
                season={currentSeason}
                episode={currentEpisode}
              />
            </div>
          )}

          {activeTab === 'quotes' && (
            <div className="animate-in fade-in duration-200">
              <QuoteCarousel quotes={liveRecap?.quotes || []} />
            </div>
          )}
        </div>
      </section>

      {/* Share Card Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        showTitle={show.title}
        season={currentSeason}
        episode={currentEpisode}
        quote={liveRecap?.quotes?.[0]}
      />
    </div>
  );
}
