import type { RedesignDirection } from "@logoai/shared";

const COMPLEXITY_LABEL: Record<RedesignDirection["implementationComplexity"], string> = {
  low: "low-effort",
  medium: "medium-effort",
  high: "high-effort",
};

/** Renders a redesign direction as written prose — no cards, no badges. */
export function RedesignDirectionParagraph({ direction }: { direction: RedesignDirection }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-sm leading-relaxed">
        <span className="font-semibold">{direction.title}.</span> {direction.intent}{" "}
        {direction.designRationale}
      </p>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {direction.benefits.join(" ")} On the trade-off side: {direction.tradeOffs.join(" ")}
      </p>
      <p className="text-xs italic text-muted-foreground">
        {direction.visualImpact} A {COMPLEXITY_LABEL[direction.implementationComplexity]} change,
        best suited for {direction.idealIndustries.join(", ")}.
      </p>
    </div>
  );
}
