import type { RiskFlags } from "@logoai/shared";

/** Trademark-similarity and cultural-interpretation risk — see docs/PRODUCT_VISION.md's analysis list. */
export function RiskFlagsSection({ riskFlags }: { riskFlags: RiskFlags }) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Trademark similarity
        </h4>
        <p className="text-sm leading-relaxed">{riskFlags.trademarkSimilarity}</p>
      </div>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Cultural sensitivity
        </h4>
        <p className="text-sm leading-relaxed">{riskFlags.culturalSensitivity}</p>
      </div>
    </div>
  );
}
