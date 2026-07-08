import type { AnalysisFacts, LogoReview } from "@logoai/shared";

/** Every provider must accept a raster image — SVGs are rasterized upstream
 * (services/analysis already does this internally for its own facts
 * computation; callers of this module must do the same before invoking it). */
export type SupportedImageMediaType = "image/png" | "image/jpeg" | "image/gif" | "image/webp";

export type LogoType = "primary" | "secondary" | "icon";

/** Optional, designer-provided brief — considered when present, otherwise
 * `briefAlignment` on the resulting review is null rather than guessed at. */
export interface BrandContext {
  brandOverview?: string | null;
  customerPersona?: string | null;
  valueProposition?: string | null;
}

/** Another uploaded variant of the SAME logo/brand (e.g. the icon, when reviewing the primary mark). */
export interface SiblingVariant {
  type: LogoType;
  imageBase64: string;
  facts: AnalysisFacts;
}

export interface GenerateLogoReviewInput {
  imageBase64: string;
  imageMediaType: SupportedImageMediaType;
  facts: AnalysisFacts;
  logoType: LogoType;
  brandContext: BrandContext | null;
  /** Other primary/secondary/icon variants uploaded to the same project, if any — treat as one logo family. */
  siblingVariants: SiblingVariant[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GenerateChatReplyInput {
  review: LogoReview;
  facts: AnalysisFacts;
  /** Full ordered history for this review's thread, including the latest user message. */
  messages: ChatMessage[];
}

export interface AIReviewProvider {
  generateLogoReview(input: GenerateLogoReviewInput): Promise<LogoReview>;
  generateChatReply(input: GenerateChatReplyInput): Promise<string>;
}
