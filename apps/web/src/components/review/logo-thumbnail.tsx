import type { AnalysisFacts } from "@logoai/shared";

const THIRDS = [33.33, 66.66];
const THIRDS_COLOR = "#4f46e5"; // indigo-600
const CENTER_COLOR = "#db2777"; // pink-600

/** A guide line with a white casing underneath so it stays legible over any logo color. */
function GuideLine({
  x1,
  y1,
  x2,
  y2,
  color,
  weight,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  weight: number;
}) {
  return (
    <>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeOpacity={0.9} strokeWidth={weight + 0.8} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={weight} />
    </>
  );
}

/**
 * The actual reviewed logo, optionally with a 3x3 alignment grid + center
 * crosshair overlay, or a balance marker — a dot at the logo's real,
 * measured visual center of mass, shown only when it's meaningfully off
 * center. This ties a "balance needs work" verdict directly to the image
 * instead of leaving the reader to take the claim on faith; it's plotted
 * from the same deterministic facts the verdict itself is computed from,
 * never guessed or AI-estimated.
 */
export function LogoThumbnail({
  facts,
  showGrid = false,
  highlightBalance = false,
}: {
  facts: AnalysisFacts;
  showGrid?: boolean;
  highlightBalance?: boolean;
}) {
  const centerOfMass = facts.balance?.center_of_mass;
  const showBalanceMarker = highlightBalance && Boolean(centerOfMass);

  return (
    <div className="mx-auto w-full max-w-64 rounded-md border border-border bg-muted p-5">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt="The reviewed logo"
          className="block w-full"
        />
        {showGrid && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {THIRDS.map((pos) => (
              <g key={pos}>
                <GuideLine x1={pos} y1={0} x2={pos} y2={100} color={THIRDS_COLOR} weight={0.5} />
                <GuideLine x1={0} y1={pos} x2={100} y2={pos} color={THIRDS_COLOR} weight={0.5} />
              </g>
            ))}
            <GuideLine x1={50} y1={0} x2={50} y2={100} color={CENTER_COLOR} weight={0.9} />
            <GuideLine x1={0} y1={50} x2={100} y2={50} color={CENTER_COLOR} weight={0.9} />
          </svg>
        )}
        {showBalanceMarker && centerOfMass && (
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <line x1={50} y1={0} x2={50} y2={100} stroke="rgba(99,102,241,0.5)" strokeWidth={0.4} />
            <line x1={0} y1={50} x2={100} y2={50} stroke="rgba(99,102,241,0.5)" strokeWidth={0.4} />
            <circle
              cx={centerOfMass.centroid_x_ratio * 100}
              cy={centerOfMass.centroid_y_ratio * 100}
              r={1.6}
              fill="#ef4444"
              stroke="white"
              strokeWidth={0.5}
            />
          </svg>
        )}
      </div>
      {showBalanceMarker && centerOfMass && (
        <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
          Red dot = visual center of mass, offset{" "}
          {Math.round(Math.max(centerOfMass.x_offset_pct, centerOfMass.y_offset_pct))}% from the
          geometric center (crosshair).
        </p>
      )}
    </div>
  );
}
