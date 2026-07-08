import type { AnalysisFacts, LogoReview } from "@logoai/shared";
import { ScoredParagraph } from "./scored-paragraph";
import { RedesignDirectionParagraph } from "./redesign-direction-paragraph";
import { LogoThumbnail } from "./logo-thumbnail";
import { VerdictBanner } from "./verdict-banner";
import { ReportNav } from "./report-nav";
import { OverviewSection } from "./overview-section";
import { ActionPlanSection } from "./action-plan-section";
import { DetailedReviewSection } from "./detailed-review-section";
import { RiskFlagsSection } from "./risk-flags-section";
import { DeeperInsightsSection } from "./deeper-insights-section";
import { VariantGuidanceSection } from "./variant-guidance-section";
import { TextList } from "./text-list";
import { ReportSection as Section } from "./report-section";
import type { LogoType } from "@/lib/ai/providers/types";

export function LogoReviewDisplay({
  review,
  facts,
  logoType,
  siblingFacts,
}: {
  review: LogoReview;
  facts?: AnalysisFacts | null;
  logoType?: LogoType;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
}) {
  // Reviews generated before this report format was added lack these fields
  // entirely (the DB doesn't re-validate stored jsonb against the current
  // schema) — render what's still valid rather than crashing on a missing
  // required array. Checked independently per-field (not one all-or-nothing
  // flag) so a review that predates only the *newest* field (riskFlags)
  // still gets every other section instead of being fully downgraded.
  const hasFullReportData = Boolean(
    review.actionPlan &&
      review.realWorldUsage &&
      review.marketFit &&
      review.deliveryChecklist &&
      review.presentationKit &&
      review.misinterpretationRisk,
  );

  return (
    <article id="report-tab-root" className="flex flex-col gap-5 bg-background">
      {facts && (
        <div data-pdf-skip="true">
          <LogoThumbnail facts={facts} />
        </div>
      )}

      {hasFullReportData && <VerdictBanner review={review} />}

      <p className="text-base leading-relaxed">{review.executiveSummary}</p>

      {!hasFullReportData && (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          This review predates the current report format (overview, action plan, detailed cards,
          deeper insights). Regenerate it to see the full report.
        </p>
      )}

      {hasFullReportData && (
        <>
          <ReportNav
            hasRiskFlags={Boolean(review.riskFlags)}
            hasVariantGuidance={Boolean(review.variantGuidance && logoType)}
          />

          <Section title="Overview" id="overview" emphasis="primary">
            <OverviewSection review={review} />
          </Section>

          <Section title="Action plan" id="action-plan" emphasis="primary">
            <p className="text-xs text-muted-foreground">
              What to fix first, before polishing the full presentation.
            </p>
            <ActionPlanSection items={review.actionPlan} />
          </Section>

          <Section title="Detailed review" id="detailed-review" emphasis="primary">
            <DetailedReviewSection review={review} facts={facts} siblingFacts={siblingFacts} />
          </Section>

          {review.variantGuidance && logoType && (
            <Section title="Variant usage guide" id="variant-guidance" emphasis="primary">
              <p className="text-xs text-muted-foreground">
                Primary, secondary, and icon are one logo family — here&rsquo;s which file to reach
                for and where.
              </p>
              <VariantGuidanceSection
                items={review.variantGuidance}
                ownType={logoType}
                ownFacts={facts}
                siblingFacts={siblingFacts}
              />
            </Section>
          )}

          {review.riskFlags && (
            <Section title="Risk flags" id="risk-flags" emphasis="primary">
              <RiskFlagsSection riskFlags={review.riskFlags} />
            </Section>
          )}

          <Section title="Deeper insights" id="deeper-insights" emphasis="primary">
            <DeeperInsightsSection review={review} facts={facts} siblingFacts={siblingFacts} />
          </Section>
        </>
      )}

      <div id="full-analysis" className="scroll-mt-6" />

      <Section title="Professional assessment">
        <p className="text-sm leading-relaxed">{review.professionalAssessment}</p>
      </Section>

      <Section title="Strengths">
        <TextList items={review.strengths} />
      </Section>

      <Section title="Weaknesses">
        <TextList items={review.weaknesses} />
      </Section>

      <Section title="Immediate improvement opportunities">
        <TextList items={review.immediateImprovementOpportunities} />
      </Section>

      <Section title="Additional characteristics">
        <div className="flex flex-col gap-4">
          <ScoredParagraph label="Shape language" dimension={review.categoryScores.shapeLanguage} />
          <ScoredParagraph
            label="Brand personality"
            dimension={review.categoryScores.brandPersonality}
          />
        </div>
      </Section>

      <Section title="Redesign directions">
        <div className="flex flex-col gap-4">
          {review.redesignDirections.map((direction) => (
            <RedesignDirectionParagraph key={direction.title} direction={direction} />
          ))}
        </div>
      </Section>

      {(review.colorRecommendations.length > 0 ||
        review.typographyRecommendations.length > 0 ||
        review.layoutRecommendations.length > 0) && (
        <Section title="Recommendations">
          <div className="flex flex-col gap-3">
            {review.colorRecommendations.length > 0 && (
              <TextList items={review.colorRecommendations} />
            )}
            {review.typographyRecommendations.length > 0 && (
              <TextList items={review.typographyRecommendations} />
            )}
            {review.layoutRecommendations.length > 0 && (
              <TextList items={review.layoutRecommendations} />
            )}
          </div>
        </Section>
      )}

      <Section title="Readiness & accessibility">
        <div className="flex flex-col gap-4">
          <ScoredParagraph label="Accessibility" dimension={review.accessibilityAssessment} />
          <ScoredParagraph label="Scalability" dimension={review.scalabilityAssessment} />
          <ScoredParagraph label="Production readiness" dimension={review.productionReadiness} />
          <ScoredParagraph
            label="Client presentation readiness"
            dimension={review.clientPresentationReadiness}
          />
        </div>
      </Section>
    </article>
  );
}
