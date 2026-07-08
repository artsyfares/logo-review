"use client";

import { useFormStatus } from "react-dom";

/** A submit button that asks for confirmation before letting the form submit, and shows a pending state once it does — for destructive actions. */
export function ConfirmSubmitButton({
  confirmMessage,
  pendingLabel,
  className,
  children,
}: {
  confirmMessage: string;
  pendingLabel: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={className}
      onClick={(e) => {
        if (!confirm(confirmMessage)) {
          e.preventDefault();
        }
      }}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
