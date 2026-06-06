-- Add household_members table
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS household_members (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid       NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name        text        NOT NULL,
  role        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS household_members_household_id_idx
  ON household_members(household_id);

ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their household members"
  ON household_members FOR ALL
  USING (
    household_id IN (
      SELECT id FROM households WHERE owner_id = auth.uid()
    )
  );
