import type { ScoredDimension } from "@logoai/shared";
import { PRINCIPLE_LABELS } from "./principle-labels";
import { ScoreRing } from "./score-ring";

/** A scored dimension: a ring for the number, written prose for the reasoning. */
export function ScoredParagraph({
  label,
  dimension,
}: {
  label: string;
  dimension: ScoredDimension;
}) {
  return (
    <div className="flex gap-3">
      <ScoreRing score={dimension.score} />
      <div className="flex flex-col gap-1">
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">{label}.</span> {dimension.reasoning}
        </p>
        <p className="text-xs italic text-muted-foreground">
          Confidence: {dimension.confidence}. Principles considered:{" "}
          {dimension.principles.map((p) => PRINCIPLE_LABELS[p]).join(", ")}.
        </p>
      </div>
    </div>
  );
}
