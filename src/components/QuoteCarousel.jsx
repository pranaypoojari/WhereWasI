'use client';
import { useState } from 'react';
import SpotlightCard from './reactbits/SpotlightCard';
import { MessageSquareQuote, Copy, Check } from 'lucide-react';

export default function QuoteCarousel({ quotes = [] }) {
  const [copiedIdx, setCopiedIdx] = useState(null);

  if (!quotes || quotes.length === 0) return null;

  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareQuote className="w-5 h-5 text-amber-400" />
        <h3 className="text-xl font-bold text-white tracking-tight">
          Memorable Quotes Up To This Episode
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((q, i) => (
          <SpotlightCard
            key={i}
            className="p-5 flex flex-col justify-between"
            spotlightColor="rgba(245, 158, 11, 0.12)"
            borderColor="rgba(245, 158, 11, 0.3)"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <p className="text-sm sm:text-base font-serif italic text-amber-100/90 leading-relaxed">
                &ldquo;{q.text}&rdquo;
              </p>
              <button
                onClick={() => handleCopy(q.text, i)}
                className="p-1.5 rounded-lg bg-cinema-black text-slate-400 hover:text-white border border-cinema-border transition shrink-0"
                title="Copy quote"
              >
                {copiedIdx === i ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-cinema-border/50 text-slate-400">
              <span className="font-semibold text-rose-400">— {q.by}</span>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                {q.episode}
              </span>
            </div>
          </SpotlightCard>
        ))}
      </div>
    </div>
  );
}
