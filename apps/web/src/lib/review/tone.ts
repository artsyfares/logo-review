/**
 * Single good/warn/bad color-and-label system shared by every component that
 * renders a verdict — score rings, the verdict banner, action-plan priority,
 * decision-summary cards, and readiness labels. Previously each component
 * had its own thresholds/colors (e.g. ScoreRing treated 60-79 as a neutral
 * "indigo" band while VerdictBanner treated the same range as "amber
 * warning"), so the same number could read as a different color depending on
 * which part of the report you looked at.
 */
export type Tone = "good" | "warn" | "bad";

export const TONE_CLASS: Record<Tone, string> = {
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  bad: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
};

export const TONE_HEX: Record<Tone, string> = {
  good: "#10b981", // emerald-500
  warn: "#f59e0b", // amber-500
  bad: "#ef4444", // red-500
};

export const TONE_LABEL: Record<Tone, string> = {
  good: "Ready",
  warn: "Needs attention",
  bad: "Needs work",
};

/** The one 0-100 score → tone mapping used everywhere a score renders. */
export function scoreTone(score: number): Tone {
  if (score >= 80) return "good";
  if (score >= 60) return "warn";
  return "bad";
}
