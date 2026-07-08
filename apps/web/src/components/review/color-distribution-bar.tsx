import type { AnalysisFacts } from "@logoai/shared";

/** A proportional bar of the real extracted palette — width of each color matches its actual coverage. */
export function ColorDistributionBar({ facts }: { facts: AnalysisFacts }) {
  const swatches = [
    ...(facts.background_color
      ? [{ ...facts.background_color, label: "Background" }]
      : []),
    ...facts.palette.map((color, index) => ({ ...color, label: `Ink ${index + 1}` })),
  ];

  if (swatches.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex h-6 w-full overflow-hidden rounded-full border border-border">
        {swatches.map((swatch) => (
          <div
            key={swatch.label}
            style={{ width: `${Math.max(swatch.coverage * 100, 2)}%`, backgroundColor: swatch.hex }}
            title={`${swatch.label} — ${swatch.hex} (${Math.round(swatch.coverage * 100)}%)`}
          />
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">
        *Width of each color is proportional to its usage in the logo.
      </p>
    </div>
  );
}
