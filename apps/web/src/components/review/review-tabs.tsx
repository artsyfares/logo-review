"use client";

import { useState } from "react";

export function ReviewTabs({
  reportTab,
  visualAnalysisTab,
}: {
  reportTab: React.ReactNode;
  visualAnalysisTab: React.ReactNode;
}) {
  const [active, setActive] = useState<"report" | "visual-analysis">("report");

  return (
    <div className="flex flex-col gap-5">
      <div role="tablist" className="flex gap-1 rounded-md bg-muted p-1 text-sm">
        <button
          type="button"
          role="tab"
          aria-selected={active === "report"}
          onClick={() => setActive("report")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
            active === "report" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Report
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={active === "visual-analysis"}
          onClick={() => setActive("visual-analysis")}
          className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
            active === "visual-analysis" ? "bg-background shadow-sm" : "text-muted-foreground"
          }`}
        >
          Visual Analysis
        </button>
      </div>

      <div hidden={active !== "report"}>{reportTab}</div>
      <div hidden={active !== "visual-analysis"}>{visualAnalysisTab}</div>
    </div>
  );
}
