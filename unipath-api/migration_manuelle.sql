-- ============================================
-- Migration Manuelle UniPath - Flux Candidat
-- Date: 6 mai 2026
-- ============================================

-- Cette migration ajoute les champs nécessaires pour :
-- 1. ANIP et série du candidat
-- 2. Confirmation d'email
-- 3. Filtrage des concours par série
-- 4. Numéro d'inscription unique

-- ============================================
-- 1. Modèle Candidat
-- ============================================

-- Ajouter la colonne ANIP (identifiant national)
ALTER TABLE "Candidat" 
ADD COLUMN IF NOT EXISTS "anip" TEXT;

-- Ajouter la colonne série (A, B, C, D, E, F, G)
ALTER TABLE "Candidat" 
ADD COLUMN IF NOT EXISTS "serie" TEXT;

-- Ajouter la colonne emailConfirme (pour la confirmation par email)
ALTER TABLE "Candidat" 
ADD COLUMN IF NOT EXISTS "emailConfirme" BOOLEAN DEFAULT false;

-- Mettre à jour les candidats existants (emailConfirme = false par défaut)
UPDATE "Candidat" 
SET "emailConfirme" = false 
WHERE "emailConfirme" IS NULL;

-- ============================================
-- 2. Modèle Concours
-- ============================================

-- Ajouter la colonne seriesAcceptees (tableau de séries)
ALTER TABLE "Concours" 
ADD COLUMN IF NOT EXISTS "seriesAcceptees" TEXT[] DEFAULT '{}';

-- Mettre à jour les concours existants (tableau vide = ouvert à tous)
UPDATE "Concours" 
SET "seriesAcceptees" = '{}' 
WHERE "seriesAcceptees" IS NULL;

-- ============================================
-- 3. Modèle Inscription
-- ============================================

-- Ajouter la colonne numeroInscription (numéro unique)
ALTER TABLE "Inscription" 
ADD COLUMN IF NOT EXISTS "numeroInscription" TEXT;

-- Créer l'index unique sur numeroInscription
CREATE UNIQUE INDEX IF NOT EXISTS "Inscription_numeroInscription_key" 
ON "Inscription"("numeroInscription");

-- ============================================
-- 4. Vérification
-- ============================================

-- Vérifier les colonnes ajoutées au modèle Candidat
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Candidat' 
  AND column_name IN ('anip', 'serie', 'emailConfirme')
ORDER BY ordinal_position;

-- Vérifier les colonnes ajoutées au modèle Concours
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Concours' 
  AND column_name = 'seriesAcceptees'
ORDER BY ordinal_position;

-- Vérifier les colonnes ajoutées au modèle Inscription
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'Inscription' 
  AND column_name = 'numeroInscription'
ORDER BY ordinal_position;

-- Vérifier l'index unique
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'Inscription' 
  AND indexname = 'Inscription_numeroInscription_key';

-- ============================================
-- 5. Statistiques
-- ============================================

-- Compter les candidats par série
SELECT 
    COALESCE(serie, 'Non renseigné') as serie,
    COUNT(*) as nombre_candidats
FROM "Candidat"
GROUP BY serie
ORDER BY nombre_candidats DESC;

-- Compter les concours par nombre de séries acceptées
SELECT 
    CASE 
        WHEN ARRAY_LENGTH("seriesAcceptees", 1) IS NULL OR ARRAY_LENGTH("seriesAcceptees", 1) = 0 
        THEN 'Ouvert à tous'
        ELSE ARRAY_LENGTH("seriesAcceptees", 1)::TEXT || ' série(s)'
    END as restriction,
    COUNT(*) as nombre_concours
FROM "Concours"
GROUP BY restriction
ORDER BY nombre_concours DESC;

-- Compter les inscriptions avec/sans numéro
SELECT 
    CASE 
        WHEN "numeroInscription" IS NOT NULL THEN 'Avec numéro'
        ELSE 'Sans numéro'
    END as statut,
    COUNT(*) as nombre_inscriptions
FROM "Inscription"
GROUP BY statut;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================

-- Si tout s'est bien passé, vous devriez voir :
-- ✅ 3 nouvelles colonnes dans Candidat (anip, serie, emailConfirme)
-- ✅ 1 nouvelle colonne dans Concours (seriesAcceptees)
-- ✅ 1 nouvelle colonne dans Inscription (numeroInscription)
-- ✅ 1 index unique sur Inscription.numeroInscription

-- Vous pouvez maintenant :
-- 1. Redémarrer le serveur backend : npm start
-- 2. Tester l'inscription avec ANIP et série
-- 3. Créer un concours avec des séries spécifiques
-- 4. Vérifier le filtrage des concours
-- 5. S'inscrire et vérifier la génération du numéro unique
