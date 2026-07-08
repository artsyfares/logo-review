import type { AnalysisFacts } from "@logoai/shared";
import type { LogoType } from "@/lib/ai/providers/types";
import { pickVariantFacts } from "@/lib/pick-variant-facts";

type Tone = "good" | "warn" | "bad";

const TONE_CLASS: Record<Tone, string> = {
  good: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  warn: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  bad: "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400",
};

const TONE_LABEL: Record<Tone, string> = {
  good: "Ready",
  warn: "Needs attention",
  bad: "Needs work",
};

interface Verdict {
  title: string;
  tone: Tone;
  reasoning: string;
}

function legibilityVerdict(facts: AnalysisFacts, siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null): Verdict | null {
  const picked = pickVariantFacts("app-icon", facts, siblingFacts);
  const at32 = picked.facts.scalability.by_size["32"]?.detail_retention_ratio;
  if (at32 === undefined) return null;

  const pct = Math.round(at32 * 100);
  const variantNote = picked.type !== "primary" ? ` (${picked.type} variant)` : "";
  if (at32 >= 0.75) {
    return { title: "Legible at small sizes", tone: "good", reasoning: `${pct}% detail retained at 32px${variantNote} — safe for favicons and app icons.` };
  }
  if (at32 >= 0.55) {
    return { title: "Legible at small sizes", tone: "warn", reasoning: `${pct}% detail retained at 32px${variantNote} — usable, but fine details may blur at the smallest sizes.` };
  }
  return { title: "Legible at small sizes", tone: "bad", reasoning: `Only ${pct}% detail retained at 32px${variantNote} — likely to lose legibility as a favicon or app icon.` };
}

function contrastVerdict(facts: AnalysisFacts): Verdict | null {
  if (!facts.contrast_checks || facts.contrast_checks.length === 0) return null;
  const dominant = [...facts.contrast_checks].sort((a, b) => b.coverage - a.coverage)[0];
  if (!dominant) return null;

  const ratio = dominant.contrast_vs_own_background ?? Math.max(dominant.contrast_vs_white, dominant.contrast_vs_black);
  const passes = dominant.meets_aa_normal_text_vs_own_background ?? (dominant.meets_aa_normal_text_vs_white || dominant.meets_aa_normal_text_vs_black);
  const against = dominant.contrast_vs_own_background !== null ? "its own background" : "white/black";

  if (passes) {
    return { title: "Accessible contrast", tone: "good", reasoning: `Dominant ink color (${dominant.hex}) has a ${ratio.toFixed(1)}:1 contrast ratio against ${against} — meets WCAG AA (4.5:1).` };
  }
  return { title: "Accessible contrast", tone: "bad", reasoning: `Dominant ink color (${dominant.hex}) only reaches a ${ratio.toFixed(1)}:1 contrast ratio against ${against} — below WCAG AA (4.5:1), risky for any text role.` };
}

function balanceVerdict(facts: AnalysisFacts): Verdict | null {
  const centerOfMass = facts.balance?.center_of_mass;
  if (!centerOfMass) return null;

  const maxOffset = Math.max(centerOfMass.x_offset_pct, centerOfMass.y_offset_pct);
  if (maxOffset < 10) {
    return { title: "Balanced composition", tone: "good", reasoning: `Visual center of mass sits within ${Math.round(maxOffset)}% of the geometric center.` };
  }
  if (maxOffset < 20) {
    return { title: "Balanced composition", tone: "warn", reasoning: `Visual center of mass is offset ${Math.round(maxOffset)}% from center — noticeable but not extreme.` };
  }
  return { title: "Balanced composition", tone: "bad", reasoning: `Visual center of mass is offset ${Math.round(maxOffset)}% from center — the mark reads as lopsided.` };
}

function familyVerdict(siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null): Verdict {
  const hasSecondary = Boolean(siblingFacts?.secondary);
  const hasIcon = Boolean(siblingFacts?.icon);
  if (hasSecondary && hasIcon) {
    return { title: "Variant coverage", tone: "good", reasoning: "Primary, secondary, and icon are all uploaded — the family covers every common placement." };
  }
  if (hasSecondary || hasIcon) {
    return { title: "Variant coverage", tone: "warn", reasoning: `Only primary + ${hasIcon ? "icon" : "secondary"} uploaded — consider adding ${hasIcon ? "a secondary lockup" : "a dedicated icon"} for full coverage.` };
  }
  return { title: "Variant coverage", tone: "warn", reasoning: "Only the primary logo is uploaded — a dedicated icon variant would improve favicon/app-icon results." };
}

/**
 * The scan-in-five-seconds summary for a busy stakeholder — a handful of
 * grounded pass/fail badges (never a bare verdict, each carries the actual
 * measurement behind it) pulled from the same deterministic facts the
 * detailed sections below use, so this is a preview of them, not a
 * separate judgment.
 */
export function DecisionSummarySection({
  facts,
  siblingFacts,
}: {
  facts: AnalysisFacts;
  siblingFacts?: Partial<Record<LogoType, AnalysisFacts>> | null;
}) {
  const verdicts = [
    legibilityVerdict(facts, siblingFacts),
    contrastVerdict(facts),
    balanceVerdict(facts),
    familyVerdict(siblingFacts),
  ].filter((v): v is Verdict => v !== null);

  if (verdicts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {verdicts.map((verdict) => (
        <div key={verdict.title} className={`flex flex-col gap-1 rounded-md border px-3 py-2 ${TONE_CLASS[verdict.tone]}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold">{verdict.title}</span>
            <span className="text-[10px] font-medium uppercase tracking-wide">{TONE_LABEL[verdict.tone]}</span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">{verdict.reasoning}</p>
        </div>
      ))}
    </div>
  );
}
