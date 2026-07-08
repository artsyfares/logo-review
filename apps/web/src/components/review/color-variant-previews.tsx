import type { AnalysisFacts } from "@logoai/shared";

const VARIANTS = [
  { key: "original", label: "Original color", background: "#ffffff", filter: "none" },
  { key: "grayscale", label: "Grayscale", background: "#ffffff", filter: "grayscale(100%)" },
  {
    key: "black-on-white",
    label: "Black on white",
    background: "#ffffff",
    filter: "brightness(0)",
  },
  {
    key: "white-on-black",
    label: "White on black",
    background: "#000000",
    filter: "brightness(0) invert(1)",
  },
] as const;

/** How the mark holds up as a pure silhouette — CSS-filter approximations, not literal re-renders. */
export function ColorVariantPreviews({ facts }: { facts: AnalysisFacts }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {VARIANTS.map((variant) => (
        <div key={variant.key} className="flex flex-col items-center gap-1.5">
          <div
            className="flex h-20 w-full items-center justify-center rounded-md border border-border p-3"
            style={{ backgroundColor: variant.background }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
            <img
              src={`data:image/png;base64,${facts.rendered_png_base64}`}
              alt={variant.label}
              className="max-h-full max-w-full object-contain"
              style={{ filter: variant.filter }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{variant.label}</p>
        </div>
      ))}
    </div>
  );
}
