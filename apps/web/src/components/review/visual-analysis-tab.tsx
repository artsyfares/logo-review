import type { AnalysisFacts, LogoReview } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";
import { LogoThumbnail } from "./logo-thumbnail";
import { BrandPersonalityTags } from "./brand-personality-tags";
import { TextList } from "./text-list";
import { ReportSection as Section } from "./report-section";
import { DecisionSummarySection } from "./decision-summary-section";
import { BalanceSection } from "./balance-section";
import { SizeSection } from "./size-section";
import { SlicesSection } from "./slices-section";
import { SymmetrySection } from "./symmetry-section";
import { WhitespaceSection } from "./whitespace-section";
import { ContrastSection } from "./contrast-section";
import { ColorAnalysisSection } from "./color-analysis-section";

/**
 * A from-scratch visual-analysis report, mirroring a reference tool's
 * section set (Balance/Size/Slices/Color) — a different lens on the same
 * underlying facts as the main Report tab, not a replacement for it.
 */
export function VisualAnalysisTab({
  review,
  facts,
  siblingFacts,
  assetName,
  assetDate,
}: {
  review: LogoReview;
  facts?: AnalysisFacts | null;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
  assetName: string;
  assetDate: Date;
}) {
  const hasNarrativeFields = Boolean(
    review.brandPersonalityTags &&
      review.estimatedTargetMarket &&
      review.possibleAssociations &&
      review.colorNarrative,
  );
  const hasBalance = Boolean(facts?.balance);

  return (
    <article id="visual-analysis-tab-root" className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="text-lg font-semibold">{assetName}</h2>
        <p className="text-xs text-muted-foreground">
          {assetDate.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </p>
        {facts && (
          <div data-pdf-skip="true">
            <LogoThumbnail facts={facts} />
          </div>
        )}
      </div>

      {facts && (
        <Section title="At a glance">
          <DecisionSummarySection facts={facts} siblingFacts={siblingFacts} />
        </Section>
      )}

      {!hasNarrativeFields && (
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          This review predates the visual-analysis tab&rsquo;s fields. Regenerate it to see brand
          personality tags, target market, and associations here.
        </p>
      )}

      {hasNarrativeFields && (
        <>
          <Section title="Brand personality">
            <BrandPersonalityTags tags={review.brandPersonalityTags} />
          </Section>

          <Section title="Estimated target market">
            <TextList items={review.estimatedTargetMarket} />
          </Section>

          <Section title="Possible associations">
            <TextList items={review.possibleAssociations} />
          </Section>
        </>
      )}

      {facts && (
        <>
          {hasBalance ? (
            <>
              <Section title="Balance" emphasis="primary">
                <p className="text-xs text-muted-foreground">
                  Visual balance affects visibility and engagement — ideally the logo&rsquo;s visual
                  center of mass sits close to its geometric center.
                </p>
                <BalanceSection facts={facts} />
              </Section>

              <Section title="Slices" emphasis="primary">
                <p className="text-xs text-muted-foreground">
                  The proportion of detail in each quadrant — evenly distributed detail tends to feel
                  more balanced and harmonious.
                </p>
                <SlicesSection facts={facts} />
              </Section>

              <Section title="Symmetry" emphasis="primary">
                <SymmetrySection facts={facts} />
              </Section>
            </>
          ) : (
            <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
              This review predates the Balance and Slices sections. Regenerate it to see them here.
            </p>
          )}

          <Section title="Whitespace" emphasis="primary">
            <WhitespaceSection facts={facts} />
          </Section>

          <Section title="Size" emphasis="primary">
            <p className="text-xs text-muted-foreground">
              How well the logo maintains legibility and clarity as size decreases.
            </p>
            <SizeSection facts={facts} siblingFacts={siblingFacts} />
          </Section>

          <Section title="Contrast & accessibility" emphasis="primary">
            <ContrastSection facts={facts} />
          </Section>

          {review.colorNarrative && (
            <Section title="Color" emphasis="primary">
              <p className="text-xs text-muted-foreground">
                The logo&rsquo;s color palette, distribution, and variations.
              </p>
              <ColorAnalysisSection facts={facts} colorNarrative={review.colorNarrative} />
            </Section>
          )}
        </>
      )}
    </article>
  );
}
