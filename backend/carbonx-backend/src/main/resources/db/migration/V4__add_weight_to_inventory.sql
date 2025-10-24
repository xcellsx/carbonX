-- Add weight column to inventory_items table
ALTER TABLE inventory_items
ADD COLUMN weight DECIMAL(10, 4) NOT NULL DEFAULT 1.0;

-- Optional: Update existing rows if any, though likely none exist yet with weight=null
-- UPDATE inventory_items SET weight = 1.0 WHERE weight IS NULL;
