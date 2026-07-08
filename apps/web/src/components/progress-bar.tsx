/**
 * The visual indeterminate bar — a presentational component with no async
 * awareness of its own. Use `PendingProgressBar` inside a `<form>` for the
 * `useFormStatus`-driven variant, or render this directly when you already
 * have a boolean pending state (e.g. a client `onClick` handler).
 */
export function ProgressBar({ active, label }: { active: boolean; label: string }) {
  if (!active) {
    return null;
  }
  return (
    <div className="flex flex-col gap-1.5" role="status" aria-live="polite">
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="animate-indeterminate h-full w-1/3 rounded-full bg-accent" />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
