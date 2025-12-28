-- Remove Finance, Inventory, Employee, Analytics, and SuperAdmin related tables
-- This migration drops tables that are no longer needed

-- Drop tables in correct order (respecting foreign key constraints)

-- First drop dependent tables
DROP TABLE IF EXISTS "Payment" CASCADE;
DROP TABLE IF EXISTS "InvoiceItem" CASCADE;
DROP TABLE IF EXISTS "Invoice" CASCADE;

-- Drop inventory related tables
DROP TABLE IF EXISTS "StockMovement" CASCADE;
DROP TABLE IF EXISTS "InventoryItem" CASCADE;
DROP TABLE IF EXISTS "Supplier" CASCADE;

-- Drop super admin table
DROP TABLE IF EXISTS "SuperAdmin" CASCADE;
