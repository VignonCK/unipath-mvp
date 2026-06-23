-- Seed SQL fallback for environments where Prisma engine file is locked on Windows.
-- This script is idempotent for Module 2 core data.

-- 1) Candidats de test (upsert-like par email)
INSERT INTO "Candidat" ("id", "matricule", "nom", "prenom", "anip", "email", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'UAC-M2-2026-0001', 'ADANDE', 'Mireille', '100000000001', 'module2.etudiant1@unipath.test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Candidat" WHERE "email" = 'module2.etudiant1@unipath.test');

INSERT INTO "Candidat" ("id", "matricule", "nom", "prenom", "anip", "email", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'UAC-M2-2026-0002', 'HOUNGBO', 'Armel', '100000000002', 'module2.etudiant2@unipath.test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Candidat" WHERE "email" = 'module2.etudiant2@unipath.test');

INSERT INTO "Candidat" ("id", "matricule", "nom", "prenom", "anip", "email", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, 'UAC-M2-2026-0003', 'KIKI', 'Nadia', '100000000003', 'module2.etudiant3@unipath.test', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Candidat" WHERE "email" = 'module2.etudiant3@unipath.test');

-- 2) Etablissements (3)
INSERT INTO "Etablissement" ("id", "nom", "type", "ville", "adresse", "email", "createdAt")
SELECT gen_random_uuid()::text, 'Universite d Abomey-Calavi', 'PUBLIC', 'Abomey-Calavi', 'Abomey-Calavi, Benin', 'contact@uac.bj', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Etablissement" WHERE "email" = 'contact@uac.bj');

INSERT INTO "Etablissement" ("id", "nom", "type", "ville", "adresse", "email", "createdAt")
SELECT gen_random_uuid()::text, 'Universite de Parakou', 'PUBLIC', 'Parakou', 'Parakou, Benin', 'contact@up.bj', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Etablissement" WHERE "email" = 'contact@up.bj');

INSERT INTO "Etablissement" ("id", "nom", "type", "ville", "adresse", "email", "createdAt")
SELECT gen_random_uuid()::text, 'ESGT Benin', 'PRIVE', 'Cotonou', 'Cotonou, Benin', 'contact@esgt.bj', NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Etablissement" WHERE "email" = 'contact@esgt.bj');

-- 3) Filieres (5)
WITH etabs AS (
  SELECT id, email FROM "Etablissement"
)
INSERT INTO "Filiere" ("id", "nom", "code", "niveau", "dureeAnnees", "etablissementId", "createdAt")
SELECT gen_random_uuid()::text, 'Genie Info', 'GI-L', 'LICENCE', 3, (SELECT id FROM etabs WHERE email = 'contact@uac.bj'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Filiere" WHERE "code" = 'GI-L');

WITH etabs AS (
  SELECT id, email FROM "Etablissement"
)
INSERT INTO "Filiere" ("id", "nom", "code", "niveau", "dureeAnnees", "etablissementId", "createdAt")
SELECT gen_random_uuid()::text, 'Medecine', 'MED-L', 'LICENCE', 6, (SELECT id FROM etabs WHERE email = 'contact@uac.bj'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Filiere" WHERE "code" = 'MED-L');

WITH etabs AS (
  SELECT id, email FROM "Etablissement"
)
INSERT INTO "Filiere" ("id", "nom", "code", "niveau", "dureeAnnees", "etablissementId", "createdAt")
SELECT gen_random_uuid()::text, 'Droit', 'DR-L', 'LICENCE', 3, (SELECT id FROM etabs WHERE email = 'contact@up.bj'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Filiere" WHERE "code" = 'DR-L');

WITH etabs AS (
  SELECT id, email FROM "Etablissement"
)
INSERT INTO "Filiere" ("id", "nom", "code", "niveau", "dureeAnnees", "etablissementId", "createdAt")
SELECT gen_random_uuid()::text, 'Genie Info', 'GI-M', 'MASTER', 2, (SELECT id FROM etabs WHERE email = 'contact@esgt.bj'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Filiere" WHERE "code" = 'GI-M');

WITH etabs AS (
  SELECT id, email FROM "Etablissement"
)
INSERT INTO "Filiere" ("id", "nom", "code", "niveau", "dureeAnnees", "etablissementId", "createdAt")
SELECT gen_random_uuid()::text, 'Medecine', 'MED-M', 'MASTER', 2, (SELECT id FROM etabs WHERE email = 'contact@up.bj'), NOW()
WHERE NOT EXISTS (SELECT 1 FROM "Filiere" WHERE "code" = 'MED-M');

-- 4) Inscriptions academiques (3)
WITH refs AS (
  SELECT
    (SELECT id FROM "Candidat" WHERE "email" = 'module2.etudiant1@unipath.test') AS c1,
    (SELECT id FROM "Candidat" WHERE "email" = 'module2.etudiant2@unipath.test') AS c2,
    (SELECT id FROM "Candidat" WHERE "email" = 'module2.etudiant3@unipath.test') AS c3,
    (SELECT id FROM "Filiere" WHERE "code" = 'GI-L') AS f1,
    (SELECT id FROM "Filiere" WHERE "code" = 'MED-L') AS f2,
    (SELECT id FROM "Filiere" WHERE "code" = 'DR-L') AS f3,
    (SELECT id FROM "Etablissement" WHERE "email" = 'contact@uac.bj') AS e1,
    (SELECT id FROM "Etablissement" WHERE "email" = 'contact@up.bj') AS e2
)
INSERT INTO "InscriptionAcademique" ("id", "candidatId", "filiereId", "etablissementId", "anneeAcademique", "niveau", "statut", "createdAt")
SELECT gen_random_uuid()::text, c1, f1, e1, '2025-2026', 1, 'EN_COURS', NOW()
FROM refs
WHERE c1 IS NOT NULL AND f1 IS NOT NULL AND e1 IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "InscriptionAcademique" WHERE "candidatId" = c1 AND "filiereId" = f1 AND "anneeAcademique" = '2025-2026'
  );

WITH refs AS (
  SELECT
    (SELECT id FROM "Candidat" WHERE "email" = 'module2.etudiant2@unipath.test') AS c2,
    (SELECT id FROM "Filiere" WHERE "code" = 'MED-L') AS f2,
    (SELECT id FROM "Etablissement" WHERE "email" = 'contact@uac.bj') AS e1
)
INSERT INTO "InscriptionAcademique" ("id", "candidatId", "filiereId", "etablissementId", "anneeAcademique", "niveau", "statut", "createdAt")
SELECT gen_random_uuid()::text, c2, f2, e1, '2024-2025', 2, 'VALIDE', NOW()
FROM refs
WHERE c2 IS NOT NULL AND f2 IS NOT NULL AND e1 IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "InscriptionAcademique" WHERE "candidatId" = c2 AND "filiereId" = f2 AND "anneeAcademique" = '2024-2025'
  );

WITH refs AS (
  SELECT
    (SELECT id FROM "Candidat" WHERE "email" = 'module2.etudiant3@unipath.test') AS c3,
    (SELECT id FROM "Filiere" WHERE "code" = 'DR-L') AS f3,
    (SELECT id FROM "Etablissement" WHERE "email" = 'contact@up.bj') AS e2
)
INSERT INTO "InscriptionAcademique" ("id", "candidatId", "filiereId", "etablissementId", "anneeAcademique", "niveau", "statut", "createdAt")
SELECT gen_random_uuid()::text, c3, f3, e2, '2025-2026', 1, 'REDOUBLANT', NOW()
FROM refs
WHERE c3 IS NOT NULL AND f3 IS NOT NULL AND e2 IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "InscriptionAcademique" WHERE "candidatId" = c3 AND "filiereId" = f3 AND "anneeAcademique" = '2025-2026'
  );

-- 5) Notes (10)
WITH ins AS (
  SELECT
    (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId"
      WHERE c."email" = 'module2.etudiant1@unipath.test' AND f."code" = 'GI-L' AND ia."anneeAcademique" = '2025-2026' LIMIT 1) AS i1,
    (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId"
      WHERE c."email" = 'module2.etudiant2@unipath.test' AND f."code" = 'MED-L' AND ia."anneeAcademique" = '2024-2025' LIMIT 1) AS i2,
    (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId"
      WHERE c."email" = 'module2.etudiant3@unipath.test' AND f."code" = 'DR-L' AND ia."anneeAcademique" = '2025-2026' LIMIT 1) AS i3
)
INSERT INTO "Note" ("id", "inscriptionAcadId", "matiere", "noteCC", "noteExamen", "noteMoyenne", "credits", "semestre", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, i1, 'Algorithmique', 14, 16, ROUND((14*0.4 + 16*0.6)::numeric, 2), 4, 1, NOW(), NOW() FROM ins
WHERE i1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i1 AND "matiere" = 'Algorithmique');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant1@unipath.test' AND f."code"='GI-L' AND ia."anneeAcademique"='2025-2026' LIMIT 1) AS i1)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i1, 'Base de donnees', 13, 15, ROUND((13*0.4 + 15*0.6)::numeric, 2), 5, 1, NOW(), NOW() FROM ins
WHERE i1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i1 AND "matiere" = 'Base de donnees');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant1@unipath.test' AND f."code"='GI-L' AND ia."anneeAcademique"='2025-2026' LIMIT 1) AS i1)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i1, 'Reseaux', 12, 14, ROUND((12*0.4 + 14*0.6)::numeric, 2), 4, 2, NOW(), NOW() FROM ins
WHERE i1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i1 AND "matiere" = 'Reseaux');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant1@unipath.test' AND f."code"='GI-L' AND ia."anneeAcademique"='2025-2026' LIMIT 1) AS i1)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i1, 'Programmation Web', 15, 17, ROUND((15*0.4 + 17*0.6)::numeric, 2), 5, 2, NOW(), NOW() FROM ins
WHERE i1 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i1 AND "matiere" = 'Programmation Web');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant2@unipath.test' AND f."code"='MED-L' AND ia."anneeAcademique"='2024-2025' LIMIT 1) AS i2)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i2, 'Anatomie', 11, 13, ROUND((11*0.4 + 13*0.6)::numeric, 2), 6, 1, NOW(), NOW() FROM ins
WHERE i2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i2 AND "matiere" = 'Anatomie');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant2@unipath.test' AND f."code"='MED-L' AND ia."anneeAcademique"='2024-2025' LIMIT 1) AS i2)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i2, 'Physiologie', 12, 14, ROUND((12*0.4 + 14*0.6)::numeric, 2), 6, 1, NOW(), NOW() FROM ins
WHERE i2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i2 AND "matiere" = 'Physiologie');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant2@unipath.test' AND f."code"='MED-L' AND ia."anneeAcademique"='2024-2025' LIMIT 1) AS i2)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i2, 'Pharmacologie', 13, 12, ROUND((13*0.4 + 12*0.6)::numeric, 2), 5, 2, NOW(), NOW() FROM ins
WHERE i2 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i2 AND "matiere" = 'Pharmacologie');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant3@unipath.test' AND f."code"='DR-L' AND ia."anneeAcademique"='2025-2026' LIMIT 1) AS i3)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i3, 'Droit Civil', 9, 11, ROUND((9*0.4 + 11*0.6)::numeric, 2), 5, 1, NOW(), NOW() FROM ins
WHERE i3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i3 AND "matiere" = 'Droit Civil');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant3@unipath.test' AND f."code"='DR-L' AND ia."anneeAcademique"='2025-2026' LIMIT 1) AS i3)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i3, 'Droit Constitutionnel', 8, 10, ROUND((8*0.4 + 10*0.6)::numeric, 2), 5, 1, NOW(), NOW() FROM ins
WHERE i3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i3 AND "matiere" = 'Droit Constitutionnel');

WITH ins AS (SELECT (SELECT ia.id FROM "InscriptionAcademique" ia JOIN "Candidat" c ON c.id = ia."candidatId" JOIN "Filiere" f ON f.id = ia."filiereId" WHERE c."email"='module2.etudiant3@unipath.test' AND f."code"='DR-L' AND ia."anneeAcademique"='2025-2026' LIMIT 1) AS i3)
INSERT INTO "Note" ("id","inscriptionAcadId","matiere","noteCC","noteExamen","noteMoyenne","credits","semestre","createdAt","updatedAt")
SELECT gen_random_uuid()::text, i3, 'Procedure Penale', 10, 9, ROUND((10*0.4 + 9*0.6)::numeric, 2), 4, 2, NOW(), NOW() FROM ins
WHERE i3 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM "Note" WHERE "inscriptionAcadId" = i3 AND "matiere" = 'Procedure Penale');
