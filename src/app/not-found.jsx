'use client';
import Link from 'next/link';
import { Film, Wand2, Compass, ArrowLeft, ShieldAlert } from 'lucide-react';
import ShinyText from '@/components/reactbits/ShinyText';
import Magnet from '@/components/reactbits/Magnet';

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 text-center">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-2xl shadow-rose-500/20">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>

        <div className="space-y-3">
          <span className="text-xs font-mono uppercase tracking-widest text-rose-400 font-bold">
            Timeline Disruption (404)
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Lost in the <ShinyText className="bg-gradient-to-r from-rose-400 via-rose-200 to-rose-400 bg-clip-text text-transparent">Upside Down?</ShinyText>
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-md mx-auto">
            This title hasn&apos;t been cataloged in our curated vault yet. But you can synthesize a 100% zero-spoiler timeline on demand using our AI Engine!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Magnet padding={15} magnetStrength={2}>
            <Link
              href="/generate"
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold text-sm shadow-xl shadow-rose-500/25 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <Wand2 className="w-4 h-4" />
              <span>Generate With AI Engine</span>
            </Link>
          </Magnet>

          <Link
            href="/browse"
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-cinema-card border border-cinema-border hover:border-white/20 text-slate-300 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-2"
          >
            <Compass className="w-4 h-4" />
            <span>Browse Vault</span>
          </Link>
        </div>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
