import type { ActionPlanItem } from "@logoai/shared";

const PRIORITY_ORDER: Record<ActionPlanItem["priority"], number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<ActionPlanItem["priority"], string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};

export function sortActionPlanByPriority(items: ActionPlanItem[]): ActionPlanItem[] {
  return [...items].sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/** "What to fix first" — prioritized, ahead of the full detailed breakdown. */
export function ActionPlanSection({ items }: { items: ActionPlanItem[] }) {
  const sorted = sortActionPlanByPriority(items);

  return (
    <ol className="flex flex-col gap-3">
      {sorted.map((item, index) => (
        <li key={item.issue} className="flex flex-col gap-0.5 text-sm leading-relaxed">
          <p>
            <span className="font-semibold">
              {index + 1}. {item.issue}
            </span>{" "}
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              {PRIORITY_LABEL[item.priority]}
            </span>
          </p>
          <p className="text-muted-foreground">{item.why}</p>
        </li>
      ))}
    </ol>
  );
}
