'use client';
import { useState, useEffect } from 'react';
import SpotlightCard from '@/components/reactbits/SpotlightCard';
import confetti from 'canvas-confetti';
import { Vote, Plus, ThumbsUp, Sparkles, CheckCircle2, Tv, ShieldCheck } from 'lucide-react';
import ShinyText from '@/components/reactbits/ShinyText';

export default function RequestPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [platform, setPlatform] = useState('Prime Video');
  const [genre, setGenre] = useState('Crime / Thriller');
  const [requestedBy, setRequestedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  async function fetchRequests() {
    try {
      const res = await fetch('/api/requests');
      const data = await res.json();
      if (data.requests) {
        setRequests(data.requests);
      }
    } catch (err) {
      console.error('Failed fetching requests:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleVote = async (id) => {
    // Optimistic UI update
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, votes: r.votes + 1 } : r))
    );

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.8 }
    });

    try {
      await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'vote', id })
      });
    } catch (err) {
      console.error('Error voting:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          platform,
          genre,
          requestedBy: requestedBy || 'Anonymous Watcher'
        })
      });
      const data = await res.json();
      if (data.request) {
        setRequests((prev) => [data.request, ...prev]);
        setTitle('');
        setRequestedBy('');
        setShowForm(false);
        confetti({
          particleCount: 40,
          spread: 70
        });
      }
    } catch (err) {
      console.error('Failed creating request:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 font-mono mb-2">
            <Vote className="w-3.5 h-3.5" />
            <span>Community Voting Board</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Vote For The Next Show
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Top voted shows get full zero-spoiler timelines, character boards, and relationship webs created next.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          <span>{showForm ? 'Close Form' : 'Request A New Show'}</span>
        </button>
      </div>

      {/* Submission Form Modal/Card */}
      {showForm && (
        <SpotlightCard className="p-6 sm:p-8 border-rose-500/40 animate-in fade-in slide-in-from-top-3 duration-300">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Submit a Show for Recap Indexing
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Show Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Asur, Family Man Season 3, Farzi..."
                  className="w-full px-4 py-2.5 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Streaming Platform
                </label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                >
                  <option value="Prime Video">Prime Video</option>
                  <option value="Netflix">Netflix</option>
                  <option value="JioCinema">JioCinema</option>
                  <option value="SonyLIV">SonyLIV</option>
                  <option value="Hotstar">Disney+ Hotstar</option>
                  <option value="Crunchyroll">Crunchyroll</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Genre
                </label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="e.g. Mystery / Thriller"
                  className="w-full px-4 py-2.5 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 uppercase mb-1">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="e.g. Cinephile99"
                  className="w-full px-4 py-2.5 rounded-xl bg-cinema-black border border-cinema-border text-white text-sm focus:border-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl bg-cinema-black text-slate-400 hover:text-white text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Show Request'}
              </button>
            </div>
          </form>
        </SpotlightCard>
      )}

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-mono text-sm animate-pulse">
            Loading community requests...
          </div>
        ) : requests.length > 0 ? (
          requests.map((req, index) => (
            <SpotlightCard
              key={req.id}
              className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
              spotlightColor="rgba(244, 63, 94, 0.1)"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-cinema-black border border-cinema-border flex items-center justify-center text-rose-400 font-mono font-bold text-sm shrink-0">
                  #{index + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-white">
                      {req.title}
                    </h3>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                      {req.platform}
                    </span>
                    {req.status === 'in-progress' && (
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold">
                        Building Timeline 🔨
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Genre: {req.genre} • Requested by{' '}
                    <span className="text-slate-300 font-medium">{req.requestedBy}</span>
                  </p>
                </div>
              </div>

              {/* Upvote Button */}
              <div className="flex items-center gap-3 justify-end sm:justify-center">
                <div className="text-right">
                  <span className="text-xs text-slate-400 font-mono block">Votes</span>
                  <span className="text-lg font-black text-white font-mono">
                    {req.votes}
                  </span>
                </div>
                <button
                  onClick={() => handleVote(req.id)}
                  className="px-4 py-2.5 rounded-xl bg-cinema-black hover:bg-rose-500/20 text-slate-200 hover:text-rose-400 border border-cinema-border hover:border-rose-500/40 flex items-center gap-1.5 font-bold text-xs transition group"
                >
                  <ThumbsUp className="w-4 h-4 group-hover:scale-110 transition" />
                  <span>Upvote</span>
                </button>
              </div>
            </SpotlightCard>
          ))
        ) : (
          <p className="text-center text-slate-400 py-12">No requests yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}
