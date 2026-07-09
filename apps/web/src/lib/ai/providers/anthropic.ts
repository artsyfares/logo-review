import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logoReviewSchema } from "@logoai/shared";
import { REVIEW_SYSTEM_PROMPT } from "../system-prompt";
import { CHAT_SYSTEM_PROMPT } from "../chat-system-prompt";
import { buildContextBlock, buildSiblingContextText } from "../build-context-block";
import { withNetworkRetry } from "../with-network-retry";
import type { AIReviewProvider, GenerateChatReplyInput, GenerateLogoReviewInput } from "./types";

const MODEL = "claude-opus-4-8";
const MAX_TOKENS = 8192;
const TOOL_NAME = "submit_logo_review";

/**
 * `$refStrategy: "none"` fully inlines the schema (no `$ref`/`definitions`)
 * even though `scoredDimensionSchema` repeats ~13 times — a JSON Schema
 * subset with internal $ref support isn't guaranteed across every tool-use
 * consumer, so inlining trades a larger tool definition for guaranteed
 * compatibility.
 */
const reviewTool: Anthropic.Tool = {
  name: TOOL_NAME,
  description:
    "Submit the complete structured design review for this logo. Every field is required — do not omit sections or leave arrays empty.",
  input_schema: zodToJsonSchema(logoReviewSchema, {
    $refStrategy: "none",
  }) as Anthropic.Tool.InputSchema,
};

let _client: Anthropic | undefined;

function getClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error("ANTHROPIC_API_KEY is not set — see .env.example");
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export function createAnthropicProvider(): AIReviewProvider {
  return {
    async generateLogoReview({
      imageBase64,
      imageMediaType,
      facts,
      logoType,
      brandContext,
      siblingVariants,
    }: GenerateLogoReviewInput) {
      const siblingContextText = buildSiblingContextText(siblingVariants);

      const content: Anthropic.ContentBlockParam[] = [
        {
          type: "image",
          source: { type: "base64", media_type: imageMediaType, data: imageBase64 },
        },
        {
          type: "text",
          text: `Context:\n\n${buildContextBlock(logoType, brandContext)}`,
        },
      ];

      if (siblingContextText) {
        content.push({ type: "text", text: siblingContextText });
        for (const sibling of siblingVariants) {
          content.push({
            type: "text",
            text: `The following image is the ${sibling.type} variant:`,
          });
          content.push({
            type: "image",
            source: { type: "base64", media_type: "image/png", data: sibling.imageBase64 },
          });
        }
      }

      content.push({
        type: "text",
        text: `Deterministic facts computed for this logo:\n\n${JSON.stringify(facts, null, 2)}`,
      });

      const response = await withNetworkRetry(() =>
        getClient().messages.create({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: REVIEW_SYSTEM_PROMPT,
          tools: [reviewTool],
          tool_choice: { type: "tool", name: TOOL_NAME },
          messages: [{ role: "user", content }],
        }),
      );

      if (response.stop_reason === "refusal") {
        throw new Error("Review generation was declined by Claude's safety systems");
      }

      const toolUseBlock = response.content.find((block) => block.type === "tool_use");
      if (!toolUseBlock || toolUseBlock.type !== "tool_use") {
        throw new Error(
          `Expected a tool_use block from Claude but got stop_reason=${response.stop_reason}`,
        );
      }

      const parsed = logoReviewSchema.safeParse(toolUseBlock.input);
      if (!parsed.success) {
        throw new Error(
          `Claude's review did not match the expected schema: ${parsed.error.message}`,
        );
      }

      return parsed.data;
    },

    async generateChatReply({ review, facts, messages }: GenerateChatReplyInput) {
      const response = await withNetworkRetry(() =>
        getClient().messages.create({
          model: MODEL,
          max_tokens: 1024,
          system: `${CHAT_SYSTEM_PROMPT}\n\nThe structured review already produced for this logo:\n\n${JSON.stringify(review, null, 2)}\n\nDeterministic facts it was based on:\n\n${JSON.stringify(facts, null, 2)}`,
          messages: messages.map((message) => ({ role: message.role, content: message.content })),
        }),
      );

      const textBlock = response.content.find((block) => block.type === "text");
      if (!textBlock || textBlock.type !== "text") {
        throw new Error(`Expected a text reply from Claude but got stop_reason=${response.stop_reason}`);
      }
      return textBlock.text;
    },
  };
}
