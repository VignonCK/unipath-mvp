const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

class PDFService {
  constructor() {
    this.phpPath = 'php'; // Commande PHP (ajuster si nécessaire)
    this.tempDir = path.join(__dirname, '../../temp');
    
    // Créer le dossier temp s'il n'existe pas
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Génère une fiche de pré-inscription en PDF
   */
  async genererFichePreInscription(data) {
    const { candidat, concours, numeroDossier } = data;
    
    // Créer un fichier JSON temporaire avec les données
    const inputFile = path.join(this.tempDir, `input-preinscription-${Date.now()}.json`);
    const outputFile = path.join(this.tempDir, `fiche-preinscription-${numeroDossier}.pdf`);
    
    try {
      // Écrire les données dans un fichier JSON
      await writeFileAsync(inputFile, JSON.stringify({
        candidat,
        concours,
        numeroDossier
      }));

      // Appeler le script PHP
      const phpScript = path.join(__dirname, '../../php/fiche-preinscription.php');
      const command = `${this.phpPath} "${phpScript}" "${inputFile}" "${outputFile}"`;
      
      console.log('📄 Génération fiche pré-inscription PDF...');
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Succès')) {
        console.error('Erreur PHP:', stderr);
        throw new Error('Erreur lors de la génération du PDF');
      }
      
      console.log('✅ Fiche pré-inscription générée:', outputFile);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(outputFile)) {
        throw new Error('Le fichier PDF n\'a pas été créé');
      }
      
      return {
        success: true,
        filePath: outputFile,
        fileName: `fiche-preinscription-${numeroDossier}.pdf`
      };
      
    } catch (error) {
      console.error('❌ Erreur génération fiche pré-inscription:', error);
      throw error;
    } finally {
      // Nettoyer le fichier JSON temporaire
      try {
        if (fs.existsSync(inputFile)) {
          await unlinkAsync(inputFile);
        }
      } catch (err) {
        console.error('Erreur nettoyage fichier temporaire:', err);
      }
    }
  }

  /**
   * Génère une convocation en PDF
   */
  async genererConvocation(data) {
    const { candidat, concours } = data;
    
    // Créer un fichier JSON temporaire avec les données
    const inputFile = path.join(this.tempDir, `input-convocation-${Date.now()}.json`);
    const outputFile = path.join(this.tempDir, `convocation-${candidat.matricule}.pdf`);
    
    try {
      // Écrire les données dans un fichier JSON
      await writeFileAsync(inputFile, JSON.stringify({
        candidat,
        concours
      }));

      // Appeler le script PHP
      const phpScript = path.join(__dirname, '../../php/convocation.php');
      const command = `${this.phpPath} "${phpScript}" "${inputFile}" "${outputFile}"`;
      
      console.log('📄 Génération convocation PDF...');
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Succès')) {
        console.error('Erreur PHP:', stderr);
        throw new Error('Erreur lors de la génération du PDF');
      }
      
      console.log('✅ Convocation générée:', outputFile);
      
      // Vérifier que le fichier existe
      if (!fs.existsSync(outputFile)) {
        throw new Error('Le fichier PDF n\'a pas été créé');
      }
      
      return {
        success: true,
        filePath: outputFile,
        fileName: `convocation-${candidat.matricule}.pdf`
      };
      
    } catch (error) {
      console.error('❌ Erreur génération convocation:', error);
      throw error;
    } finally {
      // Nettoyer le fichier JSON temporaire
      try {
        if (fs.existsSync(inputFile)) {
          await unlinkAsync(inputFile);
        }
      } catch (err) {
        console.error('Erreur nettoyage fichier temporaire:', err);
      }
    }
  }

  /**
   * Génère un relevé académique en PDF (Module 2)
   */
  async genererReleveAcademique(data) {
    const { candidat, releve, moyenneGlobale, decisionJury, etablissement } = data;

    const safeId = candidat?.matricule || candidat?.id || Date.now();
    const inputFile = path.join(this.tempDir, `input-releve-${Date.now()}.json`);
    const outputFile = path.join(this.tempDir, `releve-academique-${safeId}.pdf`);

    try {
      await writeFileAsync(inputFile, JSON.stringify({
        candidat,
        releve,
        moyenneGlobale,
        decisionJury,
        etablissement,
      }));

      const phpScript = path.join(__dirname, '../../php/releve-academique.php');
      const command = `${this.phpPath} "${phpScript}" "${inputFile}" "${outputFile}"`;

      console.log('📄 Génération relevé académique PDF...');
      const { stderr } = await execAsync(command);

      if (stderr && !stderr.includes('Succes') && !stderr.includes('Succès')) {
        console.error('Erreur PHP:', stderr);
        throw new Error('Erreur lors de la génération du relevé PDF');
      }

      if (!fs.existsSync(outputFile)) {
        throw new Error('Le fichier relevé PDF n\'a pas été créé');
      }

      return {
        success: true,
        filePath: outputFile,
        fileName: `releve-academique-${safeId}.pdf`,
      };
    } catch (error) {
      console.error('❌ Erreur génération relevé académique:', error);
      throw error;
    } finally {
      try {
        if (fs.existsSync(inputFile)) {
          await unlinkAsync(inputFile);
        }
      } catch (err) {
        console.error('Erreur nettoyage fichier temporaire:', err);
      }
    }
  }

  /**
   * Génère une fiche de pré-inscription établissement (Module 2)
   */
  async genererFichePreinscriptionEtablissement(data) {
    const { candidat, preinscription } = data;
    const safeNum = preinscription?.numeroPreinscription || Date.now();
    const inputFile = path.join(this.tempDir, `input-preinscription-etab-${Date.now()}.json`);
    const outputFile = path.join(this.tempDir, `fiche-preinscription-etab-${safeNum}.pdf`);

    try {
      await writeFileAsync(inputFile, JSON.stringify({ candidat, preinscription }));

      const phpScript = path.join(__dirname, '../../php/fiche-preinscription-etablissement.php');
      const command = `${this.phpPath} "${phpScript}" "${inputFile}" "${outputFile}"`;

      console.log('📄 Génération fiche de pré-inscription établissement PDF...');
      const { stderr } = await execAsync(command);

      if (stderr && !stderr.includes('Succes') && !stderr.includes('Succès')) {
        console.error('Erreur PHP:', stderr);
        throw new Error('Erreur lors de la génération de la fiche de pré-inscription établissement');
      }

      if (!fs.existsSync(outputFile)) {
        throw new Error('Le fichier PDF de pré-inscription établissement n\'a pas été créé');
      }

      return {
        success: true,
        filePath: outputFile,
        fileName: `fiche-preinscription-etablissement-${safeNum}.pdf`,
      };
    } catch (error) {
      console.error('❌ Erreur génération fiche pré-inscription établissement:', error);
      throw error;
    } finally {
      try {
        if (fs.existsSync(inputFile)) {
          await unlinkAsync(inputFile);
        }
      } catch (err) {
        console.error('Erreur nettoyage fichier temporaire:', err);
      }
    }
  }

  /**
   * Nettoie un fichier PDF temporaire
   */
  async nettoyerPDF(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        await unlinkAsync(filePath);
        console.log('🗑️ PDF temporaire supprimé:', filePath);
      }
    } catch (error) {
      console.error('Erreur suppression PDF:', error);
    }
  }

  /**
   * Nettoie tous les fichiers temporaires de plus de 1 heure
   */
  async nettoyerFichiersTemporaires() {
    try {
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      for (const file of files) {
        const filePath = path.join(this.tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtimeMs > oneHour) {
          await unlinkAsync(filePath);
          console.log('🗑️ Fichier temporaire ancien supprimé:', file);
        }
      }
    } catch (error) {
      console.error('Erreur nettoyage fichiers temporaires:', error);
    }
  }
}

module.exports = new PDFService();
