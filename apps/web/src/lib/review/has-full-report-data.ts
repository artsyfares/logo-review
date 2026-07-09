import type { LogoReview } from "@logoai/shared";

/**
 * Reviews generated before this report format was added lack these fields
 * entirely (the DB doesn't re-validate stored jsonb against the current
 * schema) — shared by every section that needs to fall back gracefully
 * instead of crashing on a missing required field.
 */
export function hasFullReportData(review: LogoReview): boolean {
  return Boolean(
    review.actionPlan &&
      review.realWorldUsage &&
      review.marketFit &&
      review.deliveryChecklist &&
      review.presentationKit &&
      review.misinterpretationRisk &&
      review.brandAlignment,
  );
}
