import { z } from "zod";

/**
 * A single proposed redesign direction — never a redesign the AI "applies",
 * only a documented option with trade-offs the designer can choose to
 * pursue. See docs/PRODUCT_VISION.md "Redesign Assistance".
 */
export const redesignDirectionSchema = z.object({
  title: z.string().min(1),
  intent: z.string().min(1),
  benefits: z.array(z.string()).min(1),
  tradeOffs: z.array(z.string()).min(1),
  idealIndustries: z.array(z.string()).min(1),
  visualImpact: z.string().min(1),
  implementationComplexity: z.enum(["low", "medium", "high"]),
  designRationale: z.string().min(1),
});

export type RedesignDirection = z.infer<typeof redesignDirectionSchema>;
