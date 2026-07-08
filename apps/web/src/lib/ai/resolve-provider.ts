import "server-only";
import { createAnthropicProvider } from "./providers/anthropic";
import { createGeminiProvider } from "./providers/gemini";
import type { AIReviewProvider } from "./providers/types";

/**
 * Switch providers with AI_PROVIDER=anthropic|gemini in .env.local — no code
 * change needed. Defaults to Gemini (free tier available) since Anthropic's
 * Opus-tier reasoning, while higher quality, costs real money per review;
 * see CLAUDE.md for the trade-off and how to switch back.
 */
export function resolveProvider(): AIReviewProvider {
  const provider = process.env.AI_PROVIDER || "gemini";
  switch (provider) {
    case "anthropic":
      return createAnthropicProvider();
    case "gemini":
      return createGeminiProvider();
    default:
      throw new Error(`Unknown AI_PROVIDER: "${provider}" (expected "anthropic" or "gemini")`);
  }
}
