import { z } from "zod";

/** Prose color commentary, split by angle rather than one undifferentiated paragraph. */
export const colorNarrativeSchema = z.object({
  overallFeel: z.string().min(1),
  harmony: z.string().min(1),
  moodMatch: z.string().min(1),
});

export type ColorNarrative = z.infer<typeof colorNarrativeSchema>;
