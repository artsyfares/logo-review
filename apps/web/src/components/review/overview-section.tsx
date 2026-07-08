import type { LogoReview, ScoredDimension } from "@logoai/shared";
import { ScoreRing } from "./score-ring";

function OverviewMetric({ label, dimension }: { label: string; dimension: ScoredDimension | null }) {
  if (!dimension) {
    return null;
  }
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <ScoreRing score={dimension.score} size={56} />
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
}

/** All metrics at a glance — the report's opening summary, before any detailed reasoning. */
export function OverviewSection({ review }: { review: LogoReview }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 gap-y-5 rounded-md border border-border p-5 sm:grid-cols-4">
      <OverviewMetric label="Overall" dimension={review.overallQuality} />
      <OverviewMetric label="Legibility" dimension={review.categoryScores.typography} />
      <OverviewMetric label="Scalability" dimension={review.categoryScores.scalability} />
      <OverviewMetric label="Originality" dimension={review.categoryScores.visualUniqueness} />
      <OverviewMetric label="Color harmony" dimension={review.categoryScores.colorPalette} />
      <OverviewMetric label="Misinterpretations" dimension={review.misinterpretationRisk} />
      <OverviewMetric label="Balance alignment" dimension={review.categoryScores.composition} />
      <OverviewMetric label="Brief match" dimension={review.briefAlignment} />
    </div>
  );
}
