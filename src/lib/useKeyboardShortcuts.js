'use client';
import { useEffect, useRef } from 'react';

function isTypingTarget(el) {
  if (!el || !(el instanceof Element)) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/**
 * Global single-key shortcuts, e.g. { ArrowRight: next, ArrowLeft: prev, b: toggleBook }.
 * Ignored while typing, with modifier keys held (so Cmd+B etc. keep working), or while a
 * modal dialog is open (dialogs own the keyboard).
 */
export default function useKeyboardShortcuts(handlers, enabled = true) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    const onKeyDown = (e) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (isTypingTarget(e.target)) return;
      if (document.querySelector('[aria-modal="true"]')) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      const handler = handlersRef.current[key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enabled]);
}
