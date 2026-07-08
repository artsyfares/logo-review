import type { AnalysisFacts } from "@logoai/shared";
import type { LogoType } from "./ai/providers/types";
import type { MockupType } from "@/components/review/logo-context-mockup";

const ICON_FIRST: LogoType[] = ["icon", "secondary", "primary"];
const PRIMARY_FIRST: LogoType[] = ["primary", "secondary", "icon"];

const PREFERENCE_BY_MOCKUP: Record<MockupType, LogoType[]> = {
  favicon: ICON_FIRST,
  "app-icon": ICON_FIRST,
  avatar: ICON_FIRST,
  header: PRIMARY_FIRST,
  print: PRIMARY_FIRST,
  merchandise: PRIMARY_FIRST,
  "email-signature": PRIMARY_FIRST,
};

/**
 * Picks which uploaded variant's own facts/image best represents a given
 * mockup context — e.g. the dedicated icon for a favicon mockup, not the
 * primary mark force-shrunk into a tiny box. Falls through the preference
 * order to whichever variant was actually uploaded, ending at primary
 * (always present) if none of the more specific variants exist.
 */
export function pickVariantFacts(
  mockupType: MockupType,
  primaryFacts: AnalysisFacts,
  siblingFacts: Partial<Record<LogoType, AnalysisFacts>> | null | undefined,
): { facts: AnalysisFacts; type: LogoType } {
  const preference = PREFERENCE_BY_MOCKUP[mockupType];
  for (const type of preference) {
    if (type === "primary") {
      return { facts: primaryFacts, type: "primary" };
    }
    const candidate = siblingFacts?.[type];
    if (candidate) {
      return { facts: candidate, type };
    }
  }
  return { facts: primaryFacts, type: "primary" };
}
