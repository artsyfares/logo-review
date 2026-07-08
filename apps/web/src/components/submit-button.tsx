"use client";

import { useFormStatus } from "react-dom";

/** A submit button that disables itself and shows a pending label while its form action runs — several of this app's actions take 20-40s (AI calls) with no other feedback. */
export function SubmitButton({
  children,
  pendingLabel,
  className,
}: {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} aria-busy={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}
