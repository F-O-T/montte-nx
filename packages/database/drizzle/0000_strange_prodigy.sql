-- Custom SQL migration file, put your code below! --

-- Add nickname column to bank_account table
ALTER TABLE "bank_account" ADD COLUMN "nickname" text;