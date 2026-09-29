'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import SpotlightCard from './reactbits/SpotlightCard';
import { PlayCircle, ShieldCheck, Tv, Film } from 'lucide-react';

export default function ShowCard({ show }) {
  const [imgError, setImgError] = useState(false);

  // Gradient themes based on show slug
  const gradients = {
    'mirzapur': 'from-rose-950 via-red-900 to-cinema-black',
    'panchayat': 'from-emerald-950 via-teal-900 to-cinema-black',
    'breaking-bad': 'from-amber-950 via-yellow-900 to-cinema-black'
  };

  const bgGradient = gradients[show.slug] || 'from-rose-950 via-cinema-card to-cinema-black';

  return (
    <Link href={`/${show.slug}`} className="group block h-full">
      <SpotlightCard
        className="h-full flex flex-col group-hover:border-rose-500/50 group-hover:shadow-2xl group-hover:shadow-rose-500/10 transition-all duration-300"
        spotlightColor="rgba(244, 63, 94, 0.18)"
        borderColor="rgba(244, 63, 94, 0.4)"
      >
        {/* Poster / Banner Header */}
        <div className={`relative h-56 w-full overflow-hidden bg-gradient-to-br ${bgGradient} flex flex-col justify-between p-4`}>
          {!imgError && (show.posterUrl || show.bannerUrl) ? (
            <Image
              src={show.posterUrl || show.bannerUrl}
              alt={show.title}
              fill
              unoptimized
              onError={() => setImgError(true)}
              className="object-cover group-hover:scale-105 transition-transform duration-500 brightness-90 group-hover:brightness-100"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            /* Stylized Film Poster Fallback when remote image is unreachable */
            <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-cinema-surface/70 to-transparent flex items-center justify-center pointer-events-none">
              <div className="text-center p-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-2 text-rose-500 shadow-xl group-hover:scale-110 transition duration-300">
                  <Film className="w-8 h-8" />
                </div>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 font-bold">
                  {show.platform} Original
                </span>
              </div>
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-cinema-card via-cinema-card/30 to-transparent pointer-events-none" />

          {/* Top Badges */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-full bg-cinema-black/85 backdrop-blur-md text-slate-200 border border-white/10 flex items-center gap-1.5 shadow">
              <Tv className="w-3 h-3 text-rose-400" />
              {show.platform}
            </span>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 backdrop-blur-md shadow">
              <ShieldCheck className="w-3 h-3" /> Zero Spoilers
            </span>
          </div>

          {/* Bottom title & Play Button */}
          <div className="relative z-10 flex items-end justify-between">
            <div>
              <span className="text-xs text-rose-400 font-mono tracking-wider font-semibold">
                {show.totalSeasons} SEASONS • {show.totalEpisodes} EPS
              </span>
              <h3 className="text-2xl font-black text-white tracking-tight group-hover:text-rose-400 transition-colors drop-shadow-md">
                {show.title}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/40 group-hover:scale-110 group-hover:bg-rose-400 transition shrink-0">
              <PlayCircle className="w-6 h-6 fill-white/20" />
            </div>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {show.synopsis}
          </p>

          <div className="space-y-3">
            {/* Genres */}
            <div className="flex flex-wrap gap-1.5">
              {show.genre?.slice(0, 3).map((g) => (
                <span
                  key={g}
                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/5"
                >
                  {g}
                </span>
              ))}
            </div>

            {/* Bottom metadata */}
            <div className="pt-2 border-t border-cinema-border/50 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-mono">
                <Film className="w-3.5 h-3.5 text-slate-400" />
                {show.language}
              </span>
              <span className="text-rose-400/90 font-medium group-hover:translate-x-0.5 transition font-semibold">
                Recap by Episode →
              </span>
            </div>
          </div>
        </div>
      </SpotlightCard>
    </Link>
  );
}
