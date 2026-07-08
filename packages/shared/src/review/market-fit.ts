import { z } from "zod";

/** Does the logo feel expected, distinctive, or risky within its category? */
export const marketFitSchema = z.object({
  categorySignal: z.string().min(1),
  standoutRisk: z.string().min(1),
});

export type MarketFit = z.infer<typeof marketFitSchema>;
