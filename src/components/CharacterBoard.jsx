'use client';
import { useState } from 'react';
import Image from 'next/image';
import SpotlightCard from './reactbits/SpotlightCard';
import { STATUS_COLORS } from '@/lib/constants';
import { Users, Info, X, ShieldAlert, Award, Filter, User } from 'lucide-react';

function CharacterAvatar({ name, avatar, status, isDead }) {
  const [imgError, setImgError] = useState(false);
  const initial = name ? name.trim().charAt(0).toUpperCase() : '?';

  // Palette based on character name
  const bgColors = [
    'from-rose-900 to-rose-950',
    'from-indigo-900 to-slate-950',
    'from-amber-900 to-yellow-950',
    'from-emerald-900 to-teal-950',
    'from-purple-900 to-violet-950'
  ];
  const charCode = name.charCodeAt(0) % bgColors.length;
  const gradient = bgColors[charCode];

  if (!avatar || imgError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} text-white font-black text-3xl select-none relative shadow-inner`}>
        <span>{initial}</span>
        <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest font-normal opacity-80">
          {name.split(' ')[0]}
        </span>
      </div>
    );
  }

  return (
    <Image
      src={avatar}
      alt={name}
      fill
      unoptimized
      onError={() => setImgError(true)}
      className={`object-cover transition duration-500 ${
        isDead ? 'grayscale contrast-125 group-hover:scale-105' : 'group-hover:scale-105'
      }`}
      sizes="(max-width: 768px) 50vw, 25vw"
    />
  );
}

export default function CharacterBoard({ characters = [], season, episode }) {
  const [selectedChar, setSelectedChar] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filteredCharacters = characters.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter pills */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-rose-500" />
            <h3 className="text-xl font-bold text-white tracking-tight">
              Character Status Board
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Strictly synced to S{String(season).padStart(2, '0')}E{String(episode).padStart(2, '0')}. Click any card for character backstory.
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-cinema-card p-1 rounded-2xl border border-cinema-border overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 text-xs font-semibold rounded-xl transition shrink-0 ${
              statusFilter === 'ALL'
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({characters.length})
          </button>
          {['alive', 'dead', 'injured', 'missing', 'betrayed'].map((st) => {
            const count = characters.filter((c) => c.status === st).length;
            if (count === 0) return null;
            const style = STATUS_COLORS[st];
            return (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition shrink-0 ${
                  statusFilter === st
                    ? `${style.bg} ${style.text} border ${style.border} shadow-sm`
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>{style.icon}</span>
                <span className="capitalize">{st}</span>
                <span className="opacity-60 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid of Characters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredCharacters.map((char) => {
          const style = STATUS_COLORS[char.status] || STATUS_COLORS.alive;

          return (
            <button
              key={char.id}
              onClick={() => setSelectedChar(char)}
              className="text-left group focus:outline-none"
            >
              <SpotlightCard
                className={`h-full p-3 sm:p-4 transition-all duration-300 border ${style.border} hover:border-rose-500/60 hover:-translate-y-1 hover:shadow-xl`}
                spotlightColor="rgba(244, 63, 94, 0.12)"
              >
                {/* Character Photo / Avatar with Fallback */}
                <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-cinema-black mb-3 border border-cinema-border/60">
                  <CharacterAvatar
                    name={char.name}
                    avatar={char.avatar}
                    status={char.status}
                    isDead={char.status === 'dead'}
                  />

                  {/* Status Overlay Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <span
                      className={`text-[9px] sm:text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border shadow-lg backdrop-blur-md flex items-center gap-1 ${style.bg} ${style.text} ${style.border}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-current" />
                      {style.label}
                    </span>
                  </div>

                  {char.status === 'dead' && (
                    <div className="absolute inset-0 bg-rose-950/40 mix-blend-multiply pointer-events-none z-10" />
                  )}
                </div>

                {/* Name & Role */}
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-rose-400 transition line-clamp-1">
                    {char.name}
                  </h4>
                  {char.aliases && char.aliases.length > 0 && (
                    <p className="text-[10px] sm:text-[11px] text-slate-400 line-clamp-1 italic">
                      &ldquo;{char.aliases[0]}&rdquo;
                    </p>
                  )}
                  <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5 line-clamp-1 font-mono">
                    {char.role}
                  </p>

                  {/* Episode note */}
                  <div className="mt-2 pt-2 border-t border-cinema-border/50 text-[10px] text-slate-300 line-clamp-2">
                    <span className="text-slate-500 font-mono">Status: </span>
                    {char.note}
                  </div>
                </div>
              </SpotlightCard>
            </button>
          );
        })}
      </div>

      {/* Character Detail Modal */}
      {selectedChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cinema-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-cinema-card border border-cinema-border rounded-3xl p-6 shadow-2xl overflow-hidden">
            <button
              onClick={() => setSelectedChar(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-cinema-black/60 text-slate-400 hover:text-white hover:bg-cinema-black transition z-20"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex gap-4 items-start">
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden shrink-0 border border-cinema-border">
                <CharacterAvatar
                  name={selectedChar.name}
                  avatar={selectedChar.avatar}
                  status={selectedChar.status}
                  isDead={selectedChar.status === 'dead'}
                />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {selectedChar.name}
                  </h3>
                  {selectedChar.status && (
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        STATUS_COLORS[selectedChar.status]?.bg
                      } ${STATUS_COLORS[selectedChar.status]?.text} ${
                        STATUS_COLORS[selectedChar.status]?.border
                      }`}
                    >
                      {STATUS_COLORS[selectedChar.status]?.label}
                    </span>
                  )}
                </div>
                {selectedChar.aliases && (
                  <p className="text-xs text-rose-400 font-medium">
                    Also known as: {selectedChar.aliases.join(', ')}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  {selectedChar.role}
                </p>
              </div>
            </div>

            <div className="mt-5 p-4 rounded-2xl bg-cinema-black/60 border border-cinema-border/60">
              <span className="text-[11px] font-mono uppercase tracking-wider text-rose-400 block mb-1">
                State as of S{String(season).padStart(2, '0')}E{String(episode).padStart(2, '0')}:
              </span>
              <p className="text-sm text-slate-200 leading-relaxed">
                {selectedChar.note}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-cinema-border/40 font-mono">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldAlert className="w-3.5 h-3.5" /> Locked to S{season}E{episode}
              </span>
              <span>WhereWasI Character Vault</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
