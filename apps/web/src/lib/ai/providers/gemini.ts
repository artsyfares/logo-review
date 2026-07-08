import "server-only";
import { GoogleGenAI } from "@google/genai";
import { zodToJsonSchema } from "zod-to-json-schema";
import { logoReviewSchema } from "@logoai/shared";
import { REVIEW_SYSTEM_PROMPT } from "../system-prompt";
import { CHAT_SYSTEM_PROMPT } from "../chat-system-prompt";
import { buildContextBlock, buildSiblingContextText } from "../build-context-block";
import { normalizePrinciplesInReview } from "./normalize-principles";
import { simplifySchemaForGemini } from "./simplify-schema-for-gemini";
import type { AIReviewProvider, GenerateChatReplyInput, GenerateLogoReviewInput } from "./types";

const DEFAULT_MODEL = "gemini-2.5-flash"; // override via GEMINI_MODEL

/**
 * Gemini's structured-output engine rejects schemas above a complexity
 * threshold ("too many states for serving") — confirmed by live testing,
 * not assumed from docs. `$refStrategy: "root"` + `definitionPath: "$defs"`
 * keeps the payload smaller ($ref/$defs are explicitly supported keywords),
 * but the actual fix was `simplifySchemaForGemini` dropping the enum
 * constraint specifically on the array-nested `principles` field — an
 * enum used inside an array multiplies combinatorially, and $ref dedup
 * doesn't reduce that because Gemini resolves refs before measuring
 * complexity. Flat enums (`confidence`, `implementationComplexity`) stay,
 * since they're cheap and meaningfully improve output quality.
 */
const reviewJsonSchema = simplifySchemaForGemini(
  zodToJsonSchema(logoReviewSchema, { $refStrategy: "root", definitionPath: "$defs" }),
);

let _client: GoogleGenAI | undefined;

function getClient(): GoogleGenAI {
  if (!_client) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not set — see .env.example");
    }
    _client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _client;
}

export function createGeminiProvider(): AIReviewProvider {
  return {
    async generateLogoReview({
      imageBase64,
      imageMediaType,
      facts,
      logoType,
      brandContext,
      siblingVariants,
    }: GenerateLogoReviewInput) {
      const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
      const siblingContextText = buildSiblingContextText(siblingVariants);

      const parts: Array<{ text: string } | { inlineData: { data: string; mimeType: string } }> = [
        { inlineData: { data: imageBase64, mimeType: imageMediaType } },
        { text: `Context:\n\n${buildContextBlock(logoType, brandContext)}` },
      ];

      if (siblingContextText) {
        parts.push({ text: siblingContextText });
        for (const sibling of siblingVariants) {
          parts.push({ text: `The following image is the ${sibling.type} variant:` });
          parts.push({ inlineData: { data: sibling.imageBase64, mimeType: "image/png" } });
        }
      }

      parts.push({
        text: `Deterministic facts computed for this logo:\n\n${JSON.stringify(facts, null, 2)}`,
      });

      const response = await getClient().models.generateContent({
        model,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: REVIEW_SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseJsonSchema: reviewJsonSchema,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error(
          `Gemini returned no text output (finishReason=${response.candidates?.[0]?.finishReason})`,
        );
      }

      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch (err) {
        throw new Error(
          `Gemini response was not valid JSON: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      const parsed = logoReviewSchema.safeParse(normalizePrinciplesInReview(json));
      if (!parsed.success) {
        throw new Error(
          `Gemini's review did not match the expected schema: ${parsed.error.message}`,
        );
      }

      return parsed.data;
    },

    async generateChatReply({ review, facts, messages }: GenerateChatReplyInput) {
      const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

      const response = await getClient().models.generateContent({
        model,
        contents: messages.map((message) => ({
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }],
        })),
        config: {
          systemInstruction: `${CHAT_SYSTEM_PROMPT}\n\nThe structured review already produced for this logo:\n\n${JSON.stringify(review, null, 2)}\n\nDeterministic facts it was based on:\n\n${JSON.stringify(facts, null, 2)}`,
        },
      });

      const text = response.text;
      if (!text) {
        throw new Error(
          `Gemini returned no text output (finishReason=${response.candidates?.[0]?.finishReason})`,
        );
      }
      return text;
    },
  };
}
