/*
  # Add Macronutrient Tracking to Meals

  1. New Columns
    - `protein_grams` (integer, nullable) - Protein content in grams
    - `carbs_grams` (integer, nullable) - Carbohydrates content in grams
    - `fat_grams` (integer, nullable) - Fat content in grams
  
  2. Notes
    - These fields are optional and will be auto-estimated based on description
    - Users can manually adjust them in the meal form
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'protein_grams'
  ) THEN
    ALTER TABLE meals ADD COLUMN protein_grams integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'carbs_grams'
  ) THEN
    ALTER TABLE meals ADD COLUMN carbs_grams integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meals' AND column_name = 'fat_grams'
  ) THEN
    ALTER TABLE meals ADD COLUMN fat_grams integer;
  END IF;
END $$;