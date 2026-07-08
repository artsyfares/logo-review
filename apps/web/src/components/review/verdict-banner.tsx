import type { LogoReview } from "@logoai/shared";
import { sortActionPlanByPriority } from "./action-plan-section";

const TONE_CLASS = {
  good: "border-emerald-500/40 bg-emerald-500/10",
  warn: "border-amber-500/40 bg-amber-500/10",
  bad: "border-red-500/40 bg-red-500/10",
} as const;

function getVerdict(score: number): { label: string; tone: keyof typeof TONE_CLASS } {
  if (score >= 80) return { label: "Ready to present", tone: "good" };
  if (score >= 60) return { label: "Close — needs targeted fixes before presenting", tone: "warn" };
  return { label: "Not ready — needs significant revision", tone: "bad" };
}

/** The one-line TL;DR a busy stakeholder reads before anything else. */
export function VerdictBanner({ review }: { review: LogoReview }) {
  const verdict = getVerdict(review.overallQuality.score);
  const [topFix] = sortActionPlanByPriority(review.actionPlan);

  return (
    <div className={`flex flex-col gap-1 rounded-md border px-4 py-3 ${TONE_CLASS[verdict.tone]}`}>
      <p className="text-sm font-semibold">
        {verdict.label} — {Math.round(review.overallQuality.score)}/100
      </p>
      {topFix && (
        <p className="text-xs text-muted-foreground">
          Top priority: {topFix.issue}
        </p>
      )}
    </div>
  );
}
