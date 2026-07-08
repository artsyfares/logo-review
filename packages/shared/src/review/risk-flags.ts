import { z } from "zod";

/**
 * Guarantees docs/PRODUCT_VISION.md's "trademark similarity indicators" and
 * "potential cultural interpretations" are always addressed rather than
 * only surfacing incidentally in strengths/weaknesses when the model
 * happens to mention them. Not scored dimensions (see scored-dimension.ts's
 * comment on why) — always filled in, even if the answer is "no significant
 * risk identified," so a designer never has to wonder whether it was
 * checked at all.
 */
export const riskFlagsSchema = z.object({
  trademarkSimilarity: z.string().min(1),
  culturalSensitivity: z.string().min(1),
});

export type RiskFlags = z.infer<typeof riskFlagsSchema>;
