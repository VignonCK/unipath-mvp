/**
 * Formatage et sanitisation des motifs (sans dépendance vers verdict-workflow).
 */

function decodeHtmlEntities(text) {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, '/');
}

function sanitizeMotif(motif) {
  if (!motif || typeof motif !== 'string') {
    return '';
  }

  return decodeHtmlEntities(motif).trim().replace(/\0/g, '');
}

function formatMotifForClient(motif) {
  if (motif == null || motif === '') return motif;
  return decodeHtmlEntities(String(motif));
}

module.exports = {
  decodeHtmlEntities,
  sanitizeMotif,
  formatMotifForClient,
};
