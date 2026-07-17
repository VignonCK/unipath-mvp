const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const localFileStorage = require('./local-file-storage.service');
const {
  BUCKET_DOSSIERS_CANDIDATS,
  extractStorageRelativePath,
} = require('../utils/storage.helper');
const {
  enrichDossierInscriptionForPdf,
  resolveCentreCompositionChoisiForPdf,
} = require('../utils/centres-composition.helper');

const PDF_PHOTO_SIGNED_URL_EXPIRES_IN = 300;

const execAsync = promisify(exec);
const writeFileAsync = promisify(fs.writeFile);
const unlinkAsync = promisify(fs.unlink);

const PIECE_ID_ALIASES = {
  acte_naissance: ['acte-naissance', 'acteNaissance'],
  'acte-naissance': ['acte_naissance', 'acteNaissance'],
  acteNaissance: ['acte_naissance', 'acte-naissance'],
  carte_identite: ['carte-identite', 'carteIdentite'],
  'carte-identite': ['carte_identite', 'carteIdentite'],
  carteIdentite: ['carte_identite', 'carte-identite'],
  photo_identite: ['photo'],
  photo: ['photo_identite'],
  releve_bac: ['releve-notes', 'releve'],
  'releve-notes': ['releve_bac', 'releve'],
  releve: ['releve_bac', 'releve-notes'],
};

const DOSSIER_FIELD_MAP = {
  acte_naissance: 'acteNaissance',
  'acte-naissance': 'acteNaissance',
  acteNaissance: 'acteNaissance',
  carte_identite: 'carteIdentite',
  'carte-identite': 'carteIdentite',
  carteIdentite: 'carteIdentite',
  photo_identite: 'photo',
  photo: 'photo',
  releve_bac: 'releve',
  'releve-notes': 'releve',
  releve: 'releve',
};

function getPieceIdsToCheck(pieceId) {
  return [pieceId, ...(PIECE_ID_ALIASES[pieceId] || [])];
}

function getPieceExtraUrl(piecesExtras, pieceId) {
  const extras = piecesExtras || {};
  for (const id of getPieceIdsToCheck(pieceId)) {
    if (extras[id]) return extras[id];
  }
  return null;
}

function getConcoursPiecesList(concours) {
  const raw = concours?.piecesRequises?.pieces
    ?? (Array.isArray(concours?.piecesRequises) ? concours.piecesRequises : []);
  return raw.map((p) => (typeof p === 'string' ? { id: p, nom: p, obligatoire: true } : p));
}

function isPieceFournieForFiche(piece, inscription) {
  const di = inscription.dossierInscription;
  const dossier = inscription.candidat?.dossier;
  const pieceId = piece.id;

  if (pieceId === 'quittance') return !!di?.quittanceUrl;
  if (getPieceExtraUrl(di?.piecesExtras, pieceId)) return true;

  const sourceField = piece.sourceDossier || DOSSIER_FIELD_MAP[pieceId];
  if (sourceField && dossier?.[sourceField]) return true;

  return false;
}

function computePiecesFichePayload(inscription) {
  const piecesRequises = getConcoursPiecesList(inscription.concours);
  const piecesFournies = piecesRequises
    .filter((p) => isPieceFournieForFiche(p, inscription))
    .map((p) => p.nom || p.id);
  const piecesManquantes = piecesRequises
    .filter((p) => !isPieceFournieForFiche(p, inscription))
    .map((p) => p.nom || p.id);

  return { pieces_fournies: piecesFournies, pieces_manquantes: piecesManquantes };
}

async function downloadPhotoAsBase64(photoUrl) {
  let photoBase64 = null;
  let photoMime = null;

  if (!photoUrl) {
    return { photoBase64, photoMime };
  }

  try {
    const relativePath = extractStorageRelativePath(photoUrl);
    if (!relativePath) {
      return { photoBase64, photoMime };
    }

    const buffer = localFileStorage.readFileBuffer(relativePath);
    if (buffer) {
      photoBase64 = buffer.toString('base64');
      const ext = path.extname(relativePath).toLowerCase();
      photoMime = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
      console.log('[PDF] Photo récupérée en local ✅, taille:', buffer.length, 'bytes');
    }
  } catch (photoError) {
    console.warn('[PDF] Erreur photo (non bloquant):', photoError.message);
  }

  return { photoBase64, photoMime };
}

function collectPhotoCandidateUrls({ photo, candidat, inscription }) {
  const extras = inscription?.dossierInscription?.piecesExtras || {};
  return [
    photo,
    candidat?.dossier?.photo,
    inscription?.candidat?.dossier?.photo,
    candidat?.photoPath,
    candidat?.photo,
    getPieceExtraUrl(extras, 'photo_identite'),
    getPieceExtraUrl(extras, 'photo'),
  ].filter(Boolean);
}

