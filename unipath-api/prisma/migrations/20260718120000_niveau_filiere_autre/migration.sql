-- Ajoute AUTRE au niveau de filière (durée libre côté demande)
ALTER TABLE `Filiere` MODIFY `niveau` ENUM('LICENCE', 'MASTER', 'AUTRE') NOT NULL;
ALTER TABLE `DemandeAjoutFiliere` MODIFY `niveau` ENUM('LICENCE', 'MASTER', 'AUTRE') NOT NULL;
ALTER TABLE `FiliereReference` MODIFY `niveau` ENUM('LICENCE', 'MASTER', 'AUTRE') NULL;
