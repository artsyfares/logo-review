"use client";

import { useState } from "react";

type Tab = "summary" | "report" | "brand-alignment" | "visual-analysis";

const TABS: { id: Tab; label: string }[] = [
  { id: "summary", label: "Summary" },
  { id: "report", label: "Report" },
  { id: "brand-alignment", label: "Brand Alignment" },
  { id: "visual-analysis", label: "Visual Analysis" },
];

export function ReviewTabs({
  summaryTab,
  reportTab,
  brandAlignmentTab,
  visualAnalysisTab,
}: {
  summaryTab: React.ReactNode;
  reportTab: React.ReactNode;
  /** Absent for reviews that predate the mandatory-brief feature (ROADMAP.md 1.9m/1.9n) — the tab itself is hidden rather than shown empty. */
  brandAlignmentTab?: React.ReactNode;
  visualAnalysisTab: React.ReactNode;
}) {
  // Defaults to the executive summary — a busy stakeholder landing on the
  // project page should see the go/no-go verdict before the full designer
  // depth report, not after clicking into it.
  const [active, setActive] = useState<Tab>("summary");
  const content: Record<Tab, React.ReactNode> = {
    summary: summaryTab,
    report: reportTab,
    "brand-alignment": brandAlignmentTab,
    "visual-analysis": visualAnalysisTab,
  };
  const visibleTabs = TABS.filter((tab) => tab.id !== "brand-alignment" || brandAlignmentTab);

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex gap-1 rounded-md bg-muted p-1 text-sm">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              active === tab.id ? "bg-background shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {visibleTabs.map((tab) => (
        <div key={tab.id} hidden={active !== tab.id}>
          {content[tab.id]}
        </div>
      ))}
    </div>
  );
}
