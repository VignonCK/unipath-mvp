-- Phase 1/6 DEC/DGES : ajout de la valeur DEC à l'enum Role
-- (commit requis avant usage de la valeur — migration suivante)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DEC';
