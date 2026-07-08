"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fades/slides a section in the first time it scrolls into view. Plain
 * IntersectionObserver + a CSS transition (see globals.css's `[data-reveal]`
 * rules) rather than an animation library — this page has exactly one use
 * for motion, not enough to justify the extra bundle weight.
 */
export function Reveal({
  children,
  delayMs = 0,
  className,
}: {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsRevealed(true), delayMs);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [delayMs]);

  return (
    <div ref={ref} data-reveal={isRevealed ? "revealed" : "hidden"} className={className}>
      {children}
    </div>
  );
}
