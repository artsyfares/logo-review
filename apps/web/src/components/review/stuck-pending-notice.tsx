"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "react-feather";
import { SubmitButton } from "@/components/submit-button";

const STUCK_THRESHOLD_MS = 2 * 60 * 1000;

/**
 * A crashed/restarted server can never come back to update a "pending"
 * review row, leaving the project page showing "Generating review…" forever
 * with no way to recover short of a direct DB edit. Client component (not a
 * `Date.now()` call in the server-rendered page) so the "it's been too long"
 * check reflects actual wall-clock time in the visitor's browser, and so a
 * tab left open past the threshold flips into the recovery state on its own.
 */
export function StuckPendingNotice({
  createdAt,
  action,
}: {
  createdAt: Date;
  action: () => Promise<void>;
}) {
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const remaining = STUCK_THRESHOLD_MS - (Date.now() - createdAt.getTime());
    const timer = setTimeout(() => setStuck(true), Math.max(remaining, 0));
    return () => clearTimeout(timer);
  }, [createdAt]);

  if (!stuck) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <p className="text-xs text-muted-foreground">
        This is taking much longer than usual — it may be stuck.
      </p>
      <form action={action}>
        <SubmitButton
          pendingLabel="Retrying…"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60"
        >
          <RefreshCw size={12} />
          Retry anyway
        </SubmitButton>
      </form>
    </div>
  );
}
