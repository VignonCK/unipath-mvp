-- Ajout du rôle ETUDIANT (compte plateforme) ; CANDIDAT reste pour rétrocompatibilité
-- Note: la valeur par défaut est dans la migration suivante (PostgreSQL exige un commit entre les deux)
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'ETUDIANT';