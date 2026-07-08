import type { AnalysisFacts } from "@logoai/shared";

/** Where the ink's center of mass sits relative to the geometric center of the canvas. */
export function BalanceSection({ facts }: { facts: AnalysisFacts }) {
  const centerOfMass = facts.balance?.center_of_mass;

  if (!centerOfMass) {
    return <p className="text-sm text-muted-foreground">Not enough ink to measure balance.</p>;
  }

  const dotXPct = centerOfMass.centroid_x_ratio * 100;
  const dotYPct = centerOfMass.centroid_y_ratio * 100;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full border border-muted-foreground" />
          Center of image — the geometric center of the canvas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
          Visual center of mass — the perceived center based on ink distribution
        </span>
      </div>

      <div className="relative mx-auto w-full max-w-72 overflow-hidden rounded-md border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt="The logo with its visual center of mass marked"
          className="block w-full"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line x1={50} y1={0} x2={50} y2={100} stroke="rgba(99,102,241,0.5)" strokeWidth={0.4} />
          <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(99,102,241,0.5)" strokeWidth={0.4} />
          <circle cx={dotXPct} cy={dotYPct} r={1.6} fill="#ef4444" stroke="white" strokeWidth={0.5} />
        </svg>
      </div>

      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Center offset
        </p>
        <p className="text-xs text-muted-foreground">
          How far the visual center of mass deviates from the geometric center.
        </p>
        <div className="mt-1 flex gap-8">
          <div>
            <p className="text-2xl font-semibold">{Math.round(centerOfMass.x_offset_pct)}%</p>
            <p className="text-xs text-muted-foreground">x-axis offset</p>
          </div>
          <div>
            <p className="text-2xl font-semibold">{Math.round(centerOfMass.y_offset_pct)}%</p>
            <p className="text-xs text-muted-foreground">y-axis offset</p>
          </div>
        </div>
      </div>
    </div>
  );
}
