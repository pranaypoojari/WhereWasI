'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Film, Compass, Vote, Sparkles, ShieldCheck, Menu, X, Wand2 } from 'lucide-react';
import ShinyText from './reactbits/ShinyText';
import Magnet from './reactbits/Magnet';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: '/', label: 'Shows', icon: Film },
    { href: '/generate', label: 'AI Generator', icon: Wand2, highlight: true },
    { href: '/browse', label: 'Browse', icon: Compass },
    { href: '/request', label: 'Request', icon: Vote },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-cinema-border/80 bg-cinema-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-rose-500 to-amber-500 p-0.5 shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition duration-300">
            <div className="w-full h-full bg-cinema-black rounded-[10px] flex items-center justify-center">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 group-hover:scale-110 transition duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white">
                Where<span className="text-brand-500">Was</span>I
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/25">
                <ShieldCheck className="w-3 h-3" /> Zero Spoilers
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium -mt-0.5 hidden xs:block">
              Catch up without spoilers
            </p>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                  isActive
                    ? 'text-white bg-white/10 shadow-sm border border-white/10'
                    : item.highlight
                    ? 'text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-400' : item.highlight ? 'text-rose-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-brand-500 rounded-full" />
                )}
              </Link>
            );
          })}

          <div className="ml-2">
            <Magnet padding={20} magnetStrength={3}>
              <Link
                href="/generate"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500/20 to-purple-500/20 border border-rose-500/30 text-rose-300 hover:border-rose-400 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
                <ShinyText className="font-semibold text-xs">AI Recap</ShinyText>
              </Link>
            </Magnet>
          </div>
        </nav>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
          <Link
            href="/generate"
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span>AI</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-cinema-card border border-cinema-border text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-rose-400" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-cinema-border/70 bg-cinema-black/95 backdrop-blur-2xl px-4 py-4 space-y-2 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition ${
                  isActive
                    ? 'bg-rose-500/20 text-white border border-rose-500/40 font-bold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.highlight && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-500/40">
                    AI Powered
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
