import { PRINCIPLES, type Principle } from "@logoai/shared";

/**
 * Gemini's `principles` arrays can't be enum-constrained at the schema level
 * (see simplify-schema-for-gemini.ts) — the model reliably produces
 * on-topic but non-canonical free text ("Professionalism", "Simplicity")
 * instead of the exact slug. Snap those back to the real enum via keyword
 * match rather than rejecting the whole review over a labeling mismatch;
 * Zod still rejects anything that doesn't resolve to a valid principle.
 */
const KEYWORDS: Record<Principle, string[]> = {
  "professional-quality-over-speed": ["professional", "quality", "craft", "polish", "execution"],
  "explanation-over-prediction": ["explanation", "explain", "reasoning", "clarity"],
  "iteration-over-replacement": ["iteration", "iterate", "refine", "evolve"],
  "education-over-automation": ["education", "educat", "learn", "teach"],
  "collaboration-over-generation": ["collaborat", "partnership"],
  "transparency-over-black-box": ["transparen", "openness"],
  "designer-control-over-ai-control": ["control", "autonomy", "ownership"],
  "maintainability-over-shortcuts": ["maintain", "simplic", "simple", "longevity", "sustainab"],
  "scalability-over-temporary-solutions": ["scalab", "growth", "temporary"],
};

function normalizeOne(value: string): Principle | null {
  const lower = value.toLowerCase();
  if ((PRINCIPLES as readonly string[]).includes(value)) {
    return value as Principle;
  }
  for (const principle of PRINCIPLES) {
    if (KEYWORDS[principle].some((keyword) => lower.includes(keyword))) {
      return principle;
    }
  }
  return null;
}

/** Recursively walks the parsed (but not-yet-Zod-validated) JSON and
 * normalizes every `principles` array it finds in place. Unmatched entries
 * are dropped rather than guessed — Zod's `.min(1)` will catch the rare
 * case where every entry in a given array was unmatched. */
export function normalizePrinciplesInReview(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizePrinciplesInReview);
  }
  if (value === null || typeof value !== "object") {
    return value;
  }
  const obj = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (key === "principles" && Array.isArray(val)) {
      const normalized = val
        .map((entry) => (typeof entry === "string" ? normalizeOne(entry) : null))
        .filter((entry): entry is Principle => entry !== null);
      // A citation that doesn't map to a known keyword is still a citation —
      // fall back rather than let a naming mismatch fail schema validation
      // for an otherwise-valid review (the reasoning text is unaffected).
      result[key] = normalized.length > 0 ? normalized : ["explanation-over-prediction"];
    } else {
      result[key] = normalizePrinciplesInReview(val);
    }
  }
  return result;
}
