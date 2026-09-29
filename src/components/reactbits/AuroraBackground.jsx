'use client';
import { cn } from "@/lib/utils";

export default function AuroraBackground({
  className,
  children,
  showRadialGradient = true,
  ...props
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col min-h-screen items-center justify-start bg-cinema-black text-slate-100 transition-bg overflow-x-hidden",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className={cn(
            `
            [--white-gradient:repeating-linear-gradient(100deg,var(--white)_0%,var(--white)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--white)_16%)]
            [--dark-gradient:repeating-linear-gradient(100deg,var(--black)_0%,var(--black)_7%,var(--transparent)_10%,var(--transparent)_12%,var(--black)_16%)]
            [--aurora:repeating-linear-gradient(100deg,#f43f5e_10%,#881337_20%,#0f172a_30%,#e11d48_40%,#1e1b4b_50%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[24px] invert-0
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)]
            after:[background-size:200%,_100%] 
            after:animate-pulse-slow after:[background-attachment:fixed] after:mix-blend-difference
            pointer-events-none
            absolute -inset-[10px] opacity-25 will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--transparent)_70%)]`
          )}
        />
      </div>
      <div className="relative z-10 w-full flex-1 flex flex-col">{children}</div>
    </div>
  );
}
