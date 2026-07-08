"use client";

import { useEffect, useState } from "react";
import { ScoreRing } from "@/components/review/score-ring";

/**
 * Draws the ring in from 0 up to `score` once mounted, via a plain JS tween
 * (no animation library) — a landing-page-only flourish. `ScoreRing` itself
 * stays a server-renderable, non-animated component everywhere else in the
 * app (real reports render dozens of these per page; forcing an animation
 * on all of them would be noise, not polish).
 */
export function AnimatedScoreRing({ score, size }: { score: number; size?: number }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let frame: number;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayScore(score * eased);
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return <ScoreRing score={displayScore} size={size} />;
}
