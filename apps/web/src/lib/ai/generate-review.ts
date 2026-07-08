import "server-only";
import type { LogoReview } from "@logoai/shared";
import { resolveProvider } from "./resolve-provider";
import type { GenerateLogoReviewInput } from "./providers/types";

export type { GenerateLogoReviewInput, SupportedImageMediaType } from "./providers/types";

export async function generateLogoReview(input: GenerateLogoReviewInput): Promise<LogoReview> {
  return resolveProvider().generateLogoReview(input);
}
