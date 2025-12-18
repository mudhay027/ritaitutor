USE ai_tutor_db;

-- Add StaffCode column if it doesn't exist
-- Note: MySQL doesn't support IF NOT EXISTS for ADD COLUMN directly in standard SQL blocks without procedures.
-- Running this line will error if the column exists, which is fine, or we can just run it once.
-- For safety in Workbench, you can run these lines one by one.

ALTER TABLE Users ADD COLUMN StaffCode VARCHAR(10) NULL;
ALTER TABLE Users ADD COLUMN LinkedStaffCode VARCHAR(10) NULL;
