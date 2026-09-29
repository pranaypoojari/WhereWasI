'use client';
import { useEffect, useState, useRef } from 'react';

const CHAR_SET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=~';

export default function DecryptedText({
  text = '',
  speed = 40,
  maxIterations = 10,
  sequential = true,
  revealDirection = 'start',
  useOriginalCharsOnly = false,
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-rose-400 font-mono opacity-80',
  animateOn = 'view', // 'view' or 'hover'
  ...props
}) {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const [isScrambling, setIsScrambling] = useState(false);
  const [revealedIndices, setRevealedIndices] = useState(new Set());
  const containerRef = useRef(null);

  useEffect(() => {
    let interval;
    let currentIteration = 0;

    const getNextChar = (originalChar) => {
      if (originalChar === ' ') return ' ';
      if (useOriginalCharsOnly) {
        return text[Math.floor(Math.random() * text.length)];
      }
      return CHAR_SET[Math.floor(Math.random() * CHAR_SET.length)];
    };

    const shuffleText = () => {
      if (sequential) {
        setRevealedIndices((prev) => {
          const next = new Set(prev);
          if (revealDirection === 'start') {
            next.add(prev.size);
          } else if (revealDirection === 'end') {
            next.add(text.length - 1 - prev.size);
          } else {
            // center
            const center = Math.floor(text.length / 2);
            next.add(center + (prev.size % 2 === 0 ? prev.size / 2 : -Math.ceil(prev.size / 2)));
          }
          return next;
        });
      }

      setDisplayText((prevText) =>
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (revealedIndices.has(index)) return char;
            return getNextChar(char);
          })
          .join('')
      );

      currentIteration++;
      if (currentIteration >= text.length + maxIterations) {
        clearInterval(interval);
        setIsScrambling(false);
        setDisplayText(text);
      }
    };

    if (animateOn === 'view' || (animateOn === 'hover' && isHovering)) {
      setIsScrambling(true);
      setRevealedIndices(new Set());
      interval = setInterval(shuffleText, speed);
    } else {
      setDisplayText(text);
    }

    return () => clearInterval(interval);
  }, [text, isHovering, animateOn, speed, maxIterations, sequential, revealDirection, useOriginalCharsOnly]);

  return (
    <span
      ref={containerRef}
      className={`inline-block whitespace-pre-wrap ${parentClassName}`}
      onMouseEnter={() => animateOn === 'hover' && setIsHovering(true)}
      onMouseLeave={() => animateOn === 'hover' && setIsHovering(false)}
      {...props}
    >
      <span className={className}>
        {displayText.split('').map((char, index) => {
          const isRevealed = revealedIndices.has(index) || !isScrambling;
          return (
            <span
              key={index}
              className={isRevealed ? '' : encryptedClassName}
            >
              {char}
            </span>
          );
        })}
      </span>
    </span>
  );
}
