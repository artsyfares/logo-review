import type { AnalysisFacts } from "@logoai/shared";

type Quadrant = "top-left" | "top-right" | "bottom-left" | "bottom-right";

const QUADRANT_LABEL: Record<Quadrant, string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

const QUADRANT_POSITION: Record<Quadrant, { top: string; left: string }> = {
  "top-left": { top: "0", left: "0" },
  "top-right": { top: "0", left: "-100%" },
  "bottom-left": { top: "-100%", left: "0" },
  "bottom-right": { top: "-100%", left: "-100%" },
};

function QuadrantCrop({ facts, quadrant }: { facts: AnalysisFacts; quadrant: Quadrant }) {
  const position = QUADRANT_POSITION[quadrant];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-full overflow-hidden rounded-md border border-border bg-white"
        style={{ aspectRatio: `${facts.width} / ${facts.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt={`${QUADRANT_LABEL[quadrant]} quadrant of the logo`}
          className="absolute block h-[200%] w-[200%] max-w-none"
          style={{ top: position.top, left: position.left }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{QUADRANT_LABEL[quadrant]}</p>
    </div>
  );
}

/** How evenly detail is distributed across the four quadrants of the mark. */
export function SlicesSection({ facts }: { facts: AnalysisFacts }) {
  const quadrants = facts.balance?.quadrant_complexity;

  if (!quadrants) {
    return <p className="text-sm text-muted-foreground">Not enough ink to measure detail distribution.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto w-full max-w-72 overflow-hidden rounded-md border border-border bg-white">
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt="The logo split into four quadrants"
          className="block w-full"
        />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <line x1={50} y1={0} x2={50} y2={100} stroke="rgba(99,102,241,0.5)" strokeWidth={0.4} />
          <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(99,102,241,0.5)" strokeWidth={0.4} />
        </svg>
      </div>

      <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-center">
        <div>
          <p className="text-lg font-semibold">{quadrants.top_left.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Top left</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{quadrants.top_right.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Top right</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{quadrants.bottom_left.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Bottom left</p>
        </div>
        <div>
          <p className="text-lg font-semibold">{quadrants.bottom_right.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground">Bottom right</p>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        It&rsquo;s often helpful for each quadrant of a logo to have recognizable characteristics.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <QuadrantCrop facts={facts} quadrant="top-left" />
        <QuadrantCrop facts={facts} quadrant="top-right" />
        <QuadrantCrop facts={facts} quadrant="bottom-left" />
        <QuadrantCrop facts={facts} quadrant="bottom-right" />
      </div>
    </div>
  );
}
