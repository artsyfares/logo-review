import { z } from "zod";

/**
 * Explicit "which uploaded variant goes where" guidance — primary/secondary/
 * icon are facets of one logo family, not separate logos, so the report
 * should say outright which one to reach for in which context instead of
 * only implying it in scattered real-world-usage prose. Only covers
 * variants actually uploaded (see the AI prompt) — a variant that wasn't
 * uploaded is a `deliveryChecklist` gap, not a guidance entry.
 */
export const variantGuidanceItemSchema = z.object({
  type: z.enum(["primary", "secondary", "icon"]),
  recommendedFor: z.array(z.string()).min(1),
  reasoning: z.string().min(1),
});

export type VariantGuidanceItem = z.infer<typeof variantGuidanceItemSchema>;
