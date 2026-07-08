import type { AnalysisFacts } from "@logoai/shared";

/** Grayscale render of the actual logo — tests whether it still reads with color removed. */
export function LogoMonochromePreview({ facts }: { facts: AnalysisFacts }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="flex h-24 w-24 items-center justify-center rounded-md border border-border bg-white p-3">
        {/* eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset */}
        <img
          src={`data:image/png;base64,${facts.rendered_png_base64}`}
          alt="The logo in monochrome"
          className="max-h-full max-w-full"
          style={{ filter: "grayscale(100%)" }}
        />
      </div>
      <span className="text-xs text-muted-foreground">Monochrome test</span>
    </div>
  );
}
