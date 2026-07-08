import { z } from "zod";

/** One logo-suite variant to prepare (or explicitly skip) before handing files to a client/team. */
export const deliveryChecklistItemSchema = z.object({
  item: z.string().min(1),
  recommended: z.boolean(),
  note: z.string().min(1),
});

export type DeliveryChecklistItem = z.infer<typeof deliveryChecklistItemSchema>;
