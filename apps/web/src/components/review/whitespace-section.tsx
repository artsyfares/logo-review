import type { AnalysisFacts } from "@logoai/shared";

/**
 * The fraction of the uploaded canvas that's empty vs. ink, shown as a
 * gauge. This reflects the file as uploaded (including whatever padding is
 * already baked into it), so it's reported factually rather than scored
 * "good/bad" — a tight crop isn't necessarily wrong, it just means the mark
 * needs its own clear space added wherever it's placed.
 */
export function WhitespaceSection({ facts }: { facts: AnalysisFacts }) {
  const ratio = facts.composition.whitespace_ratio;
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        How much of the uploaded canvas is empty space versus ink. Reflects the file as uploaded,
        including any margin already built into it.
      </p>
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-accent"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>0% (edge-to-edge ink)</span>
        <span className="text-sm font-semibold text-foreground">{pct}% whitespace</span>
        <span>100% (blank)</span>
      </div>
    </div>
  );
}
