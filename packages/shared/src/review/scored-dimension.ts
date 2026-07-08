import { z } from "zod";
import { principleSchema } from "./principles.ts";

export const confidenceSchema = z.enum(["low", "medium", "high"]);
export type Confidence = z.infer<typeof confidenceSchema>;

/**
 * The ONLY place a numeric score is allowed to appear anywhere in the review
 * schema. CLAUDE.md: "Never emit a bare score — every score/verdict ships
 * with the reasoning, the principles invoked, and a confidence level." There
 * is deliberately no exported schema for a bare `z.number()` score — every
 * score field in logo-review.ts is a `scoredDimensionSchema`, so the shape
 * itself, not just review convention, prevents a number from reaching the UI
 * without its justification attached.
 */
export const scoredDimensionSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Score from 0 (worst) to 100 (best) — use the full 0-100 range, not a 1-10 or 1-5 scale.",
    ),
  confidence: confidenceSchema,
  reasoning: z.string().min(1),
  principles: z.array(principleSchema).min(1),
});

export type ScoredDimension = z.infer<typeof scoredDimensionSchema>;
