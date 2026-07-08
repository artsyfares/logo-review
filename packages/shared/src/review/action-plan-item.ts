import { z } from "zod";

/**
 * A single prioritized fix — "what to fix first" before the full detailed
 * breakdown. `why` is required so priority is never a bare ranking; see
 * CLAUDE.md's "explanation over prediction" principle.
 */
export const actionPlanItemSchema = z.object({
  issue: z.string().min(1),
  why: z.string().min(1),
  priority: z.enum(["high", "medium", "low"]),
});

export type ActionPlanItem = z.infer<typeof actionPlanItemSchema>;
