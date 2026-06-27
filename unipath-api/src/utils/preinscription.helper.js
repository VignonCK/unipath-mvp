const crypto = require('crypto');

function parseHistorique(historiqueStatuts) {
  if (Array.isArray(historiqueStatuts)) return historiqueStatuts;
  return [];
}

function appendHistorique(historiqueStatuts, entry) {
  return [...parseHistorique(historiqueStatuts), entry];
}

function parseDocumentsCompl(documentsCompl) {
  if (documentsCompl && Array.isArray(documentsCompl.pieces)) {
    return { pieces: [...documentsCompl.pieces] };
  }
  return { pieces: [] };
}

function appendDocument(documentsCompl, piece) {
  const docs = parseDocumentsCompl(documentsCompl);
  docs.pieces.push(piece);
  return docs;
}

function hasDocumentsCompl(documentsCompl) {
  return parseDocumentsCompl(documentsCompl).pieces.length > 0;
}

function newDocumentId() {
  return crypto.randomUUID();
}

const PREINSCRIPTION_INCLUDE = {
  candidat: {
    select: {
      id: true,
      nom: true,
      prenom: true,
      matricule: true,
      email: true,
      telephone: true,
    },
  },
  etablissement: {
    select: { id: true, nom: true, email: true, matriculeFormat: true },
  },
  filiere: {
    select: { id: true, nom: true, code: true, sigle: true },
  },
};

module.exports = {
  parseHistorique,
  appendHistorique,
  parseDocumentsCompl,
  appendDocument,
  hasDocumentsCompl,
  newDocumentId,
  PREINSCRIPTION_INCLUDE,
};
