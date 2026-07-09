import type { ActionPlanItem } from "@logoai/shared";
import { TONE_CLASS, type Tone } from "@/lib/review/tone";

const PRIORITY_ORDER: Record<ActionPlanItem["priority"], number> = { high: 0, medium: 1, low: 2 };
const PRIORITY_LABEL: Record<ActionPlanItem["priority"], string> = {
  high: "High priority",
  medium: "Medium priority",
  low: "Low priority",
};
/** Urgent-first color mapping, consistent with every other verdict in the report — red draws the eye to what genuinely needs attention first. */
const PRIORITY_TONE: Record<ActionPlanItem["priority"], Tone> = {
  high: "bad",
  medium: "warn",
  low: "good",
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
        <li key={item.issue} className="flex flex-col gap-1 text-sm leading-relaxed">
          <p className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">
              {index + 1}. {item.issue}
            </span>
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TONE_CLASS[PRIORITY_TONE[item.priority]]}`}
            >
              {PRIORITY_LABEL[item.priority]}
            </span>
          </p>
          <p className="text-muted-foreground">{item.why}</p>
        </li>
      ))}
    </ol>
  );
}
