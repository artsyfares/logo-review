import { z } from "zod";

/** Is this logo actually ready for a specific real-world placement, or would it break there? */
export const useCaseReadinessSchema = z.object({
  useCase: z.string().min(1),
  readiness: z.enum(["ready", "needs-adjustment", "not-suitable"]),
  note: z.string().min(1),
});

export type UseCaseReadiness = z.infer<typeof useCaseReadinessSchema>;
