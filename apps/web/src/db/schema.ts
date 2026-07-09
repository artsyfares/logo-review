import {
  pgEnum,
  pgTable,
  text,
  timestamp,
  integer,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import type { AnalysisFacts, LogoReview } from "@logoai/shared";

export const logoKind = pgEnum("logo_kind", ["raster", "vector"]);
export const logoType = pgEnum("logo_type", ["primary", "secondary", "icon"]);
export const reviewStatus = pgEnum("review_status", [
  "pending",
  "complete",
  "failed",
]);
export const messageRole = pgEnum("message_role", ["user", "assistant"]);

/** Mirrors the Clerk user id — Clerk owns identity, this just anchors foreign keys. */
export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user id
  email: text("email").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // Mandatory brand context, collected at project creation — feeds
  // `brandAlignment` in packages/shared's review schema. Was optional
  // (nullable) until ROADMAP.md 1.9m; existing rows were backfilled with a
  // placeholder before this NOT NULL constraint was added.
  brandOverview: text("brand_overview").notNull(),
  customerPersona: text("customer_persona").notNull(),
  valueProposition: text("value_proposition").notNull(),
  // Optional — free text naming brands the designer wants this logo to feel
  // similar to, or to avoid resembling. Kept optional (unlike the three
  // above) since it adds real value but isn't essential to generate a
  // review, and mandating a 4th field at creation risks friction for
  // designers who don't have concrete references in mind yet. Gives the AI
  // concrete visual anchors instead of relying solely on prose personality
  // descriptions, which are a weak signal for a visual medium — see
  // ROADMAP.md 1.9o.
  brandReferences: text("brand_references"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const logoAssets = pgTable("logo_assets", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  storageKey: text("storage_key").notNull(), // R2 object key
  originalFilename: text("original_filename").notNull(),
  contentType: text("content_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  kind: logoKind("kind").notNull(),
  type: logoType("type").notNull().default("primary"),
  version: integer("version").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Matches the `logo_type` enum's own values — kept local rather than importing from `lib/ai` to avoid db/schema depending on app business-logic layers. */
type LogoAssetType = "primary" | "secondary" | "icon";

/**
 * A review is scoped to a PROJECT (one logo family), not a single asset —
 * primary/secondary/icon are variants of the same logo, not separate logos,
 * so there is exactly one review per project rather than one per uploaded
 * type. See ROADMAP.md 1.9l.
 *
 * `reviewData` stores the full structured review shape defined in
 * packages/shared (executive summary, scores, confidence, strengths/
 * weaknesses, redesign directions, ...) — see ROADMAP.md Phase 1.1.
 *
 * `facts` stores the deterministic `services/analysis` output for the
 * PRIMARY logo the review was generated from (palette, contrast,
 * composition, the rendered PNG) — needed so the UI can render real color
 * swatches and a grid overlay on the actual logo instead of re-running
 * analysis on every page view.
 *
 * `siblingFacts` stores the same, keyed by type, for any OTHER uploaded
 * variants (secondary/icon) that were considered when generating this
 * review — see ROADMAP.md 1.9j. Lets the UI show each variant's own real
 * thumbnail next to its recommended use ("use the icon for favicons")
 * instead of only having images for the primary asset.
 */
export const reviews = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  status: reviewStatus("status").notNull().default("pending"),
  reviewData: jsonb("review_data").$type<LogoReview>(),
  facts: jsonb("facts").$type<AnalysisFacts>(),
  siblingFacts: jsonb("sibling_facts").$type<Partial<Record<LogoAssetType, AnalysisFacts>>>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewMessages = pgTable("review_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  reviewId: uuid("review_id")
    .notNull()
    .references(() => reviews.id, { onDelete: "cascade" }),
  role: messageRole("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
