import type { AnalysisFacts, ContrastCheck } from "@logoai/shared";

const MAX_COLORS_SHOWN = 4;

function ContrastChip({ label, ratio, passes }: { label: string; ratio: number; passes: boolean }) {
  return (
    <div
      className={`flex flex-col items-center gap-0.5 rounded-md border px-2 py-1.5 text-center ${
        passes ? "border-emerald-500/40 bg-emerald-500/10" : "border-red-500/40 bg-red-500/10"
      }`}
    >
      <span className="text-[10px] text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold">{ratio.toFixed(1)}:1</span>
      <span
        className={`text-[9px] font-medium uppercase tracking-wide ${
          passes ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
        }`}
      >
        {passes ? "AA pass" : "AA fail"}
      </span>
    </div>
  );
}

function ColorContrastRow({ check }: { check: ContrastCheck }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-2">
      <div className="flex items-center gap-2">
        <div className="h-9 w-9 shrink-0 rounded-md border border-border" style={{ backgroundColor: check.hex }} />
        <div className="flex flex-col">
          <span className="font-mono text-xs uppercase text-muted-foreground">{check.hex}</span>
          <span className="text-[10px] text-muted-foreground">{Math.round(check.coverage * 100)}% coverage</span>
        </div>
      </div>
      <div className="ml-auto flex gap-2">
        <ContrastChip label="vs. white" ratio={check.contrast_vs_white} passes={check.meets_aa_normal_text_vs_white} />
        <ContrastChip label="vs. black" ratio={check.contrast_vs_black} passes={check.meets_aa_normal_text_vs_black} />
        {check.contrast_vs_own_background !== null && check.meets_aa_normal_text_vs_own_background !== null && (
          <ContrastChip
            label="vs. its background"
            ratio={check.contrast_vs_own_background}
            passes={check.meets_aa_normal_text_vs_own_background}
          />
        )}
      </div>
    </div>
  );
}

/**
 * WCAG contrast for each dominant ink color against the two most common
 * real-world placements (white, black) and the logo's own detected
 * background, if any — deterministic math (relative luminance, no AI
 * guessing), so a designer can see exactly which colors are safe to reuse
 * as text/UI elements versus decorative-only.
 */
export function ContrastSection({ facts }: { facts: AnalysisFacts }) {
  const checks = [...facts.contrast_checks].sort((a, b) => b.coverage - a.coverage).slice(0, MAX_COLORS_SHOWN);

  if (checks.length === 0) {
    return <p className="text-sm text-muted-foreground">No opaque ink colors were detected to check.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted-foreground">
        WCAG AA requires at least a 4.5:1 contrast ratio for normal text. Each of the logo&rsquo;s
        dominant ink colors is checked against white, black, and (if detected) the logo&rsquo;s own
        background — useful for knowing which colors are safe to reuse as text or UI accents versus
        decorative-only.
      </p>
      <div className="flex flex-col gap-2">
        {checks.map((check) => (
          <ColorContrastRow key={check.hex} check={check} />
        ))}
      </div>
    </div>
  );
}
