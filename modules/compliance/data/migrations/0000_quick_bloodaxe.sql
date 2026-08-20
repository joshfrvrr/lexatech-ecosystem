CREATE SCHEMA "compliance";
--> statement-breakpoint
CREATE TYPE "compliance"."status" AS ENUM('compliant', 'at_risk', 'non_compliant', 'pending');--> statement-breakpoint
CREATE TABLE "compliance"."evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"obligation_id" uuid NOT NULL,
	"file_url" varchar(512) NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "compliance"."obligations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"status" "compliance"."status" DEFAULT 'pending' NOT NULL,
	"due_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "compliance"."evidence" ADD CONSTRAINT "evidence_obligation_id_obligations_id_fk" FOREIGN KEY ("obligation_id") REFERENCES "compliance"."obligations"("id") ON DELETE cascade ON UPDATE no action;