'use client';
import { cn } from '@/lib/utils';

export default function ShinyText({
  children,
  className = '',
  shimmerWidth = 100,
  speed = 3
}) {
  return (
    <span
      className={cn(
        "inline-block bg-[linear-gradient(110deg,#939ea8,45%,#ffffff,55%,#939ea8)] bg-[length:200%_100%] bg-clip-text text-transparent animate-shimmer font-medium",
        className
      )}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {children}
    </span>
  );
}
