import type { LogoReview } from "@logoai/shared";

export interface ScoreDelta {
  label: string;
  previous: number;
  current: number;
  delta: number;
}

const DIMENSIONS: { label: string; pick: (review: LogoReview) => number | null | undefined }[] = [
  { label: "Overall", pick: (r) => r.overallQuality?.score },
  { label: "Legibility", pick: (r) => r.categoryScores?.typography?.score },
  { label: "Scalability", pick: (r) => r.categoryScores?.scalability?.score },
  { label: "Originality", pick: (r) => r.categoryScores?.visualUniqueness?.score },
  { label: "Color harmony", pick: (r) => r.categoryScores?.colorPalette?.score },
  { label: "Balance alignment", pick: (r) => r.categoryScores?.composition?.score },
  { label: "Accessibility", pick: (r) => r.accessibilityAssessment?.score },
  { label: "Brand fit", pick: (r) => r.brandAlignment?.score },
];

/**
 * Only the scores that actually moved between two reviews of the same
 * project — a designer regenerating after edits wants "what changed," not a
 * restatement of every dimension that stayed the same. Ignores sub-1-point
 * drift since LLM scoring isn't perfectly deterministic run to run.
 */
export function diffReviewScores(previous: LogoReview, current: LogoReview): ScoreDelta[] {
  return DIMENSIONS.map((dim) => {
    const prevScore = dim.pick(previous);
    const currScore = dim.pick(current);
    if (prevScore == null || currScore == null) return null;
    const delta = currScore - prevScore;
    if (Math.abs(delta) < 1) return null;
    return { label: dim.label, previous: prevScore, current: currScore, delta };
  }).filter((d): d is ScoreDelta => d !== null);
}
