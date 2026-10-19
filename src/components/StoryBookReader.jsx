'use client';
import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import {
  Play,
  Pause,
  Square,
  Settings2,
  ChevronRight,
  Clock,
  Zap,
  Scissors,
  Sparkles,
  Flag,
  Link2,
  Check,
  X,
  Minus,
  Plus,
  BookMarked,
  Headphones,
  Type,
  Palette
} from 'lucide-react';
import {
  normalizeStoryBook,
  toBionicSegments,
  toSpeechChunks,
  copyTextToClipboard,
  WORDS_PER_MINUTE
} from '@/lib/storyBookUtils';

const SETTINGS_KEY = 'wherewasi:reader-settings:v1';
const READER_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&family=Merriweather:wght@400;700&display=swap';
const positionKey = (slug) => `wherewasi:reader-position:${slug || 'unknown'}`;

const FONT_OPTIONS = [
  {
    id: 'serif',
    label: 'Serif',
    stack: 'Merriweather, Georgia, "Times New Roman", serif'
  },
  {
    id: 'sans',
    label: 'Sans',
    stack: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  },
  {
    id: 'dyslexic',
    label: 'Dyslexic-friendly',
    stack: 'Lexend, Verdana, Tahoma, sans-serif',
    letterSpacing: '0.04em',
    wordSpacing: '0.16em'
  },
  {
    id: 'mono',
    label: 'Mono',
    stack: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace'
  }
];

const THEMES = {
  obsidian: {
    label: 'Cinema Obsidian',
    bg: '#0b0f17',
    surface: '#111827',
    text: '#e2e8f0',
    muted: '#94a3b8',
    accent: '#fb7185',
    border: 'rgba(148, 163, 184, 0.18)',
    highlight: 'rgba(244, 63, 94, 0.14)'
  },
  sepia: {
    label: 'Warm Sepia',
    bg: '#f4ecd8',
    surface: '#ebdfc3',
    text: '#433422',
    muted: '#7a6548',
    accent: '#b45309',
    border: 'rgba(120, 90, 50, 0.25)',
    highlight: 'rgba(180, 83, 9, 0.14)'
  },
  midnight: {
    label: 'Midnight Slate',
    bg: '#0f172a',
    surface: '#1e293b',
    text: '#cbd5e1',
    muted: '#94a3b8',
    accent: '#38bdf8',
    border: 'rgba(148, 163, 184, 0.2)',
    highlight: 'rgba(56, 189, 248, 0.14)'
  },
  paper: {
    label: 'Paper White',
    bg: '#ffffff',
    surface: '#f8fafc',
    text: '#1f2937',
    muted: '#6b7280',
    accent: '#e11d48',
    border: 'rgba(15, 23, 42, 0.12)',
    highlight: 'rgba(225, 29, 72, 0.1)'
  }
};

const SPEEDS = [1, 1.25, 1.5, 2];
const LINE_HEIGHTS = [
  { value: 1.5, label: 'Compact' },
  { value: 1.75, label: 'Relaxed' },
  { value: 2, label: 'Airy' }
];
const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 26;
const FONT_SIZE_STEP = 2;

const DEFAULT_SETTINGS = {
  font: 'serif',
  fontSize: 18,
  lineHeight: 1.75,
  theme: 'obsidian',
  bionic: false,
  rate: 1,
  voiceURI: ''
};

function readStorage(key) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Private mode / quota exceeded: persistence is best-effort
  }
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const ReaderText = memo(function ReaderText({ text, bionic }) {
  if (!bionic) return text;
  return toBionicSegments(text).map((seg, i) =>
    seg.lead ? (
      <span key={i}>
        {seg.prefix}
        <b className="font-bold">{seg.lead}</b>
        {seg.rest}
      </span>
    ) : (
      <span key={i}>{seg.rest}</span>
    )
  );
});

