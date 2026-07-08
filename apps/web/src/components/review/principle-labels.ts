import type { Principle } from "@logoai/shared";

/** Human-readable labels for the 9 product principles — see CLAUDE.md. */
export const PRINCIPLE_LABELS: Record<Principle, string> = {
  "professional-quality-over-speed": "Professional quality over speed",
  "explanation-over-prediction": "Explanation over prediction",
  "iteration-over-replacement": "Iteration over replacement",
  "education-over-automation": "Education over automation",
  "collaboration-over-generation": "Collaboration over generation",
  "transparency-over-black-box": "Transparency over black-box decisions",
  "designer-control-over-ai-control": "Designer control over AI control",
  "maintainability-over-shortcuts": "Maintainability over shortcuts",
  "scalability-over-temporary-solutions": "Scalability over temporary solutions",
};
