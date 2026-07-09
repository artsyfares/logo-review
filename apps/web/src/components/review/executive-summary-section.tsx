import type { AnalysisFacts, LogoReview } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";
import { VerdictBanner } from "./verdict-banner";
import { DecisionSummarySection, balanceVerdict } from "./decision-summary-section";
import { ActionPlanSection, sortActionPlanByPriority } from "./action-plan-section";
import { LogoThumbnail } from "./logo-thumbnail";
import { ReviewDiffSection } from "./review-diff-section";
import { hasFullReportData } from "@/lib/review/has-full-report-data";
import { TONE_CLASS, scoreTone } from "@/lib/review/tone";

/**
 * The one screen a time-pressed stakeholder needs for a go/no-go call:
 * verdict, the deterministic pass/fail checks, and the top fixes — nothing
 * else. Every piece here is pulled from the same data the full report below
 * uses, not a separate judgment, so this is a preview of it, not a rival to it.
 */
export function ExecutiveSummarySection({
  review,
  facts,
  siblingFacts,
  previousReview,
  previousCreatedAt,
}: {
  review: LogoReview;
  facts?: AnalysisFacts | null;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
  /** The prior complete review for this project, if one exists — enables the "since last time" diff. */
  previousReview?: LogoReview | null;
  previousCreatedAt?: Date | null;
}) {
  if (!hasFullReportData(review)) {
    return (
      <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
        This review predates the current report format. Regenerate it to see the executive summary.
      </p>
    );
  }

  const topActions = sortActionPlanByPriority(review.actionPlan).slice(0, 3);
  const needsBalanceAttention = facts ? balanceVerdict(facts)?.tone !== "good" : false;

  return (
    <div className="flex flex-col gap-6">
      {facts && (
        <div data-pdf-skip="true">
          <LogoThumbnail facts={facts} highlightBalance={needsBalanceAttention} />
        </div>
      )}

      <VerdictBanner review={review} />

      <p className="text-base leading-relaxed">{review.executiveSummary}</p>

      {review.brandAlignment && (
        <div className={`rounded-md border px-4 py-3 ${TONE_CLASS[scoreTone(review.brandAlignment.score)]}`}>
          <p className="text-sm font-semibold">
            Brand fit — {Math.round(review.brandAlignment.score)}/100
          </p>
          <p className="mt-1 text-xs leading-relaxed opacity-90">{review.brandAlignment.summary}</p>
        </div>
      )}

      {previousReview && previousCreatedAt && (
        <ReviewDiffSection
          previous={previousReview}
          current={review}
          previousCreatedAt={previousCreatedAt}
        />
      )}

      {facts && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">At a glance</h3>
          <DecisionSummarySection facts={facts} siblingFacts={siblingFacts} />
        </div>
      )}

      {topActions.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold">
            Top {topActions.length === 1 ? "fix" : "fixes"}
          </h3>
          <ActionPlanSection items={topActions} />
        </div>
      )}
    </div>
  );
}
