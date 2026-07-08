import type { AnalysisFacts } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";

const SIZES = [16, 32, 48, 64, 96, 128];

type Zone = "good" | "fair" | "moderate" | "poor";

const ZONE_COLOR: Record<Zone, string> = {
  good: "#10b981",
  fair: "#eab308",
  moderate: "#f97316",
  poor: "#ef4444",
};

const ZONE_LABEL: Record<Zone, string> = {
  good: "Good",
  fair: "Fair",
  moderate: "Moderate",
  poor: "Poor",
};

const VARIANT_LABEL: Record<LogoType, string> = {
  primary: "Primary",
  secondary: "Secondary",
  icon: "Icon",
};

function zoneFor(ratio: number): Zone {
  if (ratio >= 0.9) return "good";
  if (ratio >= 0.75) return "fair";
  if (ratio >= 0.55) return "moderate";
  return "poor";
}

const MINIMUM_SIZE_THRESHOLD = 0.75; // matches the "fair" zone floor

function recommendedMinimumSize(facts: AnalysisFacts, sizes: number[]): string {
  const safe = sizes.find((size) => facts.scalability.by_size[size].detail_retention_ratio >= MINIMUM_SIZE_THRESHOLD);
  if (safe !== undefined) {
    return `Recommended minimum size: ${safe}px`;
  }
  const largest = sizes[sizes.length - 1];
  const pct = Math.round(facts.scalability.by_size[largest].detail_retention_ratio * 100);
  return `Even at ${largest}px, retention is only ${pct}% — consider simplifying fine detail for small-size use.`;
}

function VariantSizeRow({ type, facts }: { type: LogoType; facts: AnalysisFacts }) {
  const sizes = SIZES.filter((size) => facts.scalability.by_size[size]);
  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {VARIANT_LABEL[type]}
        </p>
        <p className="text-[11px] text-muted-foreground">{recommendedMinimumSize(facts, sizes)}</p>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {sizes.map((size) => {
          const ratio = facts.scalability.by_size[size].detail_retention_ratio;
          const zone = zoneFor(ratio);
          return (
            <div
              key={size}
              className="flex flex-col items-center gap-1.5 rounded-md border border-border p-2"
            >
              <div
                className="flex items-center justify-center rounded-md border border-border bg-white p-1"
                style={{ width: Math.min(size, 64) + 16, height: Math.min(size, 64) + 16 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
                <img
                  src={`data:image/png;base64,${facts.rendered_png_base64}`}
                  alt={`${VARIANT_LABEL[type]} logo at ${size}px`}
                  style={{ width: Math.min(size, 64), height: "auto", maxHeight: Math.min(size, 64) }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {size}×{size}px
              </p>
              <p className="text-sm font-semibold">{Math.round(ratio * 100)}%</p>
              <p
                className="text-[10px] font-medium uppercase tracking-wide"
                style={{ color: ZONE_COLOR[zone] }}
              >
                {ZONE_LABEL[zone]}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * How well each uploaded variant maintains legibility and clarity as size
 * decreases — one row per variant (primary always; secondary/icon if
 * uploaded), each with its OWN real render and its OWN measured retention,
 * rather than picking a single "winner" variant and hiding the rest.
 */
export function SizeSection({
  facts,
  siblingFacts,
}: {
  facts: AnalysisFacts;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
}) {
  const variants: { type: LogoType; facts: AnalysisFacts }[] = [
    { type: "primary", facts },
    ...(siblingFacts?.secondary ? [{ type: "secondary" as const, facts: siblingFacts.secondary }] : []),
    ...(siblingFacts?.icon ? [{ type: "icon" as const, facts: siblingFacts.icon }] : []),
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
        {(Object.keys(ZONE_LABEL) as Zone[]).map((zone) => (
          <span key={zone} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: ZONE_COLOR[zone] }}
            />
            {ZONE_LABEL[zone]}
          </span>
        ))}
      </div>

      {variants.map((variant) => (
        <VariantSizeRow key={variant.type} type={variant.type} facts={variant.facts} />
      ))}
    </div>
  );
}
