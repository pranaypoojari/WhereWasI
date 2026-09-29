'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Fuse from 'fuse.js';
import {
  Search,
  Film,
  Tv,
  Sparkles,
  ArrowRight,
  X,
  Loader2,
  Clapperboard,
  CheckCircle2,
  Flame
} from 'lucide-react';

export default function SearchBar({
  shows = [],
  placeholder = "Search any movie, anime, or series (e.g. Inception, Attack on Titan, Stranger Things)...",
  showQuickChips = true
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all'); // 'all', 'movie', 'tv', 'anime'
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef(null);

  // Client-side quick fuse for catalog shows (instant zero-latency fallback)
  const fuseCatalog = useRef(
    new Fuse(shows, {
      keys: [
        { name: 'title', weight: 0.75 },
        { name: 'titleHindi', weight: 0.2 },
        { name: 'tags', weight: 0.03 },
        { name: 'genre', weight: 0.02 }
      ],
      threshold: 0.32
    })
  );

  useEffect(() => {
    fuseCatalog.current.setCollection(shows);
  }, [shows]);

  // Fetch suggestions from our unified API
  const fetchSuggestions = useCallback(async (searchQuery, activeCat) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/search/suggestions?q=${encodeURIComponent(searchQuery.trim())}&category=${activeCat}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          setSuggestions(data.results);
          return;
        }
      }
    } catch (e) {
      console.warn('Suggestion fetch error, using client fallback:', e);
    } finally {
      setLoading(false);
    }

    // Client fallback if network API fails or slow
    const lowerQ = searchQuery.trim().toLowerCase();
    const clientMatches = fuseCatalog.current
      .search(searchQuery)
      .filter(r => (r.item.title || '').toLowerCase().includes(lowerQ))
      .map(r => ({
        title: r.item.title,
        titleHindi: r.item.titleHindi,
        slug: r.item.slug,
        type: r.item.type || 'tv',
        platform: r.item.platform,
        genre: Array.isArray(r.item.genre) ? r.item.genre.join(', ') : r.item.genre,
        inCatalog: true
      }));
    setSuggestions(clientMatches);
  }, []);

  // Debounce user input
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    setIsOpen(true);
    setSelectedIndex(-1);

    const timer = setTimeout(() => {
      fetchSuggestions(query, category);
    }, 180);

    return () => clearTimeout(timer);
  }, [query, category, fetchSuggestions]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle item selection
  const handleSelect = (item) => {
    setIsOpen(false);
    setQuery('');

    if (item.inCatalog && item.slug) {
      // In-catalog shows default to S01E01 immediately
      router.push(`/${item.slug}`);
    } else {
      // Autofill into generator
      const params = new URLSearchParams({
        title: item.title,
        type: item.type || 'tv',
        season: '1',
        episode: '1'
      });
      router.push(`/generate?${params.toString()}`);
    }
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        e.preventDefault();
        setIsOpen(false);
        router.push(`/generate?title=${encodeURIComponent(query.trim())}&season=1&episode=1`);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const getMediaIcon = (type) => {
    switch (type) {
      case 'movie':
        return <Clapperboard className="w-4 h-4 text-amber-400" />;
      case 'anime':
        return <Sparkles className="w-4 h-4 text-purple-400" />;
      default:
        return <Tv className="w-4 h-4 text-rose-400" />;
    }
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case 'movie':
        return 'Movie';
      case 'anime':
        return 'Anime';
      default:
        return 'TV Series';
    }
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'movie', label: '🎬 Movies' },
    { id: 'tv', label: '📺 Series' },
    { id: 'anime', label: '🎌 Anime' }
  ];

  return (
    <div ref={containerRef} className="relative w-full max-w-2xl mx-auto">
      {/* Category Filter Pills Above Input */}
      <div className="flex items-center gap-1.5 mb-2.5 px-1 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mr-1 hidden sm:inline">
          Format:
        </span>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
              category === cat.id
                ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                : 'bg-cinema-card/70 text-slate-400 hover:text-white border border-cinema-border/60 hover:bg-white/5'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4.5 text-slate-400 pointer-events-none flex items-center">
          <Search className="w-5 h-5 text-rose-500" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-12 pr-12 py-4 bg-cinema-card/95 text-white placeholder-slate-400 rounded-2xl border border-cinema-border/90 focus:border-rose-500/80 focus:ring-4 focus:ring-rose-500/15 transition-all duration-300 shadow-2xl backdrop-blur-md text-base"
        />
        {loading ? (
          <div className="absolute right-4 text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          </div>
        ) : query ? (
          <button
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-4 text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {/* Rich Dropdown Suggestions */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-cinema-surface border border-cinema-border rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-cinema-border/40 animate-in fade-in slide-in-from-top-2 duration-200 max-h-[460px] overflow-y-auto">
          {/* Header Bar */}
          <div className="px-4 py-2 bg-cinema-card/90 border-b border-cinema-border/60 flex items-center justify-between text-[11px] font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 uppercase font-mono tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              Instant Search Results
            </span>
            <span className="text-[10px] text-emerald-400 font-normal">
              Series • Anime • Movies • Story-Book
            </span>
          </div>

          {/* Suggestions List */}
          {suggestions.length > 0 ? (
            suggestions.map((item, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={`${item.title}-${idx}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full px-4 sm:px-5 py-3 flex items-center justify-between text-left transition group border-b border-cinema-border/25 last:border-b-0 cursor-pointer ${
                    isSelected ? 'bg-rose-500/15' : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-cinema-card flex items-center justify-center border border-white/5 shrink-0 group-hover:scale-105 transition">
                      {getMediaIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white group-hover:text-rose-400 transition truncate">
                          {item.title}
                        </span>
                        {item.titleHindi && (
                          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                            ({item.titleHindi})
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10 shrink-0">
                          {getTypeLabel(item.type)}
                        </span>
                        {item.inCatalog ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 shrink-0 font-medium">
                            <CheckCircle2 className="w-2.5 h-2.5" /> Ready (S1E1)
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 shrink-0 font-medium">
                            Full Guide & Book
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                        {item.platform ? `${item.platform} • ` : ''}
                        {item.genre || item.tag}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(false);
                        setQuery('');
                        const params = new URLSearchParams({
                          title: item.title,
                          type: item.type || 'tv',
                          season: '1',
                          episode: '1',
                          mode: 'storybook'
                        });
                        router.push(`/generate?${params.toString()}`);
                      }}
                      title="Read entire Start-to-End Story-Book with 0% fillers"
                      className="px-2.5 py-1 rounded-lg bg-amber-500/15 hover:bg-amber-500 text-amber-300 hover:text-cinema-black border border-amber-500/30 text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <span>📖 Book Mode</span>
                    </button>
                    <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-rose-400 transition group-hover:translate-x-0.5">
                      <span className="hidden md:inline font-medium">
                        {item.inCatalog ? 'Timeline' : 'Recap'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          ) : !loading ? (
            <div className="p-6 text-center text-slate-400 space-y-3">
              <p className="text-sm">
                No pre-indexed matches for &ldquo;<span className="text-white font-medium">{query}</span>&rdquo;
              </p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  router.push(`/generate?title=${encodeURIComponent(query.trim())}&season=1&episode=1`);
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 text-white text-xs font-bold hover:opacity-90 transition shadow-lg"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Synthesize Zero-Spoiler Recap for &ldquo;{query}&rdquo; S1E1 →
              </button>
            </div>
          ) : null}
        </div>
      )}

      {/* Quick Search Chips Below Input */}
      {showQuickChips && (
        <div className="mt-3.5 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-400">
          <span className="flex items-center gap-1 text-[11px] font-mono uppercase text-slate-500 mr-1">
            <Flame className="w-3 h-3 text-amber-500" /> Hot:
          </span>
          {['Stranger Things', 'Attack on Titan', 'The Boys', 'Inception', 'Game of Thrones', 'The Family Man', 'Mirzapur'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setQuery(item);
                fetchSuggestions(item, 'all');
                setIsOpen(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-cinema-card/80 border border-cinema-border/80 hover:border-rose-500/50 hover:text-white transition text-[11px]"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
