'use client';
import { useState } from 'react';
import confetti from 'canvas-confetti';
import { Share2, X, Download, Copy, Check, Sparkles, MessageCircle, Send } from 'lucide-react';
import ShinyText from './reactbits/ShinyText';

export default function ShareCardModal({ isOpen, onClose, showTitle, season, episode, quote }) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState('crimson'); // 'crimson', 'neon', 'gold'

  if (!isOpen) return null;

  const shareText = `I'm resuming ${showTitle} from Season ${season}, Episode ${episode} on WhereWasI with zero spoilers! 🎬`;

  const handleCopy = () => {
    navigator.clipboard.writeText(`${shareText} https://wherewasi.in`);
    setCopied(true);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });
    setTimeout(() => setCopied(false), 2500);
  };

  const handleWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} Check it out: https://wherewasi.in`)}`;
    window.open(url, '_blank');
  };

  const handleTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=https://wherewasi.in`;
    window.open(url, '_blank');
  };

  const themes = {
    crimson: 'from-rose-950 via-cinema-card to-cinema-black border-rose-500/40 text-rose-400',
    neon: 'from-indigo-950 via-cinema-card to-cinema-black border-indigo-500/40 text-indigo-400',
    gold: 'from-amber-950 via-cinema-card to-cinema-black border-amber-500/40 text-amber-400'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cinema-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-cinema-card border border-cinema-border rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-cinema-black/60 text-slate-400 hover:text-white hover:bg-cinema-black transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-rose-400" />
          <h3 className="text-lg font-bold text-white">Shareable Catch-up Card</h3>
        </div>

        {/* Theme Picker */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-slate-400 font-mono">Theme:</span>
          {['crimson', 'neon', 'gold'].map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition ${
                theme === t
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* The Viral Share Card (Story / Post aspect) */}
        <div
          id="share-card-node"
          className={`relative rounded-2xl bg-gradient-to-br ${themes[theme]} border p-6 text-center shadow-2xl overflow-hidden aspect-[4/5] flex flex-col justify-between`}
        >
          {/* Subtle noise/mesh background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand Watermark */}
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="font-bold text-white tracking-wider">WhereWasI.in</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-white text-[10px]">
              ZERO SPOILERS
            </span>
          </div>

          {/* Center Announcement */}
          <div className="my-auto space-y-3">
            <span className="text-xs uppercase tracking-widest text-slate-300 font-mono">
              Currently Resuming
            </span>
            <h2 className="text-3xl font-black text-white tracking-tight drop-shadow">
              {showTitle}
            </h2>

            <div className="inline-block px-4 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                S{String(season).padStart(2, '0')}E{String(episode).padStart(2, '0')}
              </span>
            </div>

            {quote && (
              <p className="text-xs font-serif italic text-slate-300 max-w-xs mx-auto line-clamp-2 px-2 pt-2">
                &ldquo;{quote.text}&rdquo;
              </p>
            )}
          </div>

          {/* Footer of Card */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Locked to Episode {episode}</span>
            <span className="text-white font-semibold">100% Caught Up 🎬</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={handleTwitter}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition"
            >
              <Send className="w-4 h-4" />
              <span>Share to X</span>
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="w-full py-3 rounded-xl bg-cinema-black hover:bg-white/10 text-white font-semibold text-xs border border-cinema-border flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Shareable Link & Status</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
