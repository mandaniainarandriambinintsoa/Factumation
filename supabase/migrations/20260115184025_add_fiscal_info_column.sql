-- Add fiscal_info column to user_preferences table
ALTER TABLE public.user_preferences
ADD COLUMN IF NOT EXISTS fiscal_info JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.user_preferences.fiscal_info IS 'Stores fiscal identification info (region, NIF, STAT for Madagascar, SIRET, TVA for Europe)';;
