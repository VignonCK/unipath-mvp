-- Doit être dans sa propre migration (transaction séparée) avant usage dans CREATE TABLE
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ADMIN_ETABLISSEMENT';
