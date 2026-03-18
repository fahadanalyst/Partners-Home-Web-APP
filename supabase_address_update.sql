-- Update patients table: rename and add columns
ALTER TABLE patients RENAME COLUMN address_line1 TO street;
ALTER TABLE patients RENAME COLUMN address_line2 TO apt;
ALTER TABLE patients RENAME COLUMN zip_code TO zip;

-- Update medical_providers table: add structured address columns
ALTER TABLE medical_providers ADD COLUMN street TEXT;
ALTER TABLE medical_providers ADD COLUMN apt TEXT;
ALTER TABLE medical_providers ADD COLUMN city TEXT;
ALTER TABLE medical_providers ADD COLUMN state TEXT;
ALTER TABLE medical_providers ADD COLUMN zip TEXT;

-- Update referrals table: add structured address columns
ALTER TABLE referrals ADD COLUMN street TEXT;
ALTER TABLE referrals ADD COLUMN apt TEXT;
ALTER TABLE referrals ADD COLUMN city TEXT;
ALTER TABLE referrals ADD COLUMN state TEXT;
ALTER TABLE referrals ADD COLUMN zip TEXT;
