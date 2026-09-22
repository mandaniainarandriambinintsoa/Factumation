-- Add fiscal region and Madagascar-specific fields to companies
ALTER TABLE companies
ADD COLUMN IF NOT EXISTS fiscal_region TEXT DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS nif TEXT,
ADD COLUMN IF NOT EXISTS stat TEXT;

-- Add fiscal fields to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS fiscal_region TEXT DEFAULT 'NONE',
ADD COLUMN IF NOT EXISTS siret TEXT,
ADD COLUMN IF NOT EXISTS vat_number TEXT,
ADD COLUMN IF NOT EXISTS nif TEXT,
ADD COLUMN IF NOT EXISTS stat TEXT;;
