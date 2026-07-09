import type { BrandContext, LogoType, SiblingVariant } from "./providers/types";

const LOGO_TYPE_NOTE: Record<LogoType, string> = {
  primary:
    "This is the PRIMARY logo — judge it as the main mark across all contexts, full weight on every dimension.",
  secondary:
    "This is a SECONDARY logo — a compact or alternate lockup of the brand, meant to sit alongside the primary mark in constrained spaces. Judge it as that alternate, not as if it needed to carry every brand attribute alone.",
  icon: "This is an ICON/symbol-only mark — weight legibility and recognizability at very small sizes (favicons, app icons, social avatars) heavily; typography and wordmark-specific feedback don't apply unless the icon contains lettering.",
};

/** Text block appended to the AI's user message — logo-type framing plus the mandatory brief. */
export function buildContextBlock(logoType: LogoType, brandContext: BrandContext): string {
  const briefLines = [
    `Brand overview: ${brandContext.brandOverview}`,
    `Customer persona: ${brandContext.customerPersona}`,
    `Value proposition: ${brandContext.valueProposition}`,
  ];
  if (brandContext.brandReferences) {
    briefLines.push(`Brand references (brands to feel similar to, or to avoid): ${brandContext.brandReferences}`);
  }

  const parts = [
    LOGO_TYPE_NOTE[logoType],
    "The designer provided this brief — use it to fill `brandAlignment` and to inform tone/personality judgments elsewhere; do not invent details beyond it:",
    briefLines.join("\n"),
  ];
  if (brandContext.brandReferences) {
    parts.push(
      "Weigh the brand references concretely wherever visual style/tone is being judged (`brandOverviewFit`, color/typography/shape commentary, redesign directions) — treat them as a second, more concrete lens on the same brief, not a separate wishlist. If this mark reads like a brand named as one to avoid, or fails to read like ones it should resemble, say so explicitly.",
    );
  }

  return parts.join("\n\n");
}

/** Text summary of sibling variants — the actual images are attached separately per-provider. */
export function buildSiblingContextText(siblingVariants: SiblingVariant[]): string | null {
  if (siblingVariants.length === 0) {
    return null;
  }

  const lines = siblingVariants.map((variant) => {
    const facts = variant.facts;
    const retention48 = facts.scalability.by_size["48"]?.detail_retention_ratio;
    const dominantColor = facts.palette[0]?.hex ?? "n/a";
    return `- ${variant.type} variant (shown as an additional image below): whitespace ratio ${facts.composition.whitespace_ratio.toFixed(2)}, vertical symmetry ${facts.composition.vertical_symmetry_score?.toFixed(2) ?? "n/a"}, detail retention at 48px ${retention48 !== undefined ? Math.round(retention48 * 100) + "%" : "n/a"}, dominant color ${dominantColor}.`;
  });

  return [
    "This project also includes these other variants of the SAME logo/brand. Treat every uploaded variant as one logo family, not separate logos — reference the other variants explicitly wherever relevant instead of judging this asset in total isolation. In particular:",
    "- `realWorldUsage`: if a dedicated icon variant exists, favor it (not the primary/secondary mark) for favicon/app-icon/social-avatar placements, and say so explicitly.",
    "- Scalability commentary: if the primary mark has scalability concerns but a dedicated icon variant tests well at small sizes, say the family covers that use case even if this specific asset doesn't.",
    "- `deliveryChecklist`: note when a needed variant already exists among the uploads instead of recommending it be created from scratch.",
    "- Consistency: comment if the variants look visually inconsistent with each other (color, shape language, proportions).",
    "",
    lines.join("\n"),
  ].join("\n");
}
