'use client';
import { useState, useEffect, Suspense, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import ShinyText from '@/components/reactbits/ShinyText';
import RecapCard from '@/components/RecapCard';
import CharacterBoard from '@/components/CharacterBoard';
import RelationshipWeb from '@/components/RelationshipWeb';
import QuoteCarousel from '@/components/QuoteCarousel';
import ShareCardModal from '@/components/ShareCardModal';
import confetti from 'canvas-confetti';
import {
  Wand2,
  ShieldCheck,
  CheckCircle,
  Loader2,
  BookOpen,
  Users,
  GitFork,
  MessageSquareQuote,
  Share2,
  Library,
  Scissors
} from 'lucide-react';

function GeneratePageContent() {
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('tv');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);
  const [initialRecapView, setInitialRecapView] = useState('cumulative');

  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('recap');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const runGeneration = useCallback(
    async (targetTitle, targetType, targetSeason, targetEpisode, preferredView = 'cumulative') => {
      if (!targetTitle || !targetTitle.trim()) return;

      setLoading(true);
      setResult(null);
      setInitialRecapView(preferredView);

      setGenerationStep(
        preferredView === 'storybook'
          ? `Fetching complete Start-to-End plot & stripping fillers for "${targetTitle}"...`
          : `Fetching live episode synopsis for "${targetTitle}" S0${targetSeason}E0${targetEpisode}...`
      );
      setTimeout(() => {
        setGenerationStep(
          preferredView === 'storybook'
            ? 'Structuring Canon Chapters I–IV & Final Ending Explained...'
            : `Building cumulative story catch-up (S01E01 → S0${targetSeason}E0${targetEpisode})...`
        );
      }, 750);

      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: targetTitle.trim(),
            type: targetType,
            season: parseInt(targetSeason, 10) || 1,
            episode: parseInt(targetEpisode, 10) || 1
          })
        });

        const data = await res.json();
        if (data.success) {
          setResult(data);
          setActiveTab('recap');
          confetti({
            particleCount: 45,
            spread: 65,
            origin: { y: 0.6 }
          });
        } else {
          alert(data.error || 'Failed to fetch show data. Please try again.');
        }
      } catch (err) {
        console.error('Error generating:', err);
        alert('An error occurred while fetching show data.');
      } finally {
        setLoading(false);
        setGenerationStep('');
      }
    },
    []
  );

  // Auto-populate and auto-fetch when navigated from SearchBar
  useEffect(() => {
    const qTitle = searchParams.get('title');
    const qSeason = searchParams.get('season');
    const qEpisode = searchParams.get('episode');
    const qType = searchParams.get('type') || 'tv';
    const qMode = searchParams.get('mode'); // 'storybook' | null

    if (qTitle) {
      const s = Number(qSeason) || 1;
      const ep = Number(qEpisode) || 1;
      setTitle(qTitle);
      setType(qType);
      setSeason(s);
      setEpisode(ep);
      const viewMode = qMode === 'storybook' ? 'storybook' : 'cumulative';
      setInitialRecapView(viewMode);
      runGeneration(qTitle, qType, s, ep, viewMode);
    }
  }, [searchParams, runGeneration]);

  const quickPicks = [
    { title: 'Death Note', type: 'anime', season: 1, episode: 1, label: 'Anime' },
    { title: 'Inception', type: 'movie', season: 1, episode: 1, label: 'Movie' },
    { title: 'Attack on Titan', type: 'anime', season: 1, episode: 1, label: 'Anime' },
    { title: 'Stranger Things', type: 'tv', season: 1, episode: 1, label: 'Series' },
    { title: 'The Boys', type: 'tv', season: 1, episode: 1, label: 'Series' },
    { title: 'Interstellar', type: 'movie', season: 1, episode: 1, label: 'Movie' }
  ];

  const handleQuickPick = (pick, mode = 'cumulative') => {
    setTitle(pick.title);
    setType(pick.type);
    setSeason(pick.season);
    setEpisode(pick.episode);
    runGeneration(pick.title, pick.type, pick.season, pick.episode, mode);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    await runGeneration(title, type, season, episode, 'cumulative');
  };

  const handleGenerateStoryBook = async () => {
    if (!title.trim()) return;
    await runGeneration(title, type, season, episode, 'storybook');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span>LIVE PUBLIC WEB & STORY-BOOK ENGINE • NO API KEY REQUIRED</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Episode Recaps & <span className="text-amber-400">Full Story-Book</span> Mode
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Search any TV series, anime, or movie. Get the exact episode gist, a cumulative{' '}
          <strong className="text-white">Start → Episode X</strong> catch-up, or read the{' '}
          <strong className="text-amber-300">Complete Start-to-End Story-Book with 0% Fillers</strong>{' '}
          so you never have to sit through 3-hour movies or 500 filler episodes.
        </p>
      </div>

      {/* Generator Input Form */}
      <SpotlightCard
        className="p-6 sm:p-10 border-rose-500/40 shadow-2xl"
        spotlightColor="rgba(244, 63, 94, 0.15)"
      >
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Show / Movie / Anime Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Death Note, Attack on Titan, Inception, The Boys, Game of Thrones..."
              className="w-full px-5 py-3.5 rounded-2xl bg-cinema-black border border-cinema-border text-white text-base focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/15 transition shadow-inner"
            />
          </div>

          {/* Quick Pick Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase">
              Instant 1-Click Popular Titles:
            </span>
            <div className="flex flex-wrap gap-2">
              {quickPicks.map((pick) => (
                <button
                  type="button"
                  key={pick.title}
                  onClick={() => handleQuickPick(pick, 'cumulative')}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    title === pick.title
                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                      : 'bg-cinema-black/80 text-slate-300 border-cinema-border hover:border-rose-500/50 hover:text-white'
                  }`}
                >
                  <span>{pick.title}</span>
                  <span className="text-[10px] opacity-75 font-mono">({pick.label})</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                Format
              </label>
              <select
                value={type}
                onChange={(e) => {
                  setType(e.target.value);
                  if (e.target.value === 'movie') {
                    setSeason(1);
                    setEpisode(1);
                  }
                }}
                className="w-full px-4 py-3 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
              >
                <option value="tv">📺 TV / Web Series</option>
                <option value="anime">🎌 Anime Series</option>
                <option value="movie">🎬 Single Feature Film</option>
                <option value="movie_franchise">🍿 Movie Universe (MCU/HP)</option>
              </select>
            </div>

            {type === 'movie' ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                  Movie Reading Checkpoint
                </label>
                <select
                  value={episode}
                  onChange={(e) => {
                    setSeason(1);
                    setEpisode(parseInt(e.target.value, 10));
                  }}
                  className="w-full px-4 py-3 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value={1}>Act 1 & 2 • Intermission / Midpoint (First 60 mins)</option>
                  <option value={2}>Act 3 • Before the Final Climax</option>
                  <option value={3}>Complete Film Synopsis & Ending Explained</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Season Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="35"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Episode Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1200"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-cinema-border/50 flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                100% Free Live Web Fetch (TVMaze + Wikipedia) • Zero API Key Quota Limits
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              {/* Button 1: Read Complete Start-to-End Story-Book (No Fillers) */}
              <button
                type="button"
                disabled={loading || !title.trim()}
                onClick={handleGenerateStoryBook}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-cinema-black border border-amber-500/40 font-bold text-xs sm:text-sm tracking-wide flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <Library className="w-4 h-4" />
                <span>📖 Read Full Story-Book (Start → End • No Fillers)</span>
              </button>

              {/* Button 2: Episode Gist + Start-to-Episode Recap */}
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:opacity-95 text-white font-bold text-xs sm:text-sm tracking-wide shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Fetching Story Data...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <ShinyText className="text-white font-bold">
                      Fetch Episode & Cumulative Recap
                    </ShinyText>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Live Loading Radar Feedback */}
        {loading && (
          <div className="mt-6 p-4 rounded-2xl bg-cinema-black/90 border border-rose-500/40 text-center space-y-2 animate-pulse">
            <span className="text-xs font-mono text-rose-400 uppercase tracking-wider block">
              Live Web Story & Episode Engine Active
            </span>
            <p className="text-sm font-bold text-white flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              <span>{generationStep}</span>
            </p>
          </div>
        )}
      </SpotlightCard>

      {/* GENERATED RESULT DISPLAY */}
      {result && (
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Header Banner */}
          <SpotlightCard className="p-6 sm:p-8 border-emerald-500/40 bg-gradient-to-r from-emerald-950/20 via-cinema-card to-cinema-card">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Live Story Data Loaded
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Episode Target: S{String(result.recap.season).padStart(2, '0')}E
                    {String(result.recap.episode).padStart(2, '0')}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                    <Scissors className="w-3 h-3" /> Zero-Filler Book Ready
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  {result.show.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl">
                  {result.show.synopsis}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('recap');
                    setInitialRecapView('storybook');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-cinema-black font-bold text-xs border border-amber-500/40 flex items-center gap-2 transition"
                >
                  <Library className="w-4 h-4" />
                  <span>📖 Open Full Story-Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cinema-black hover:bg-white/10 text-white font-semibold text-xs border border-cinema-border flex items-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4 text-rose-400" />
                  <span>Share Card</span>
                </button>
              </div>
            </div>
          </SpotlightCard>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-cinema-border/80 pb-3 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth">
            {[
              { id: 'recap', label: 'Story Recap & Book Mode', icon: BookOpen },
              {
                id: 'characters',
                label: 'Character Status Board',
                icon: Users,
                badge: result.characterStatuses?.length
              },
              { id: 'web', label: 'Relationship Web', icon: GitFork },
              {
                id: 'quotes',
                label: 'Quotes',
                icon: MessageSquareQuote,
                badge: result.recap?.quotes?.length
              }
            ].map((tab) => {
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
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10 text-slate-300">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Active Tab Content */}
          <div className="transition-all duration-300">
            {activeTab === 'recap' && (
              <RecapCard
                recap={result.recap}
                season={result.recap.season}
                episode={result.recap.episode}
                showTitle={result.show.title}
                initialView={initialRecapView}
                nextEpisodeData={{
                  season: result.recap.season,
                  episode: result.recap.episode + 1,
                  title: 'Next Episode'
                }}
              />
            )}

            {activeTab === 'characters' && (
              <CharacterBoard
                characters={result.characterStatuses || []}
                season={result.recap.season}
                episode={result.recap.episode}
              />
            )}

            {activeTab === 'web' && (
              <RelationshipWeb
                characters={result.characterStatuses || []}
                relationships={result.relationships || []}
                season={result.recap.season}
                episode={result.recap.episode}
              />
            )}

            {activeTab === 'quotes' && <QuoteCarousel quotes={result.recap?.quotes || []} />}
          </div>

          <ShareCardModal
            isOpen={isShareModalOpen}
            onClose={() => setIsShareModalOpen(false)}
            showTitle={result.show.title}
            season={result.recap.season}
            episode={result.recap.episode}
            quote={result.recap?.quotes?.[0]}
          />
        </section>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-sm font-medium">Loading story engine...</p>
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
