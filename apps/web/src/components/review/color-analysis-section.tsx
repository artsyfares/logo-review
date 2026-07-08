import type { AnalysisFacts, ColorNarrative } from "@logoai/shared";
import { ColorVariantPreviews } from "./color-variant-previews";
import { ColorDistributionBar } from "./color-distribution-bar";

/** Palette variants, real distribution, and the narrative behind it. */
export function ColorAnalysisSection({
  facts,
  colorNarrative,
}: {
  facts: AnalysisFacts;
  colorNarrative: ColorNarrative;
}) {
  return (
    <div className="flex flex-col gap-5">
      <ColorVariantPreviews facts={facts} />
      <ColorDistributionBar facts={facts} />

      <div className="flex flex-col gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Overall feel
          </p>
          <p className="text-sm leading-relaxed">{colorNarrative.overallFeel}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Harmony
          </p>
          <p className="text-sm leading-relaxed">{colorNarrative.harmony}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Mood match
          </p>
          <p className="text-sm leading-relaxed">{colorNarrative.moodMatch}</p>
        </div>
      </div>
    </div>
  );
}
