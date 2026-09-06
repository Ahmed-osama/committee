CREATE TYPE "public"."credit_ledger_reason" AS ENUM('purchase', 'reveal');--> statement-breakpoint
CREATE TYPE "public"."credit_purchase_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "contact_reveals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"listing_id" uuid NOT NULL,
	"buyer_id" uuid NOT NULL,
	"credits_spent" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "contact_reveals_listing_id_buyer_id_unique" UNIQUE("listing_id","buyer_id")
);
--> statement-breakpoint
CREATE TABLE "credit_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"amount" integer NOT NULL,
	"reason" "credit_ledger_reason" NOT NULL,
	"reference_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "credit_purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"provider_reference" text NOT NULL,
	"package_id" text NOT NULL,
	"credits" integer NOT NULL,
	"price_egp" integer NOT NULL,
	"status" "credit_purchase_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "credit_purchases_provider_reference_unique" UNIQUE("provider_reference")
);
--> statement-breakpoint
ALTER TABLE "contact_reveals" ADD CONSTRAINT "contact_reveals_listing_id_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contact_reveals" ADD CONSTRAINT "contact_reveals_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_ledger_entries" ADD CONSTRAINT "credit_ledger_entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_purchases" ADD CONSTRAINT "credit_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;