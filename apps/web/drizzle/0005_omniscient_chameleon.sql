ALTER TABLE "reviews" DROP CONSTRAINT "reviews_logo_asset_id_logo_assets_id_fk";
--> statement-breakpoint
ALTER TABLE "reviews" ALTER COLUMN "project_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "reviews" DROP COLUMN "logo_asset_id";