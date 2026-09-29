'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import DecryptedText from '@/components/reactbits/DecryptedText';
import ShinyText from '@/components/reactbits/ShinyText';
import RecapCard from '@/components/RecapCard';
import CharacterBoard from '@/components/CharacterBoard';
import RelationshipWeb from '@/components/RelationshipWeb';
import QuoteCarousel from '@/components/QuoteCarousel';
import ShareCardModal from '@/components/ShareCardModal';
import confetti from 'canvas-confetti';
import {
  Wand2,
  Sparkles,
  ShieldCheck,
  Film,
  Tv,
  CheckCircle,
  Loader2,
  ArrowRight,
  BookOpen,
  Users,
  GitFork,
  MessageSquareQuote,
  Share2
} from 'lucide-react';

function GeneratePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('tv');
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  useEffect(() => {
    const qTitle = searchParams.get('title');
    const qSeason = searchParams.get('season');
    const qEpisode = searchParams.get('episode');
    const qType = searchParams.get('type');
    if (qTitle) setTitle(qTitle);
    if (qSeason) setSeason(Number(qSeason) || 1);
    if (qEpisode) setEpisode(Number(qEpisode) || 1);
    if (qType) setType(qType);
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState('recap');
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const quickPicks = [
    { title: 'Inception', type: 'movie', season: 1, episode: 1, label: 'Movie' },
    { title: 'Attack on Titan', type: 'anime', season: 1, episode: 1, label: 'Anime S1E1' },
    { title: 'Stranger Things', type: 'tv', season: 1, episode: 1, label: 'Series S1E1' },
    { title: 'The Boys', type: 'tv', season: 1, episode: 1, label: 'Series S1E1' },
    { title: 'Game of Thrones', type: 'tv', season: 1, episode: 1, label: 'Series S1E1' },
    { title: 'Interstellar', type: 'movie', season: 1, episode: 1, label: 'Movie' }
  ];

  const handleQuickPick = (pick) => {
    setTitle(pick.title);
    setType(pick.type);
    setSeason(pick.season);
    setEpisode(pick.episode);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);
    setResult(null);

    // Simulated progress steps for great UX
    setGenerationStep('Searching plot records and cast index...');
    setTimeout(() => {
      setGenerationStep(`Enforcing strict spoiler freeze up to S0${season}E0${episode}...`);
    }, 900);
    setTimeout(() => {
      setGenerationStep('Synthesizing character alive / dead status matrix...');
    }, 1800);
    setTimeout(() => {
      setGenerationStep('Constructing interactive relationship & betrayal web...');
    }, 2600);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          type,
          season: parseInt(season, 10),
          episode: parseInt(episode, 10)
        })
      });

      const data = await res.json();
      if (data.success) {
        setResult(data);
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else {
        alert(data.error || 'Failed to generate recap. Please try again.');
      }
    } catch (err) {
      console.error('Error generating:', err);
      alert('An error occurred during generation.');
    } finally {
      setLoading(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-bold">
          <Wand2 className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span>DYNAMIC AI ZERO-SPOILER ENGINE</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Generate Zero-Spoiler Timeline for <span className="text-rose-400">ANY Show</span>
        </h1>
        <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
          Type any TV show, anime, or movie franchise. Pick your exact season and episode. Our AI synthesizes a 100% spoiler-safe recap, alive/dead character grid, and betrayal web on demand.
        </p>
      </div>

      {/* Generator Input Form */}
      <SpotlightCard className="p-6 sm:p-10 border-rose-500/40 shadow-2xl" spotlightColor="rgba(244, 63, 94, 0.15)">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold">
              Show / Franchise / Anime Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Attack on Titan, The Boys, Game of Thrones, Asur, Harry Potter..."
              className="w-full px-5 py-3.5 rounded-2xl bg-cinema-black border border-cinema-border text-white text-base focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/15 transition shadow-inner"
            />
          </div>

          {/* Quick Pick Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Or try a popular series:</span>
            <div className="flex flex-wrap gap-2">
              {quickPicks.map((pick) => (
                <button
                  type="button"
                  key={pick.title}
                  onClick={() => handleQuickPick(pick)}
                  className={`text-xs px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 ${
                    title === pick.title
                      ? 'bg-rose-500 text-white border-rose-400 font-bold'
                      : 'bg-cinema-black/80 text-slate-300 border-cinema-border hover:border-rose-500/50 hover:text-white'
                  }`}
                >
                  <span>{pick.title}</span>
                  <span className="text-[10px] opacity-75 font-mono">(S{pick.season}E{pick.episode})</span>
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
                  Movie Progress Checkpoint
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
                  <option value={3}>Full Movie Safe Recap (No Twist Spoiled)</option>
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Paused at Season
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={season}
                    onChange={(e) => setSeason(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-300 font-bold mb-1">
                    Paused at Episode
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={episode}
                    onChange={(e) => setEpisode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                  />
                </div>
              </>
            )}
          </div>

          <div className="pt-4 border-t border-cinema-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict 0% spoiler seal automatically applied</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 hover:opacity-95 text-white font-bold text-sm tracking-wide shadow-xl shadow-rose-500/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Zero-Spoiler Recap...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <ShinyText className="text-white font-bold">
                    Generate Zero-Spoiler Timeline
                  </ShinyText>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live Loading Radar Feedback */}
        {loading && (
          <div className="mt-6 p-4 rounded-2xl bg-cinema-black/90 border border-rose-500/40 text-center space-y-2 animate-pulse">
            <span className="text-xs font-mono text-rose-400 uppercase tracking-wider block">
              AI Zero-Spoiler Engine Processing
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
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Successfully Synthesized
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    Locked to S{String(result.recap.season).padStart(2, '0')}E{String(result.recap.episode).padStart(2, '0')}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-white">
                  {result.show.title}
                </h2>
                <p className="text-xs text-slate-300 mt-1">{result.show.synopsis}</p>
              </div>

              <div className="flex gap-2 shrink-0">
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-cinema-black hover:bg-white/10 text-white font-semibold text-xs border border-cinema-border flex items-center gap-2 transition"
                >
                  <Share2 className="w-4 h-4 text-rose-400" />
                  <span>Share Card</span>
                </button>
              </div>
            </div>
          </SpotlightCard>

          {/* Tab Selector - Horizontally scrollable on mobile */}
          <div className="flex items-center gap-2 border-b border-cinema-border/80 pb-3 overflow-x-auto no-scrollbar flex-nowrap scroll-smooth">
            {[
              { id: 'recap', label: 'Story Recap', icon: BookOpen },
              { id: 'characters', label: 'Character Status Board', icon: Users, badge: result.characterStatuses?.length },
              { id: 'web', label: 'Relationship Web', icon: GitFork },
              { id: 'quotes', label: 'Quotes', icon: MessageSquareQuote, badge: result.recap?.quotes?.length }
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

            {activeTab === 'quotes' && (
              <QuoteCarousel quotes={result.recap?.quotes || []} />
            )}
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
          <p className="text-sm font-medium">Loading generator...</p>
        </div>
      }
    >
      <GeneratePageContent />
    </Suspense>
  );
}
