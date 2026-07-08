import type { AnalysisFacts } from "@logoai/shared";

/** Real extracted color swatches — not the AI's word for a color, the actual measured hex. */
export function ColorPaletteSwatches({ facts }: { facts: AnalysisFacts }) {
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
    <div className="flex flex-wrap gap-4">
      {swatches.map((swatch) => (
        <div key={swatch.label} className="flex flex-col items-center gap-1.5">
          <div
            className="h-14 w-14 rounded-md border border-border"
            style={{ backgroundColor: swatch.hex }}
          />
          <span className="text-xs text-muted-foreground">{swatch.label}</span>
          <span className="font-mono text-xs uppercase text-muted-foreground">{swatch.hex}</span>
        </div>
      ))}
    </div>
  );
}
