import type { LogoReview } from "@logoai/shared";
import { sortActionPlanByPriority } from "./action-plan-section";
import { TONE_CLASS, type Tone, scoreTone } from "@/lib/review/tone";

const VERDICT_LABEL: Record<Tone, string> = {
  good: "Ready to present",
  warn: "Close — needs targeted fixes before presenting",
  bad: "Not ready — needs significant revision",
};

function getVerdict(score: number): { label: string; tone: Tone } {
  const tone = scoreTone(score);
  return { label: VERDICT_LABEL[tone], tone };
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
