import "server-only";
import { resolveProvider } from "./resolve-provider";
import type { GenerateChatReplyInput } from "./providers/types";

export type { ChatMessage, GenerateChatReplyInput } from "./providers/types";

export async function generateChatReply(input: GenerateChatReplyInput): Promise<string> {
  return resolveProvider().generateChatReply(input);
}
