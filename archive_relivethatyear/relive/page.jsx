import { getAllEras } from '@/lib/dataService';
import RetroEraSimulator from '@/components/RetroEraSimulator';

export const metadata = {
  title: 'Relive That Year (2006–2024) — WhereWasI',
  description: 'Dial back time to any year. What movies were in theatres, what was the price of Maggi, what was playing on 9XM, and what was the slang?',
};

export default async function RelivePage({ searchParams }) {
  const eras = await getAllEras();
  const initialEraId = searchParams?.era || '2016-05';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="space-y-3 text-center sm:text-left">
        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          🌍 MODE 1: RELIVE THAT YEAR (THE ERA TIME MACHINE)
        </span>
        <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
          Freeze Time in Any Year (2006 to 2024)
        </h1>
        <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
          Drag the master dial to freeze the entire world at any moment. Relive the #1 song, the movies on cinema screens, the slang on everyone&apos;s lips, and the shows airing that exact month.
        </p>
      </div>

      <RetroEraSimulator eras={eras} initialEraId={initialEraId} />
    </div>
  );
}
