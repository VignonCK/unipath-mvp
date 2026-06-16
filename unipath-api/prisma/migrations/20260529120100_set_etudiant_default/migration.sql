-- Nouveaux comptes : ETUDIANT par défaut (les comptes CANDIDAT existants sont inchangés)
ALTER TABLE "Candidat" ALTER COLUMN "role" SET DEFAULT 'ETUDIANT'::"Role";
