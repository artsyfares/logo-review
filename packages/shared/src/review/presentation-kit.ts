import { z } from "zod";

/** Copy-ready material for presenting/finalizing this logo to a client. */
export const presentationKitSchema = z.object({
  logoDescription: z.string().min(1),
  positioningStatement: z.string().min(1),
  designRationale: z.string().min(1),
  presentationTips: z.array(z.string()).min(1),
});

export type PresentationKit = z.infer<typeof presentationKitSchema>;
