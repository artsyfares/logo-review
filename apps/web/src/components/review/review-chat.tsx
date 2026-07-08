import { MessageCircle, Send } from "react-feather";
import { sendReviewMessage } from "@/app/projects/actions";
import { SubmitButton } from "@/components/submit-button";
import { PendingProgressBar } from "@/components/pending-progress-bar";

export interface ReviewChatMessage {
  role: "user" | "assistant";
  content: string;
}

function ChatBubble({ message }: { message: ReviewChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex animate-message-in ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "rounded-br-sm bg-accent text-accent-foreground"
            : "rounded-bl-sm bg-muted text-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}

/** Follow-up conversation about an already-generated review — see ROADMAP.md 1.6. Always rendered inside `ChatSidePanel`, which supplies the panel's own header/chrome. */
export function ReviewChat({
  reviewId,
  messages,
}: {
  reviewId: string;
  messages: ReviewChatMessage[];
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <MessageCircle size={22} />
            </span>
            <p className="text-sm font-medium">Ask anything about this review</p>
            <p className="max-w-[220px] text-xs text-muted-foreground">
              e.g. &ldquo;Explain why this feels unbalanced&rdquo; or &ldquo;suggest three modern
              redesign directions.&rdquo;
            </p>
          </div>
        ) : (
          messages.map((message, index) => <ChatBubble key={index} message={message} />)
        )}
      </div>

      <form
        action={sendReviewMessage.bind(null, reviewId)}
        className="flex flex-col gap-2 border-t border-border px-5 py-4"
      >
        <textarea
          name="content"
          required
          rows={2}
          placeholder="e.g. Explain why this feels unbalanced, or suggest three modern redesign directions."
          className="w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <SubmitButton
          pendingLabel="Thinking…"
          className="flex items-center gap-1.5 self-end rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
        >
          <Send size={12} />
          Send
        </SubmitButton>
        <PendingProgressBar label="Thinking about your question…" />
      </form>
    </div>
  );
}
