import type { AnalysisFacts } from "@logoai/shared";

function zoneLabel(score: number): string {
  if (score >= 0.9) return "Highly symmetric";
  if (score >= 0.75) return "Moderately symmetric";
  return "Asymmetric";
}

/**
 * Overlays the logo on its own horizontal mirror using a "difference" blend
 * mode — matching regions cancel out to black, mismatched regions show up
 * as visible color, so asymmetry is something you can literally see instead
 * of only a percentage.
 */
export function SymmetrySection({ facts }: { facts: AnalysisFacts }) {
  const score = facts.composition.vertical_symmetry_score;

  if (score === null) {
    return <p className="text-sm text-muted-foreground">Not enough ink to measure symmetry.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">
        Many strong logos are intentionally asymmetric — this describes the mark, it isn&rsquo;t a
        pass/fail grade. The overlay below mirrors the logo over itself; anywhere the two copies
        don&rsquo;t line up shows up in color instead of canceling out to black.
      </p>

      <div className="relative mx-auto w-full max-w-72 overflow-hidden rounded-md border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt="The logo"
          className="block w-full"
        />
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt="The logo mirrored over itself to visualize symmetry"
          className="absolute inset-0 block w-full"
          style={{ transform: "scaleX(-1)", mixBlendMode: "difference" }}
        />
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-2xl font-semibold">{Math.round(score * 100)}%</p>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {zoneLabel(score)}
        </p>
      </div>
    </div>
  );
}
