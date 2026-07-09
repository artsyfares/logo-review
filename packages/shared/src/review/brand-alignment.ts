import { z } from "zod";
import { scoredDimensionSchema, confidenceSchema } from "./scored-dimension.ts";
import { principleSchema } from "./principles.ts";

/**
 * How well the logo serves the brand brief the designer provided (brand
 * overview, customer persona, value proposition) — a first-class, required
 * dimension since a brief is now mandatory at project creation, distinct
 * from `categoryScores` which grade the mark on its own visual terms rather
 * than against a specific brand's stated intent. Richer than a plain
 * `scoredDimensionSchema` because "is this aligned" alone doesn't tell a
 * designer what to actually do about it — the three per-aspect fits and
 * `whatToKeep`/`whatToModify` do. Gets its own report tab (ROADMAP.md 1.9n),
 * not just a section, because a brief-mismatch is exactly the kind of thing
 * that gets buried in a long report otherwise.
 */
export const brandAlignmentSchema = z.object({
  score: z
    .number()
    .min(0)
    .max(100)
    .describe(
      "Overall 0 (actively fights the brief) to 100 (the mark could be used as a case study for the brief) — use the full range. Should read as a holistic judgment informed by the three fits below, not a mechanical average of them.",
    ),
  confidence: confidenceSchema,
  summary: z
    .string()
    .min(1)
    .describe("One or two sentences: does this logo read as the brand described in the brief, or not."),
  principles: z.array(principleSchema).min(1),

  brandOverviewFit: scoredDimensionSchema.describe(
    "Does the mark's look and personality actually match the stated brand overview (what the brand is, what it does, its stated personality)? Cite specific visual choices against specific words from the overview.",
  ),
  customerPersonaFit: scoredDimensionSchema.describe(
    "Would the stated customer persona respond to this mark the way the brand needs them to? Reason about the persona's likely taste/expectations, not the brand's own self-image.",
  ),
  valuePropositionFit: scoredDimensionSchema.describe(
    "Does the mark communicate or at least not contradict the stated value proposition? A logo can be well-crafted and still say nothing about (or actively undercut) the promise the brand is making.",
  ),

  whatToKeep: z
    .array(z.string())
    .min(1)
    .describe(
      "Specific aspects of the logo that already serve the brief well and should survive any redesign — cite the actual brief detail each one serves, not generic praise.",
    ),
  whatToModify: z
    .array(z.string())
    .min(1)
    .describe(
      "Specific aspects that work against the brief and should change, each naming the concrete brief detail it clashes with. If the logo already serves the brief with no real friction, say so honestly as the one entry rather than inventing a change for its own sake.",
    ),
});

export type BrandAlignment = z.infer<typeof brandAlignmentSchema>;
