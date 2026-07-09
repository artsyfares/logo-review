import { z } from "zod";
import { scoredDimensionSchema } from "./scored-dimension.ts";
import { redesignDirectionSchema } from "./redesign-direction.ts";
import { actionPlanItemSchema } from "./action-plan-item.ts";
import { useCaseReadinessSchema } from "./use-case-readiness.ts";
import { deliveryChecklistItemSchema } from "./delivery-checklist-item.ts";
import { marketFitSchema } from "./market-fit.ts";
import { presentationKitSchema } from "./presentation-kit.ts";
import { riskFlagsSchema } from "./risk-flags.ts";
import { variantGuidanceItemSchema } from "./variant-guidance-item.ts";
import { colorNarrativeSchema } from "./color-narrative.ts";
import { brandAlignmentSchema } from "./brand-alignment.ts";

/**
 * Scored dimensions from docs/PRODUCT_VISION.md's analysis list that are
 * genuinely gradeable on their own axis. Facts that inform judgment but
 * aren't themselves a "score" (industry conventions, cultural/misreading
 * risk, trademark similarity) surface as reasoning/strengths/weaknesses
 * prose instead of forcing an arbitrary number onto them.
 */
export const categoryScoresSchema = z.object({
  typography: scoredDimensionSchema,
  composition: scoredDimensionSchema,
  colorPalette: scoredDimensionSchema,
  scalability: scoredDimensionSchema,
  accessibility: scoredDimensionSchema,
  shapeLanguage: scoredDimensionSchema,
  brandPersonality: scoredDimensionSchema,
  visualUniqueness: scoredDimensionSchema,
});

export type CategoryScores = z.infer<typeof categoryScoresSchema>;

export const logoReviewSchema = z.object({
  executiveSummary: z.string().min(1),
  overallQuality: scoredDimensionSchema,
  professionalAssessment: z.string().min(1),
  strengths: z.array(z.string()).min(1),
  weaknesses: z.array(z.string()).min(1),
  immediateImprovementOpportunities: z.array(z.string()).min(1),
  categoryScores: categoryScoresSchema,
  redesignDirections: z.array(redesignDirectionSchema).min(1).max(5),
  colorRecommendations: z.array(z.string()),
  typographyRecommendations: z.array(z.string()),
  layoutRecommendations: z.array(z.string()),
  accessibilityAssessment: scoredDimensionSchema,
  scalabilityAssessment: scoredDimensionSchema,
  industryComparison: z.string().min(1),
  productionReadiness: scoredDimensionSchema,
  clientPresentationReadiness: scoredDimensionSchema,

  /** Risk the mark is misread or misinterpreted (a distinct symbol, a different word, an unintended shape). */
  misinterpretationRisk: scoredDimensionSchema,
  /**
   * How well the logo matches the mandatory brand brief (overview, customer
   * persona, value proposition) provided at project creation, plus concrete
   * keep/modify guidance — see docs/PRODUCT_VISION.md and ROADMAP.md 1.9m.
   */
  brandAlignment: brandAlignmentSchema,

  /** Prioritized "what to fix first," surfaced ahead of the full detailed breakdown. */
  actionPlan: z.array(actionPlanItemSchema).min(1),
  /** Where this logo is ready to use today, and where it would break. */
  realWorldUsage: z.array(useCaseReadinessSchema).min(1),
  /** Whether the logo feels expected, distinctive, or risky inside its category. */
  marketFit: marketFitSchema,
  /** Logo-suite variants to prepare before handing files to a client or team. */
  deliveryChecklist: z.array(deliveryChecklistItemSchema).min(1),
  /** Copy-ready material for presenting/finalizing this logo. */
  presentationKit: presentationKitSchema,
  /** Trademark-similarity and cultural-interpretation risk — always addressed, never left implicit. */
  riskFlags: riskFlagsSchema,
  /** Explicit "which uploaded variant goes where" — only for variants actually uploaded (self + siblings). */
  variantGuidance: z.array(variantGuidanceItemSchema).min(1),

  /** Short adjectives capturing the brand personality at a glance (3-6 words, e.g. "Playful", "Credible"). */
  brandPersonalityTags: z.array(z.string()).min(3).max(6),
  /** Who this logo is likely aimed at, as short labels (e.g. "Family-oriented brands"). */
  estimatedTargetMarket: z.array(z.string()).min(1),
  /** What a viewer's mind jumps to on seeing this mark (e.g. "Smiley face", "Confetti"). */
  possibleAssociations: z.array(z.string()).min(1),
  /** Color commentary split by angle rather than one undifferentiated paragraph. */
  colorNarrative: colorNarrativeSchema,
});

export type LogoReview = z.infer<typeof logoReviewSchema>;
