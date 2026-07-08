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

/** The actual reviewed logo, optionally with a 3x3 alignment grid + center crosshair overlay. */
export function LogoThumbnail({
  facts,
  showGrid = false,
}: {
  facts: AnalysisFacts;
  showGrid?: boolean;
}) {
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
      </div>
    </div>
  );
}
