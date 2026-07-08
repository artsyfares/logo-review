import type { AnalysisFacts, LogoReview, UseCaseReadiness } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";
import { pickVariantFacts } from "@/lib/pick-variant-facts";
import { LogoContextMockup, matchMockupType } from "./logo-context-mockup";

const READINESS_LABEL: Record<UseCaseReadiness["readiness"], string> = {
  ready: "Ready",
  "needs-adjustment": "Needs adjustment",
  "not-suitable": "Not suitable",
};

function InsightGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}

/** Usage readiness, category fit, delivery checklist, and presentation kit. */
export function DeeperInsightsSection({
  review,
  facts,
  siblingFacts,
}: {
  review: LogoReview;
  facts?: AnalysisFacts | null;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
}) {
  return (
    <div className="flex flex-col gap-6">
      <InsightGroup title="Real-world usage">
        <ul className="flex flex-col gap-3">
          {review.realWorldUsage.map((usage) => {
            const mockupType = facts ? matchMockupType(usage.useCase) : null;
            const mockup = mockupType && facts ? pickVariantFacts(mockupType, facts, siblingFacts) : null;
            return (
              <li key={usage.useCase} className="flex items-start gap-3 text-sm leading-relaxed">
                {mockupType && mockup && (
                  <div className="shrink-0 pt-0.5">
                    <LogoContextMockup type={mockupType} facts={mockup.facts} />
                  </div>
                )}
                <div>
                  <span className="font-medium">{usage.useCase}</span>{" "}
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                    {READINESS_LABEL[usage.readiness]}
                  </span>
                  <p className="text-muted-foreground">{usage.note}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </InsightGroup>

      <InsightGroup title="Market fit">
        <p className="text-sm leading-relaxed">{review.marketFit.categorySignal}</p>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {review.marketFit.standoutRisk}
        </p>
        <p className="text-sm leading-relaxed text-muted-foreground">{review.industryComparison}</p>
      </InsightGroup>

      <InsightGroup title="Delivery checklist">
        <ul className="flex flex-col gap-1.5 text-sm leading-relaxed">
          {review.deliveryChecklist.map((checklistItem) => (
            <li key={checklistItem.item}>
              <span className="font-medium">
                {checklistItem.recommended ? "✓ " : "— "}
                {checklistItem.item}
              </span>
              <span className="block text-xs text-muted-foreground">{checklistItem.note}</span>
            </li>
          ))}
        </ul>
      </InsightGroup>

      <InsightGroup title="Presentation kit">
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Description — </span>
          {review.presentationKit.logoDescription}
        </p>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Positioning — </span>
          {review.presentationKit.positioningStatement}
        </p>
        <p className="text-sm leading-relaxed">
          <span className="font-medium">Rationale — </span>
          {review.presentationKit.designRationale}
        </p>
        <ul className="flex flex-col gap-1 text-sm leading-relaxed text-muted-foreground">
          {review.presentationKit.presentationTips.map((tip) => (
            <li key={tip}>{tip}</li>
          ))}
        </ul>
      </InsightGroup>
    </div>
  );
}
