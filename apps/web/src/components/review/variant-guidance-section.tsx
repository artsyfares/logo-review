import type { AnalysisFacts, VariantGuidanceItem } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";
import { LogoThumbnail } from "./logo-thumbnail";

const TYPE_LABEL: Record<LogoType, string> = {
  primary: "Primary logo",
  secondary: "Secondary logo",
  icon: "Icon",
};

/**
 * "Which file do I actually use for X" — one row per uploaded variant, each
 * with its OWN real thumbnail (not the current asset's image relabeled), so
 * primary/secondary/icon read as one logo family with clear roles instead
 * of separate, unrelated logos.
 */
export function VariantGuidanceSection({
  items,
  ownType,
  ownFacts,
  siblingFacts,
}: {
  items: VariantGuidanceItem[];
  ownType: LogoType;
  ownFacts?: AnalysisFacts | null;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => {
        const facts = item.type === ownType ? ownFacts : siblingFacts?.[item.type];
        return (
          <div key={item.type} className="flex items-start gap-4">
            {facts ? (
              <div className="w-20 shrink-0">
                <LogoThumbnail facts={facts} />
              </div>
            ) : (
              <div className="w-20 shrink-0 rounded-md border border-dashed border-border p-3 text-center text-[10px] text-muted-foreground">
                not shown
              </div>
            )}
            <div className="flex flex-col gap-1">
              <p className="text-sm font-semibold">{TYPE_LABEL[item.type]}</p>
              <p className="text-xs text-muted-foreground">
                Best for: {item.recommendedFor.join(", ")}
              </p>
              <p className="text-sm leading-relaxed">{item.reasoning}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
