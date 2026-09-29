'use client';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import EpisodeSlider from '@/components/EpisodeSlider';
import RecapCard from '@/components/RecapCard';
import CharacterBoard from '@/components/CharacterBoard';
import RelationshipWeb from '@/components/RelationshipWeb';
import QuoteCarousel from '@/components/QuoteCarousel';
import ShareCardModal from '@/components/ShareCardModal';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import DecryptedText from '@/components/reactbits/DecryptedText';
import ShinyText from '@/components/reactbits/ShinyText';
import Magnet from '@/components/reactbits/Magnet';
import {
  computeCharacterStatuses,
  computeRelationships,
  getRecapForEpisode
} from '@/lib/timelineUtils';

import {
  BookOpen,
  Users,
  GitFork,
  MessageSquareQuote,
  Share2,
  Tv,
  Film,
  Calendar,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';



export default function ShowDetailClient({ initialData }) {
  const { show, characters, recaps } = initialData;

  // Default to Season 1, Episode 1
  const [currentSeason, setCurrentSeason] = useState(1);
  const [currentEpisode, setCurrentEpisode] = useState(1);


  const [activeTab, setActiveTab] = useState('recap'); // 'recap', 'characters', 'web', 'quotes'
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [posterError, setPosterError] = useState(false);


  // Compute live state derived from slider
  const liveRecap = useMemo(() => {
    return getRecapForEpisode(recaps, currentSeason, currentEpisode);
  }, [recaps, currentSeason, currentEpisode]);

  const liveCharacters = useMemo(() => {
    return computeCharacterStatuses(characters, currentSeason, currentEpisode);
  }, [characters, currentSeason, currentEpisode]);

  const liveRelationships = useMemo(() => {
    return computeRelationships(recaps, currentSeason, currentEpisode);
  }, [recaps, currentSeason, currentEpisode]);

  // Next episode calculation for CTA
  const nextEpisodeData = useMemo(() => {
    const epList = show.episodes || [];
    const currIdx = epList.findIndex(
      (ep) => ep.season === currentSeason && ep.episode === currentEpisode
    );
    if (currIdx >= 0 && currIdx < epList.length - 1) {
      return epList[currIdx + 1];
    }
    return null;
  }, [show.episodes, currentSeason, currentEpisode]);

  const handleSliderChange = (season, episode) => {
    setCurrentSeason(season);
    setCurrentEpisode(episode);
  };

  const tabs = [
    { id: 'recap', label: 'Story Recap', icon: BookOpen },
    { id: 'characters', label: 'Character Status Board', icon: Users, badge: liveCharacters.length },
    { id: 'web', label: 'Relationship Web', icon: GitFork },
    { id: 'quotes', label: 'Quotes', icon: MessageSquareQuote, badge: liveRecap?.quotes?.length }
  ];



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <Link href="/browse" className="hover:text-white transition">Shows</Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
        <span className="text-rose-400 font-semibold">{show.title}</span>
      </div>

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
                  <ShieldCheck className="w-3.5 h-3.5" /> Zero-Spoiler Engine Active
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {show.totalSeasons} Seasons • {show.totalEpisodes} Total Episodes
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

            <p className="text-sm text-slate-300 leading-relaxed max-w-3xl">
              {show.synopsis}
            </p>

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
                onClick={() => setIsShareModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-cinema-black hover:bg-white/10 text-white font-semibold text-xs border border-cinema-border flex items-center gap-2 transition"
              >
                <Share2 className="w-4 h-4 text-rose-400" />
                <span>Create Shareable Story Card</span>
              </button>

              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                Currently tracking: S{String(currentSeason).padStart(2, '0')}E{String(currentEpisode).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>

      {/* THE HERO INTERACTION: Episode Slider */}
      <section className="space-y-4">
        <EpisodeSlider
          episodes={show.episodes || []}
          currentSeason={currentSeason}
          currentEpisode={currentEpisode}
          onChange={handleSliderChange}
          showTitle={show.title}
        />
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
              />
              {/* Also show mini quotes inline */}
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
