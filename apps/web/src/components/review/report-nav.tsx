const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "action-plan", label: "Action plan" },
  { id: "detailed-review", label: "Detailed review" },
  { id: "variant-guidance", label: "Variant usage guide", optional: true },
  { id: "risk-flags", label: "Risk flags", optional: true },
  { id: "deeper-insights", label: "Deeper insights" },
  { id: "full-analysis", label: "Full analysis" },
];

/** Jump links — the report is long enough that scrolling to a section beats scrolling past it. */
export function ReportNav({
  hasRiskFlags = true,
  hasVariantGuidance = true,
}: {
  hasRiskFlags?: boolean;
  hasVariantGuidance?: boolean;
}) {
  const visible: Record<string, boolean> = {
    "risk-flags": hasRiskFlags,
    "variant-guidance": hasVariantGuidance,
  };

  return (
    <nav aria-label="Report sections" className="flex flex-wrap gap-1.5 pb-3 text-xs">
      {NAV_ITEMS.filter((item) => !item.optional || visible[item.id]).map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className="rounded-full border border-border px-2.5 py-1 font-medium text-muted-foreground transition-colors hover:border-accent hover:text-accent"
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
}
