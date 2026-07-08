import type { AnalysisFacts } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";

const SIZE_ORDER = ["48", "32", "16"];

const VARIANT_LABEL: Record<LogoType, string> = {
  primary: "Primary",
  secondary: "Secondary",
  icon: "Icon",
};

function VariantRow({ type, facts }: { type: LogoType; facts: AnalysisFacts }) {
  const sizes = SIZE_ORDER.filter((size) => facts.scalability.by_size[size]);
  if (sizes.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        {VARIANT_LABEL[type]}
      </span>
      <div className="flex flex-wrap items-end gap-6">
        {sizes.map((size) => {
          const pixels = Number(size);
          const result = facts.scalability.by_size[size];
          return (
            <div key={size} className="flex flex-col items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-md border border-border bg-white"
                style={{ width: pixels + 24, height: pixels + 24 }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
                <img
                  src={`data:image/png;base64,${facts.rendered_png_base64}`}
                  alt={`${VARIANT_LABEL[type]} logo rendered at ${size}px`}
                  style={{ width: pixels, height: "auto", maxHeight: pixels }}
                />
              </div>
              <span className="text-xs text-muted-foreground">{size}px</span>
              <span className="text-[10px] text-muted-foreground">
                {Math.round(result.detail_retention_ratio * 100)}% detail retained
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Shows each uploaded variant's own render at each measured size, next to
 * its own real detail-retention ratio — primary always; secondary/icon if
 * uploaded — rather than picking one variant and hiding the rest.
 */
export function LogoScalabilityPreview({
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
    <div className="flex flex-col gap-4">
      {variants.map((variant) => (
        <VariantRow key={variant.type} type={variant.type} facts={variant.facts} />
      ))}
    </div>
  );
}
