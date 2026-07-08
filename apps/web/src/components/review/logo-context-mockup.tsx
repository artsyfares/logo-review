import type { AnalysisFacts } from "@logoai/shared";

export type MockupType =
  | "header"
  | "app-icon"
  | "avatar"
  | "favicon"
  | "print"
  | "merchandise"
  | "email-signature";

/** Fuzzy-matches a freeform use-case label (the AI's own wording) to a mockup we can actually render. */
export function matchMockupType(useCase: string): MockupType | null {
  const lower = useCase.toLowerCase();
  if (lower.includes("favicon")) return "favicon";
  if (lower.includes("app icon") || lower.includes("icon")) return "app-icon";
  if (lower.includes("avatar") || lower.includes("social") || lower.includes("profile")) return "avatar";
  if (lower.includes("email")) return "email-signature";
  if (lower.includes("merch")) return "merchandise";
  if (lower.includes("print") || lower.includes("signage")) return "print";
  if (lower.includes("header") || lower.includes("website") || lower.includes("web")) return "header";
  return null;
}

function LogoImg({ facts, className }: { facts: AnalysisFacts; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- base64 data URI, not an optimizable static asset
    <img
      src={`data:image/png;base64,${facts.rendered_png_base64}`}
      alt=""
      className={className}
    />
  );
}

/** A real composited preview of the logo in a concrete placement — not a chart, an actual mockup. */
export function LogoContextMockup({ type, facts }: { type: MockupType; facts: AnalysisFacts }) {
  if (type === "header") {
    return (
      <div className="flex h-11 w-full max-w-56 items-center gap-3 rounded-md border border-border bg-white px-3">
        <LogoImg facts={facts} className="max-h-6 max-w-20 object-contain" />
        <div className="ml-auto flex gap-2">
          <div className="h-2 w-8 rounded-full bg-gray-200" />
          <div className="h-2 w-8 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  if (type === "app-icon") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-white p-2 shadow-sm">
        <LogoImg facts={facts} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  if (type === "avatar") {
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-white p-2 shadow-sm">
        <LogoImg facts={facts} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  if (type === "favicon") {
    // a literal tiny browser-tab mockup, not just a small square, so the
    // "does it survive 16px" claim in the text is something you can actually see.
    return (
      <div className="flex h-7 w-24 items-center gap-1.5 rounded-t-md border border-b-0 border-border bg-white px-2">
        <LogoImg facts={facts} className="h-4 w-4 object-contain" />
        <div className="h-1.5 w-10 rounded-full bg-gray-200" />
      </div>
    );
  }

  if (type === "email-signature") {
    return (
      <div className="flex h-11 w-40 items-center gap-2 rounded-md border border-border bg-white px-2">
        <LogoImg facts={facts} className="max-h-7 max-w-12 object-contain" />
        <div className="flex flex-col gap-1">
          <div className="h-1.5 w-16 rounded-full bg-gray-300" />
          <div className="h-1.5 w-12 rounded-full bg-gray-200" />
        </div>
      </div>
    );
  }

  if (type === "merchandise") {
    // a tag/patch framing (dashed border) rather than the flat card used for
    // print, so it reads as "printed on an object" not "on a screen".
    return (
      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-border bg-white p-2">
        <LogoImg facts={facts} className="max-h-full max-w-full object-contain" />
      </div>
    );
  }

  // print/signage — a larger clean swatch implying "enlarged", since the
  // relevant question there is fidelity at LARGE scale, not small.
  return (
    <div className="flex h-20 w-20 items-center justify-center rounded-md border border-border bg-white p-3 shadow-sm">
      <LogoImg facts={facts} className="max-h-full max-w-full object-contain" />
    </div>
  );
}
