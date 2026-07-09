import type { LogoReview } from "@logoai/shared";
import { ArrowUp, ArrowDown } from "react-feather";
import { diffReviewScores } from "@/lib/review/diff-review";

/**
 * "Did this get better since last time" — the core question of the
 * iteration loop the product is built around, answered in one glance
 * instead of re-reading the whole report to spot what moved.
 */
export function ReviewDiffSection({
  previous,
  current,
  previousCreatedAt,
}: {
  previous: LogoReview;
  current: LogoReview;
  previousCreatedAt: Date;
}) {
  const deltas = diffReviewScores(previous, current);
  const dateLabel = previousCreatedAt.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (deltas.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Since your last review ({dateLabel})</h3>
        <p className="rounded-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground">
          No score changes since then.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold">Since your last review ({dateLabel})</h3>
      <ul className="flex flex-col gap-1.5">
        {deltas.map((d) => {
          const improved = d.delta > 0;
          return (
            <li
              key={d.label}
              className={`flex items-center justify-between gap-3 rounded-md border px-3 py-1.5 text-sm ${
                improved
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-red-500/40 bg-red-500/10"
              }`}
            >
              <span className="font-medium">{d.label}</span>
              <span
                className={`flex items-center gap-1 font-semibold ${
                  improved ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"
                }`}
              >
                {improved ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                {Math.round(d.previous)} → {Math.round(d.current)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
