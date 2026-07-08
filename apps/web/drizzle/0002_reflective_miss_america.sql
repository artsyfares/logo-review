CREATE TYPE "public"."logo_type" AS ENUM('primary', 'secondary', 'icon');--> statement-breakpoint
ALTER TABLE "logo_assets" ADD COLUMN "type" "logo_type" DEFAULT 'primary' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "brand_overview" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "customer_persona" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "value_proposition" text;