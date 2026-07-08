import { z } from "zod";

/**
 * The 9 product principles from docs/PRODUCT_VISION.md. Every scored
 * dimension must cite at least one — this is how "which principles
 * influenced the evaluation" (CLAUDE.md) becomes a checkable field instead
 * of prose the model might skip.
 */
export const PRINCIPLES = [
  "professional-quality-over-speed",
  "explanation-over-prediction",
  "iteration-over-replacement",
  "education-over-automation",
  "collaboration-over-generation",
  "transparency-over-black-box",
  "designer-control-over-ai-control",
  "maintainability-over-shortcuts",
  "scalability-over-temporary-solutions",
] as const;

export const principleSchema = z.enum(PRINCIPLES);
export type Principle = z.infer<typeof principleSchema>;
