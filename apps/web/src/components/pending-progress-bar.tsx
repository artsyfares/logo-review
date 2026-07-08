"use client";

import { useFormStatus } from "react-dom";
import { ProgressBar } from "./progress-bar";

/**
 * A visible, animated progress bar shown while the enclosing form's action
 * is in flight — button-text-only feedback wasn't noticeable enough for
 * the 20-40s AI calls this app makes (review generation, chat replies).
 * Must be rendered inside the <form> it tracks (useFormStatus reads the
 * nearest parent form's status).
 */
export function PendingProgressBar({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <ProgressBar active={pending} label={label} />;
}
