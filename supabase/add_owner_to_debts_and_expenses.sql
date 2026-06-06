-- Add owner column to debts and expenses tables
-- Run this in the Supabase SQL editor

ALTER TABLE debts ADD COLUMN IF NOT EXISTS owner text;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS owner text;
