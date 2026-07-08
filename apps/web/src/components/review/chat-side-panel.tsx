"use client";

import { useCallback, useState } from "react";
import { MessageCircle, X } from "react-feather";
import { ReviewChat, type ReviewChatMessage } from "./review-chat";

const TRANSITION_MS = 300;

/** The follow-up chat, moved out of the page flow into a collapsible panel so it doesn't push the report down. */
export function ChatSidePanel({
  reviewId,
  messages,
}: {
  reviewId: string;
  messages: ReviewChatMessage[];
}) {
  // Mounted controls whether the panel exists in the DOM at all; open controls
  // its animated position/opacity. Kept separate so closing can play the
  // slide-out transition before the panel actually unmounts, instead of
  // vanishing instantly.
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => {
    setIsMounted(true);
    // Mount in the off-screen position first, then flip to open on the next
    // paint — animating the very same frame the element mounts in would
    // just skip straight to the end state instead of transitioning.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsOpen(true));
    });
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimeout(() => setIsMounted(false), TRANSITION_MS);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={open}
        hidden={isMounted}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-sm font-medium text-accent-foreground shadow-lg transition-transform hover:scale-105 hover:opacity-90 active:scale-95"
      >
        <MessageCircle size={16} />
        Ask about this review
      </button>

      {isMounted && (
        <div
          className={`fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={close}
        >
          <div
            className={`relative flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-2xl transition-transform duration-300 ease-out ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <MessageCircle size={16} />
                </span>
                <span className="text-sm font-semibold">Ask about this review</span>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Close chat"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>
            </div>
            <ReviewChat reviewId={reviewId} messages={messages} />
          </div>
        </div>
      )}
    </>
  );
}
