'use client';
import { useState, useEffect, useMemo } from 'react';
import ShowCard from '@/components/ShowCard';
import SearchBar from '@/components/SearchBar';
import { PLATFORMS, GENRES } from '@/lib/constants';
import { Filter, Film, Sparkles, SlidersHorizontal } from 'lucide-react';

export default function BrowsePage() {
  const [shows, setShows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedGenre, setSelectedGenre] = useState('All');

  useEffect(() => {
    async function fetchShows() {
      try {
        const res = await fetch('/api/shows');
        const data = await res.json();
        if (data.shows) {
          setShows(data.shows);
        }
      } catch (err) {
        console.error('Failed fetching shows:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchShows();
  }, []);

  const filteredShows = useMemo(() => {
    return shows.filter((s) => {
      const matchPlatform =
        selectedPlatform === 'All' ||
        s.platform?.toLowerCase() === selectedPlatform.toLowerCase();
      const matchGenre =
        selectedGenre === 'All' ||
        s.genre?.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
      return matchPlatform && matchGenre;
    });
  }, [shows, selectedPlatform, selectedGenre]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 font-mono">
          <Film className="w-3.5 h-3.5" />
          <span>Browse Show Vault</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Find Your Show &amp; Resume Watching
        </h1>
        <p className="text-slate-400 text-sm max-w-xl">
          Filter by streaming platform, genre, or search directly for your favorite series.
        </p>
      </div>

      {/* Global & Catalog Autofill Search */}
      <div className="max-w-2xl">
        <SearchBar shows={shows} showQuickChips={false} />
      </div>

      {/* Filter Bars */}
      <div className="space-y-4 p-6 rounded-3xl bg-cinema-card border border-cinema-border shadow-xl">
        {/* Platform filter */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <SlidersHorizontal className="w-3.5 h-3.5 text-rose-500" />
            <span>Streaming Platform</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((platform) => (
              <button
                key={platform}
                onClick={() => setSelectedPlatform(platform)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedPlatform === platform
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-cinema-black/80 text-slate-400 hover:text-white border border-cinema-border'
                }`}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>

        {/* Genre filter */}
        <div className="space-y-2 pt-3 border-t border-cinema-border/50">
          <div className="flex items-center gap-2 text-xs font-mono uppercase text-slate-400">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span>Genre</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedGenre === genre
                    ? 'bg-amber-500 text-cinema-black shadow-lg shadow-amber-500/30 font-bold'
                    : 'bg-cinema-black/80 text-slate-400 hover:text-white border border-cinema-border'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 font-mono text-sm animate-pulse">
          Loading catalog...
        </div>
      ) : filteredShows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredShows.map((show) => (
            <ShowCard key={show.slug} show={show} />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-cinema-card rounded-3xl border border-cinema-border">
          <p className="text-base text-slate-300">No shows match your active filters.</p>
          <button
            onClick={() => {
              setSelectedPlatform('All');
              setSelectedGenre('All');
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
}