async function downloadFirstAvailablePhotoAsBase64(urls) {
  const uniqueUrls = [...new Set(urls)];
  for (const url of uniqueUrls) {
    const result = await downloadPhotoAsBase64(url);
    if (result.photoBase64) {
      return result;
    }
  }
  return { photoBase64: null, photoMime: null };
}

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
    const {
      candidat,
      concours,
      numeroDossier,
      inscription,
      pieces_fournies,
      pieces_manquantes,
      statut,
      serie,
      photo,
    } = data;
    
    // Créer un fichier JSON temporaire avec les données
    const inputFile = path.join(this.tempDir, `input-preinscription-${Date.now()}.json`);
    const outputFile = path.join(this.tempDir, `fiche-preinscription-${numeroDossier}.pdf`);
    
    try {
      const photoCandidateUrls = collectPhotoCandidateUrls({ photo, candidat, inscription });
      const { photoBase64, photoMime } = await downloadFirstAvailablePhotoAsBase64(photoCandidateUrls);

      const centreCompositionChoisi = data.centreCompositionChoisi
        || resolveCentreCompositionChoisiForPdf(inscription?.dossierInscription)
        || inscription?.dossierInscription?.centreCompositionChoisi
        || null;

      const payload = {
        candidat,
        concours,
        numeroDossier,
        pieces_fournies: pieces_fournies || [],
        pieces_manquantes: pieces_manquantes || [],
        statut: statut || inscription?.dossierInscription?.statut || 'EN_ATTENTE',
        serie: serie ?? candidat?.serie ?? null,
        photoBase64,
        photoMime,
        centreCompositionChoisi,
      };
      if (inscription) payload.inscription = inscription;
      await writeFileAsync(inputFile, JSON.stringify(payload));

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
   * Génère une fiche de pré-inscription à partir d'une inscription Prisma complète.
   */
  async genererFichePreInscriptionDepuisInscription(inscription) {
    const numeroDossier = inscription.numeroInscription
      || inscription.id.substring(0, 8).toUpperCase();
    const { pieces_fournies, pieces_manquantes } = computePiecesFichePayload(inscription);
    const piecesExtras = inscription.dossierInscription?.piecesExtras || {};
    const photoUrl = inscription.candidat?.dossier?.photo
      || getPieceExtraUrl(piecesExtras, 'photo_identite')
      || getPieceExtraUrl(piecesExtras, 'photo')
      || null;
    const dossierEnrichi = enrichDossierInscriptionForPdf(inscription.dossierInscription);

    return this.genererFichePreInscription({
      candidat: {
        ...inscription.candidat,
        dossier: inscription.candidat?.dossier ?? null,
        photoPath: photoUrl,
        serie: inscription.candidat?.serie ?? null,
      },
      concours: inscription.concours,
      numeroDossier,
      inscription: {
        id: inscription.id,
        numeroInscription: inscription.numeroInscription,
        dossierInscription: dossierEnrichi || null,
      },
      centreCompositionChoisi: dossierEnrichi?.centreCompositionChoisi || null,
      pieces_fournies,
      pieces_manquantes,
      statut: inscription.dossierInscription?.statut || 'EN_ATTENTE',
      serie: inscription.candidat?.serie ?? null,
      photo: photoUrl,
    });
  }

  /**
   * Génère une convocation en PDF
   */
  async genererConvocation(data) {
    const { candidat, concours, inscription } = data;

    const inputFile = path.join(this.tempDir, `input-convocation-${Date.now()}.json`);
    const outputFile = path.join(this.tempDir, `convocation-${candidat.matricule}.pdf`);

    try {
      const sigle = (concours?.libelle || '')
        .replace(/^Concours\s+/i, '')
        .split(' ')[0]
        .toUpperCase()
        .slice(0, 6) || 'CONV';

      const year = concours?.dateDebutComposition
        ? new Date(concours.dateDebutComposition).getFullYear()
        : new Date().getFullYear();

      const numeroSuffix = inscription?.numeroInscription?.split('-').pop()
        || candidat?.matricule
        || '000001';

      const numeroConvocation = `CONV-${sigle}-${year}-${numeroSuffix}`;

      const photoCandidateUrls = collectPhotoCandidateUrls({
        photo: candidat?.dossier?.photo || candidat?.photoPath || candidat?.photo,
        candidat,
        inscription,
      });
      const { photoBase64, photoMime } = await downloadFirstAvailablePhotoAsBase64(photoCandidateUrls);

      const payload = {
        candidat,
        concours,
        numeroConvocation,
        libelleConcours: concours?.libelle || 'Concours d\'entrée à l\'université',
        matieres: concours?.matieres || [],
        dateDebutComposition: concours?.dateDebutComposition || null,
        dateFinComposition: concours?.dateFinComposition || null,
        centresComposition: concours?.centresComposition || null,
        centreCompositionChoisi: data.centreCompositionChoisi
          || resolveCentreCompositionChoisiForPdf(inscription?.dossierInscription)
          || inscription?.dossierInscription?.centreCompositionChoisi
          || null,
        photoBase64,
        photoMime,
      };

      await writeFileAsync(inputFile, JSON.stringify(payload));

      const phpScript = path.join(__dirname, '../../php/convocation.php');
      const command = `${this.phpPath} "${phpScript}" "${inputFile}" "${outputFile}"`;

      console.log('📄 Génération convocation PDF...');
      const { stdout, stderr } = await execAsync(command);

      if (stderr && !stderr.includes('Succès')) {
        console.error('Erreur PHP:', stderr);
        throw new Error('Erreur lors de la génération du PDF');
      }

      console.log('✅ Convocation générée:', outputFile);

      if (!fs.existsSync(outputFile)) {
        throw new Error('Le fichier PDF n\'a pas été créé');
      }

      return {
        success: true,
        filePath: outputFile,
        fileName: `convocation-${candidat.matricule}.pdf`,
      };
    } catch (error) {
      console.error('❌ Erreur génération convocation:', error);
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