export default function StoryBookReader({
  storyBook: rawStoryBook,
  showTitle = '',
  slug = '',
  shareBasePath
}) {
  const book = useMemo(() => normalizeStoryBook(rawStoryBook), [rawStoryBook]);
  const chapters = useMemo(() => book?.chapters || [], [book]);

  const [isMounted, setIsMounted] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

  const [activeIdx, setActiveIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const [savedPosition, setSavedPosition] = useState(null);
  const [toast, setToast] = useState('');

  const [ttsSupported, setTtsSupported] = useState(false);
  const [voices, setVoices] = useState([]);
  const [ttsStatus, setTtsStatus] = useState('idle'); // 'idle' | 'playing' | 'paused'
  const [speakingKey, setSpeakingKey] = useState(null); // `${chapterIdx}:${itemKey}`

  const containerRef = useRef(null);
  const chapterRefs = useRef([]);
  const sessionRef = useRef(0);
  const cursorRef = useRef({ c: 0, i: 0, k: 0 });
  const settingsRef = useRef(settings);
  const voicesRef = useRef([]);
  const toastTimer = useRef(null);
  const closeButtonRef = useRef(null);

  settingsRef.current = settings;
  voicesRef.current = voices;
  chapterRefs.current.length = chapters.length;

  const theme = THEMES[settings.theme] || THEMES.obsidian;
  const font = FONT_OPTIONS.find((f) => f.id === settings.font) || FONT_OPTIONS[0];

  // Reader typefaces load only once the reader mounts, so they never touch other pages' LCP.
  // If the stylesheet is blocked the font stacks fall back to Georgia / Verdana.
  useEffect(() => {
    if (document.getElementById('wherewasi-reader-fonts')) return;
    const link = document.createElement('link');
    link.id = 'wherewasi-reader-fonts';
    link.rel = 'stylesheet';
    link.href = READER_FONTS_HREF;
    document.head.appendChild(link);
  }, []);

  // ---------- Settings persistence ----------
  useEffect(() => {
    setIsMounted(true);
    const stored = readStorage(SETTINGS_KEY);
    if (stored && typeof stored === 'object') {
      setSettings((prev) => ({ ...prev, ...stored }));
    }
    setSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (settingsLoaded) writeStorage(SETTINGS_KEY, settings);
  }, [settings, settingsLoaded]);

  const updateSetting = useCallback((key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2200);
  }, []);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  // ---------- Scroll helpers ----------
  const scrollToChapter = useCallback(
    (idx, offset = 0, behavior = 'smooth') => {
      const el = chapterRefs.current[idx];
      if (!el) return;
      if (offset > 0) {
        const top = el.getBoundingClientRect().top + window.scrollY + offset;
        window.scrollTo({ top, behavior });
      } else {
        el.scrollIntoView({ behavior, block: 'start' });
      }
    },
    []
  );

  // Deep link (#chapter-N) takes priority; otherwise offer a "resume" chip from localStorage.
  useEffect(() => {
    if (chapters.length === 0) return;
    const hashMatch = window.location.hash.match(/^#chapter-(\d+)$/);
    if (hashMatch) {
      const idx = chapters.findIndex((ch) => ch.chapterNumber === Number(hashMatch[1]));
      if (idx >= 0) {
        requestAnimationFrame(() => scrollToChapter(idx, 0, 'auto'));
        return;
      }
    }
    const saved = readStorage(positionKey(slug));
    if (saved && saved.chapterId) {
      const idx = chapters.findIndex((ch) => ch.id === saved.chapterId);
      if (idx > 0 || (idx === 0 && saved.offset > 200)) {
        setSavedPosition({ ...saved, idx });
      }
    }
  }, [chapters, slug, scrollToChapter]);

  // Sticky bar is only shown while the reader is on screen.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0, rootMargin: '0px 0px -30% 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Progress, active chapter and debounced position saving.
  useEffect(() => {
    let frame = 0;
    let saveTimer = null;

    const measure = () => {
      frame = 0;
      const node = containerRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;
      const ratio = rect.height > 0 ? clamp((vh * 0.5 - rect.top) / rect.height, 0, 1) : 0;
      setProgress(ratio);

      let current = 0;
      chapterRefs.current.forEach((el, idx) => {
        if (el && el.getBoundingClientRect().top <= vh * 0.35) current = idx;
      });
      setActiveIdx(current);

      if (rect.top < vh && rect.bottom > 0) {
        clearTimeout(saveTimer);
        saveTimer = setTimeout(() => {
          const chapterEl = chapterRefs.current[current];
          const chapter = chapters[current];
          if (!chapterEl || !chapter) return;
          const offset = Math.max(0, Math.round(-chapterEl.getBoundingClientRect().top));
          writeStorage(positionKey(slug), {
            slug,
            chapterId: chapter.id,
            offset,
            progress: Math.round(ratio * 100),
            updatedAt: Date.now()
          });
        }, 400);
      }
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
      clearTimeout(saveTimer);
    };
  }, [chapters, slug]);

  // ---------- Deep links ----------
  const buildChapterUrl = useCallback(
    (chapter) => {
      const base = shareBasePath || `/${slug}?mode=book`;
      const url = new URL(base, window.location.origin);
      url.hash = chapter.id;
      return url.toString();
    },
    [shareBasePath, slug]
  );

  const copyChapterLink = useCallback(
    async (chapter) => {
      const url = buildChapterUrl(chapter);
      const ok = await copyTextToClipboard(url);
      window.history.replaceState(window.history.state, '', `#${chapter.id}`);
      showToast(ok ? `Link to ${chapter.roman ? `Chapter ${chapter.roman}` : 'chapter'} copied` : url);
    },
    [buildChapterUrl, showToast]
  );

  // ---------- Text-to-Speech narrator ----------
  const speechPlan = useMemo(
    () =>
      chapters.map((ch, cIdx) => {
        const items = [{ key: 'title', chunks: [ch.title] }];
        ch.paragraphs.forEach((p, pIdx) => items.push({ key: `p${pIdx}`, chunks: toSpeechChunks(p) }));
        if (ch.keyTakeaway) {
          items.push({ key: 'takeaway', chunks: toSpeechChunks(`Key plot turn. ${ch.keyTakeaway}`) });
        }
        if (cIdx === chapters.length - 1 && book?.endingExplained) {
          items.push({ key: 'ending', chunks: toSpeechChunks(`Ending explained. ${book.endingExplained}`) });
        }
        return items;
      }),
    [chapters, book]
  );

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setTtsSupported(true);
    const synth = window.speechSynthesis;
    const loadVoices = () => {
      const list = synth.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('en'));
      setVoices(list);
    };
    loadVoices();
    synth.addEventListener?.('voiceschanged', loadVoices);
    return () => synth.removeEventListener?.('voiceschanged', loadVoices);
  }, []);

  const stopSpeech = useCallback(() => {
    sessionRef.current += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTtsStatus('idle');
    setSpeakingKey(null);
  }, []);

  const speakFrom = useCallback(
    (startChapter, startItem = 0, startChunk = 0) => {
      if (!('speechSynthesis' in window)) return;
      const synth = window.speechSynthesis;
      const session = ++sessionRef.current;
      synth.cancel();

      const run = (c, i, k) => {
        if (session !== sessionRef.current) return;
        const items = speechPlan[c];
        if (!items) {
          setTtsStatus('idle');
          setSpeakingKey(null);
          return;
        }
        const item = items[i];
        if (!item) {
          // Chapter finished: auto-advance to the next one and keep it on screen.
          if (speechPlan[c + 1]) scrollToChapter(c + 1);
          run(c + 1, 0, 0);
          return;
        }
        const chunk = item.chunks[k];
        if (chunk === undefined) {
          run(c, i + 1, 0);
          return;
        }

        cursorRef.current = { c, i, k };
        setSpeakingKey(`${c}:${item.key}`);

        const utterance = new SpeechSynthesisUtterance(chunk);
        const { rate, voiceURI } = settingsRef.current;
        const voice = voiceURI ? voicesRef.current.find((v) => v.voiceURI === voiceURI) : null;
        if (voice) {
          utterance.voice = voice;
          utterance.lang = voice.lang;
        } else {
          utterance.lang = 'en-US';
        }
        utterance.rate = rate;
        utterance.onend = () => run(c, i, k + 1);
        utterance.onerror = (event) => {
          if (event.error === 'interrupted' || event.error === 'canceled') return;
          run(c, i, k + 1);
        };
        synth.speak(utterance);
      };

      setTtsStatus('playing');
      run(startChapter, startItem, startChunk);
    },
    [speechPlan, scrollToChapter]
  );

  const togglePlayPause = useCallback(() => {
    if (!ttsSupported) return;
    const synth = window.speechSynthesis;
    if (ttsStatus === 'playing') {
      synth.pause();
      setTtsStatus('paused');
    } else if (ttsStatus === 'paused') {
      // Chrome drops paused utterances after ~15s; restart the current chunk if nothing resumes.
      const session = sessionRef.current;
      synth.resume();
      setTtsStatus('playing');
      setTimeout(() => {
        if (session === sessionRef.current && !synth.speaking && !synth.pending) {
          const { c, i, k } = cursorRef.current;
          speakFrom(c, i, k);
        }
      }, 250);
    } else {
      speakFrom(activeIdx, 0, 0);
    }
  }, [ttsSupported, ttsStatus, speakFrom, activeIdx]);

  const changeRate = useCallback(
    (rate) => {
      updateSetting('rate', rate);
      settingsRef.current = { ...settingsRef.current, rate };
      if (ttsStatus === 'playing') {
        const { c, i, k } = cursorRef.current;
        speakFrom(c, i, k);
      }
    },
    [updateSetting, ttsStatus, speakFrom]
  );

  // Stop narration when the book changes or the reader unmounts.
  useEffect(() => stopSpeech, [speechPlan, stopSpeech]);

  // ---------- Customizer modal: Escape to close, focus management ----------
  useEffect(() => {
    if (!isCustomizerOpen) return;
    closeButtonRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setIsCustomizerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isCustomizerOpen]);

  if (!book || chapters.length === 0) return null;

  const activeChapter = chapters[activeIdx] || chapters[0];
  const hasNextChapter = activeIdx < chapters.length - 1;
  const minutesLeft = Math.max(0, Math.ceil((book.totalWords * (1 - progress)) / WORDS_PER_MINUTE));
  const percentRead = Math.round(progress * 100);

  const textStyle = {
    fontFamily: font.stack,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight,
    letterSpacing: font.letterSpacing,
    wordSpacing: font.wordSpacing,
    color: theme.text
  };

  const paragraphStyle = (cIdx, key) =>
    speakingKey === `${cIdx}:${key}`
      ? { backgroundColor: theme.highlight, boxShadow: `-8px 0 0 ${theme.highlight}, 8px 0 0 ${theme.highlight}`, borderRadius: 6 }
      : undefined;

  return (
    <div
      ref={containerRef}
      className="relative rounded-3xl border pb-6 transition-colors duration-300"
      style={{ backgroundColor: theme.bg, borderColor: theme.border }}
      aria-label={`${showTitle} Story-Book reader`}
    >
      {/* Book header */}
      <header className="p-5 sm:p-8 space-y-4 border-b" style={{ borderColor: theme.border }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-mono uppercase tracking-wider" style={{ color: theme.accent }}>
              Story-Book • Start → End • Zero Fillers
            </span>
            <h3
              className="text-xl sm:text-2xl font-bold leading-snug"
              style={{ fontFamily: FONT_OPTIONS[0].stack, color: theme.text }}
            >
              {book.title}
            </h3>
            {book.subtitle && (
              <p className="text-sm" style={{ color: theme.muted }}>
                {book.subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {ttsSupported && (
              <button
                type="button"
                onClick={togglePlayPause}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition hover:opacity-90"
                style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }}
                aria-label={ttsStatus === 'playing' ? 'Pause narration' : 'Listen as audiobook'}
              >
                {ttsStatus === 'playing' ? <Pause className="w-4 h-4" /> : <Headphones className="w-4 h-4" />}
                <span>{ttsStatus === 'playing' ? 'Pause' : ttsStatus === 'paused' ? 'Resume' : 'Listen'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCustomizerOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition hover:opacity-90"
              style={{ borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }}
              aria-haspopup="dialog"
            >
              <Settings2 className="w-4 h-4" />
              <span>Aa Reader</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
          {book.fillersRemovedCount > 0 && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 inline-flex items-center gap-1">
              <Scissors className="w-3 h-3" /> {book.fillersRemovedCount} filler episodes skipped
            </span>
          )}
          {book.watchTimeSaved && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 inline-flex items-center gap-1">
              <Zap className="w-3 h-3" /> {book.watchTimeSaved}
            </span>
          )}
          <span
            className="px-2.5 py-1 rounded-full border inline-flex items-center gap-1 font-mono"
            style={{ borderColor: theme.border, color: theme.muted }}
          >
            <Clock className="w-3 h-3" /> ~{book.readingTimeMinutes} min read • {chapters.length} chapters
          </span>
        </div>

        {/* Table of contents */}
        <nav aria-label="Chapters" className="flex flex-wrap gap-2 pt-1">
          {chapters.map((ch, idx) => (
            <a
              key={ch.id}
              href={`#${ch.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToChapter(idx);
                window.history.replaceState(window.history.state, '', `#${ch.id}`);
              }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold border transition hover:opacity-80"
              style={{
                borderColor: idx === activeIdx ? theme.accent : theme.border,
                color: idx === activeIdx ? theme.accent : theme.muted
              }}
            >
              {ch.roman || ch.chapterNumber}
            </a>
          ))}
        </nav>

        {savedPosition && (
          <div
            className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border text-xs"
            style={{ borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
          >
            <span className="inline-flex items-center gap-2">
              <BookMarked className="w-4 h-4" style={{ color: theme.accent }} />
              You stopped in {chapters[savedPosition.idx]?.title || 'a previous chapter'} ({savedPosition.progress}% read)
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  scrollToChapter(savedPosition.idx, savedPosition.offset);
                  setSavedPosition(null);
                }}
                className="px-3 py-1 rounded-lg font-bold text-white"
                style={{ backgroundColor: theme.accent }}
              >
                Resume
              </button>
              <button
                type="button"
                onClick={() => setSavedPosition(null)}
                className="px-2 py-1 rounded-lg"
                style={{ color: theme.muted }}
                aria-label="Dismiss resume prompt"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          </div>
        )}
      </header>

      {/* Chapters */}
      <div className="px-5 sm:px-10 pt-6 space-y-10 max-w-3xl mx-auto">
        {chapters.map((chapter, cIdx) => (
          <article
            key={chapter.id}
            id={chapter.id}
            ref={(el) => {
              chapterRefs.current[cIdx] = el;
            }}
            className="scroll-mt-24 space-y-5"
            aria-labelledby={`${chapter.id}-title`}
          >
            <div className="flex items-start justify-between gap-3 pb-3 border-b" style={{ borderColor: theme.border }}>
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className="w-10 h-10 rounded-xl border font-black text-sm flex items-center justify-center shrink-0"
                  style={{ borderColor: theme.accent, color: theme.accent, fontFamily: FONT_OPTIONS[0].stack }}
                  aria-hidden="true"
                >
                  {chapter.roman || chapter.chapterNumber}
                </span>
                <div className="min-w-0">
                  <h4
                    id={`${chapter.id}-title`}
                    className="text-lg sm:text-xl font-bold leading-snug"
                    style={{ ...paragraphStyle(cIdx, 'title'), fontFamily: FONT_OPTIONS[0].stack, color: theme.text }}
                  >
                    {chapter.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono mt-1" style={{ color: theme.muted }}>
                    {chapter.episodesCovered && <span>Covers: {chapter.episodesCovered}</span>}
                    {chapter.arcBadge && <span className="text-emerald-500">{chapter.arcBadge}</span>}
                    <span>~{Math.max(1, Math.round(chapter.words / WORDS_PER_MINUTE))} min</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => copyChapterLink(chapter)}
                className="p-2 rounded-lg border shrink-0 transition hover:opacity-80"
                style={{ borderColor: theme.border, color: theme.muted }}
                title="Copy link to this chapter"
                aria-label={`Copy link to ${chapter.title}`}
              >
                <Link2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-5" style={textStyle}>
              {chapter.paragraphs.map((para, pIdx) => (
                <p key={pIdx} className="transition-colors" style={paragraphStyle(cIdx, `p${pIdx}`)}>
                  <ReaderText text={para} bionic={settings.bionic} />
                </p>
              ))}
            </div>

            {chapter.keyTakeaway && (
              <div
                className="p-4 rounded-xl border text-sm flex items-start gap-2"
                style={{ ...paragraphStyle(cIdx, 'takeaway'), borderColor: theme.border, backgroundColor: theme.surface, color: theme.text }}
              >
                <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: theme.accent }} />
                <div>
                  <span className="font-bold" style={{ color: theme.accent }}>
                    Key Plot Turn:{' '}
                  </span>
                  <ReaderText text={chapter.keyTakeaway} bionic={settings.bionic} />
                </div>
              </div>
            )}
          </article>
        ))}

        {book.endingExplained && (
          <section
            className="p-5 sm:p-6 rounded-2xl border space-y-2"
            style={{ ...paragraphStyle(chapters.length - 1, 'ending'), borderColor: theme.accent, backgroundColor: theme.surface }}
          >
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider font-bold" style={{ color: theme.accent }}>
              <Flag className="w-4 h-4" />
              <span>Final Climax & True Ending Explained</span>
            </div>
            <p style={textStyle}>
              <ReaderText text={book.endingExplained} bionic={settings.bionic} />
            </p>
          </section>
        )}
      </div>

      {/* Fixed UI is portalled to <body> so ancestor stacking contexts (cards, navbar) can't clip or cover it */}
      {isMounted &&
        createPortal(
          <div>
          {/* Floating sticky progress bar */}
          <div
            className={`fixed inset-x-0 bottom-0 z-40 px-3 sm:px-6 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-all duration-300 ${
              isInView ? 'visible translate-y-0 opacity-100' : 'invisible translate-y-full opacity-0 pointer-events-none'
            }`}
            aria-hidden={!isInView}
          >
            <div className="max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#0b0f17]/90 backdrop-blur-xl shadow-2xl shadow-black/50 overflow-hidden">
              <div className="h-1 bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-amber-400 transition-[width] duration-150"
                  style={{ width: `${percentRead}%` }}
                />
              </div>
              <div className="flex items-center gap-3 px-3 sm:px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{activeChapter.title}</p>
                  <p className="text-[11px] font-mono text-slate-400">
                    {percentRead}% read • {minutesLeft} min left
                  </p>
                </div>

                {ttsSupported && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={togglePlayPause}
                      className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition"
                      aria-label={ttsStatus === 'playing' ? 'Pause narration' : ttsStatus === 'paused' ? 'Resume narration' : 'Play narration'}
                    >
                      {ttsStatus === 'playing' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    {ttsStatus !== 'idle' && (
                      <button
                        type="button"
                        onClick={stopSpeech}
                        className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
                        aria-label="Stop narration"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => changeRate(SPEEDS[(SPEEDS.indexOf(settings.rate) + 1) % SPEEDS.length])}
                      className="px-2 py-1.5 rounded-xl text-[11px] font-mono font-bold text-slate-200 hover:bg-white/10 transition min-w-[3rem]"
                      aria-label={`Narration speed ${settings.rate}x, click to change`}
                    >
                      {settings.rate}x
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsCustomizerOpen(true)}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition hidden sm:inline-flex"
                  aria-label="Reader settings"
                >
                  <Settings2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  disabled={!hasNextChapter}
                  onClick={() => scrollToChapter(activeIdx + 1)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white/10 text-white hover:bg-white/20 disabled:opacity-40 disabled:pointer-events-none transition inline-flex items-center gap-1 shrink-0"
                >
                  <span className="hidden sm:inline">Next Chapter</span>
                  <span className="sm:hidden">Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Toast */}
          <div
            role="status"
            aria-live="polite"
            className={`fixed left-1/2 -translate-x-1/2 bottom-24 z-50 px-4 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold shadow-xl flex items-center gap-2 transition-all duration-200 max-w-[90vw] ${
              toast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
            }`}
          >
            <Check className="w-4 h-4 shrink-0" />
            <span className="truncate">{toast}</span>
          </div>

          {/* Reader customizer modal */}
          {isCustomizerOpen && (
            <div
              className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsCustomizerOpen(false);
              }}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="reader-settings-title"
                className="w-full sm:max-w-md bg-[#111827] border border-white/10 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between">
                  <h3 id="reader-settings-title" className="text-base font-bold text-white flex items-center gap-2">
                    <Type className="w-4 h-4 text-rose-400" /> Reader Settings
                  </h3>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => setIsCustomizerOpen(false)}
                    className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
                    aria-label="Close reader settings"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <fieldset className="space-y-2">
                  <legend className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">Font</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => updateSetting('font', opt.id)}
                        aria-pressed={settings.font === opt.id}
                        className={`px-3 py-2.5 rounded-xl border text-sm transition ${
                          settings.font === opt.id
                            ? 'border-rose-500 bg-rose-500/15 text-white'
                            : 'border-white/10 text-slate-300 hover:border-white/30'
                        }`}
                        style={{ fontFamily: opt.stack }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <div className="grid grid-cols-2 gap-4">
                  <fieldset>
                    <legend className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">Size</legend>
                    <div className="flex items-center justify-between rounded-xl border border-white/10 p-1">
                      <button
                        type="button"
                        onClick={() => updateSetting('fontSize', clamp(settings.fontSize - FONT_SIZE_STEP, FONT_SIZE_MIN, FONT_SIZE_MAX))}
                        disabled={settings.fontSize <= FONT_SIZE_MIN}
                        className="px-3 py-1.5 rounded-lg text-slate-200 hover:bg-white/10 disabled:opacity-30 transition"
                        aria-label="Decrease font size"
                      >
                        <span className="text-xs font-bold">A</span>
                        <Minus className="w-3 h-3 inline" />
                      </button>
                      <span className="text-xs font-mono text-white">{settings.fontSize}px</span>
                      <button
                        type="button"
                        onClick={() => updateSetting('fontSize', clamp(settings.fontSize + FONT_SIZE_STEP, FONT_SIZE_MIN, FONT_SIZE_MAX))}
                        disabled={settings.fontSize >= FONT_SIZE_MAX}
                        className="px-3 py-1.5 rounded-lg text-slate-200 hover:bg-white/10 disabled:opacity-30 transition"
                        aria-label="Increase font size"
                      >
                        <span className="text-sm font-bold">A</span>
                        <Plus className="w-3 h-3 inline" />
                      </button>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2">Spacing</legend>
                    <div className="flex rounded-xl border border-white/10 p-1">
                      {LINE_HEIGHTS.map((lh) => (
                        <button
                          key={lh.value}
                          type="button"
                          onClick={() => updateSetting('lineHeight', lh.value)}
                          aria-pressed={settings.lineHeight === lh.value}
                          title={lh.label}
                          className={`flex-1 py-1.5 rounded-lg text-[11px] font-mono transition ${
                            settings.lineHeight === lh.value ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {lh.value}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </div>

                <fieldset>
                  <legend className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Theme
                  </legend>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(THEMES).map(([id, t]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => updateSetting('theme', id)}
                        aria-pressed={settings.theme === id}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                          settings.theme === id ? 'ring-2 ring-rose-500 border-transparent' : 'border-white/10'
                        }`}
                        style={{ backgroundColor: t.bg, color: t.text }}
                      >
                        <span className="block">{t.label}</span>
                        <span className="block text-[10px] mt-0.5" style={{ color: t.muted }}>
                          The quick brown fox
                        </span>
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-white/10 cursor-pointer">
                  <span>
                    <span className="block text-sm font-bold text-white">Bionic Reading</span>
                    <span className="block text-xs text-slate-400">
                      <b className="text-slate-200">Emp</b>hasises <b className="text-slate-200">the</b> <b className="text-slate-200">fir</b>st letters for faster skimming
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.bionic}
                    onChange={(e) => updateSetting('bionic', e.target.checked)}
                    className="w-5 h-5 accent-rose-500"
                  />
                </label>

                {ttsSupported && (
                  <fieldset className="space-y-2">
                    <legend className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Headphones className="w-3.5 h-3.5" /> Narrator
                    </legend>
                    <div className="flex rounded-xl border border-white/10 p-1">
                      {SPEEDS.map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => changeRate(rate)}
                          aria-pressed={settings.rate === rate}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-mono transition ${
                            settings.rate === rate ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-white/10'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                    {voices.length > 1 && (
                      <select
                        value={settings.voiceURI}
                        onChange={(e) => updateSetting('voiceURI', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#0b0f17] border border-white/10 text-sm text-white focus:border-rose-500 focus:outline-none"
                        aria-label="Narrator voice"
                      >
                        <option value="">Default voice</option>
                        {voices.map((v) => (
                          <option key={v.voiceURI} value={v.voiceURI}>
                            {v.name} ({v.lang})
                          </option>
                        ))}
                      </select>
                    )}
                  </fieldset>
                )}
              </div>
            </div>
          )}
          </div>,
          document.body
        )}
    </div>
  );
}
