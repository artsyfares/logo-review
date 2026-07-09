import type { AnalysisFacts, LogoReview } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";
import { ScoredParagraph } from "./scored-paragraph";
import { LogoThumbnail } from "./logo-thumbnail";
import { LogoScalabilityPreview } from "./logo-scalability-preview";
import { ColorPaletteSwatches } from "./color-palette-swatches";
import { LogoMonochromePreview } from "./logo-monochrome-preview";

/** The 6 named performance cards: Legibility, Scalability, Originality, Color harmony, Misinterpretations, Balance alignment. Brand-brief alignment gets its own dedicated section instead of a card here — see BrandAlignmentSection. */
export function DetailedReviewSection({
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
      <ScoredParagraph label="Legibility" dimension={review.categoryScores.typography} />

      <div className="flex flex-col gap-3">
        <ScoredParagraph label="Scalability" dimension={review.categoryScores.scalability} />
        {facts && <LogoScalabilityPreview facts={facts} siblingFacts={siblingFacts} />}
      </div>

      <ScoredParagraph label="Originality" dimension={review.categoryScores.visualUniqueness} />

      <div className="flex flex-col gap-3">
        <ScoredParagraph label="Color harmony" dimension={review.categoryScores.colorPalette} />
        {facts && (
          <div className="flex flex-wrap items-start gap-6">
            <ColorPaletteSwatches facts={facts} />
            <LogoMonochromePreview facts={facts} />
          </div>
        )}
      </div>

      <ScoredParagraph label="Misinterpretations" dimension={review.misinterpretationRisk} />

      <div className="flex flex-col gap-3">
        <ScoredParagraph label="Balance alignment" dimension={review.categoryScores.composition} />
        {facts && <LogoThumbnail facts={facts} showGrid />}
      </div>
    </div>
  );
}
