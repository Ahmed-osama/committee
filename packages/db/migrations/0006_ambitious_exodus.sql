CREATE TYPE "public"."assisted_channel" AS ENUM('scout_witnessed', 'phone_operator');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'operator';--> statement-breakpoint
CREATE TABLE "assisted_session_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"operator_id" uuid NOT NULL,
	"channel" "assisted_channel" NOT NULL,
	"script_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "canned_scripts" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"body" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assisted_session_logs" ADD CONSTRAINT "assisted_session_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assisted_session_logs" ADD CONSTRAINT "assisted_session_logs_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assisted_session_logs" ADD CONSTRAINT "assisted_session_logs_script_id_canned_scripts_id_fk" FOREIGN KEY ("script_id") REFERENCES "public"."canned_scripts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
-- COM-35's canned-script constraint is enforced structurally: an operator can only
-- ever reference a script by id from this fixed, seeded set — there is no free-text
-- authoring path anywhere in the operator UI. `body` is the script's transcript (the
-- actual pre-recorded audio itself is explicitly out of scope for this migration,
-- per COM-35's plan) — extending this set later is a new migration, not a code change.
INSERT INTO "canned_scripts" ("id", "label", "body") VALUES
	('welcome', 'Welcome / identity check', 'أهلاً بيك في جراوند تروث. أنا موظف خدمة، مش سمسار — دوري إني أساعدك تستخدم التطبيق، مش إني أاخد قرارات بدالك.'),
	('explain_account_status', 'Explain current account status', 'خليني أقولك وضع حسابك دلوقتي حسب الشاشة اللي قدامي.'),
	('explain_kyc_required', 'Explain KYC verification is required', 'لازم أول حاجة نوثق هويتك بصورة البطاقة وصورة لوشك عشان تقدر تنشر إعلان أو تقبل عرض.'),
	('explain_offer_status', 'Explain a negotiation''s current status', 'عندك عرض حالياً — أنا هقولك تفاصيله، لكن القبول أو الرفض لازم يتم من موبايلك انت شخصياً.'),
	('explain_how_to_accept_or_reject', 'Explain how to accept/reject/counter from their own device', 'عشان تقبل أو ترفض أو تقدم عرض تاني، لازم تدخل بنفسك من موبايلك وتضغط الزرار — أنا مينفعش أعمل ده بدالك.'),
	('explain_how_to_confirm_deal', 'Explain how to confirm a deal closed', 'تأكيد إن الصفقة تمت لازم يتم من موبايلك انت، بعد ما تتأكد إن كل حاجة اتفق عليها فعلاً حصلت.'),
	('closing', 'Closing / no further help needed', 'لو محتاج حاجة تانية اتصل بينا تاني. مع السلامة.')
ON CONFLICT ("id") DO NOTHING;