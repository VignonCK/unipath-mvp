const statsExportService = require('../services/statsExport.service');
const { parseStatsFilters } = require('../utils/stats-filters.helper');
const { resolveCommissionScope } = require('../utils/commission-etablissement.helper');

async function resolveStatsScope(req) {
  if (req.userRole === 'DGES' || req.userRole === 'DEC') {
    return null;
  }

  if (req.userRole === 'COMMISSION') {
    const commissionScope = await resolveCommissionScope(req.user.id);
    if (!commissionScope) {
      const err = new Error('Accès refusé. Aucun concours assigné à votre compte commission.');
      err.status = 403;
      throw err;
    }
    return commissionScope;
  }

  if (req.etablissementId) {
    const prisma = require('../prisma');
    const concours = await prisma.concours.findMany({
      where: { etablissementId: req.etablissementId },
      select: { id: true },
    });
    return {
      etablissementId: req.etablissementId,
      concoursIds: concours.map((c) => c.id),
    };
  }

  return null;
}

function resolveExportModule(userRole) {
  if (userRole === 'DGES') return 'campagnes';
  if (userRole === 'DEC' || userRole === 'COMMISSION' || userRole === 'CONTROLEUR') {
    return 'concours';
  }
  return 'all';
}

exports.exportStats = async (req, res) => {
  try {
    const format = String(req.query.format || '').toLowerCase();
    if (!['excel', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'format doit être excel ou pdf' });
    }

    const filters = parseStatsFilters(req.query);
    const scope = await resolveStatsScope(req);
    const module = resolveExportModule(req.userRole || req.user?.role);
    const stats = await statsExportService.collectStats(filters, scope, { module });
    const dateSlug = new Date().toISOString().slice(0, 10);
    const moduleSlug = module === 'campagnes' ? 'etablissements' : 'concours';

    if (format === 'excel') {
      const buffer = await statsExportService.generateExcel(stats);
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="stats-${moduleSlug}-${dateSlug}.xlsx"`,
      );
      return res.send(Buffer.from(buffer));
    }

    const pdfBuffer = await statsExportService.generatePdf(stats);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="stats-${moduleSlug}-${dateSlug}.pdf"`,
    );
    return res.send(pdfBuffer);
  } catch (error) {
    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error.status === 403) {
      return res.status(403).json({ error: error.message || 'Accès refusé' });
    }
    console.error('exportStats error:', error);
    return res.status(500).json({ error: 'Erreur lors de l\'export des statistiques' });
  }
};

module.exports = exports;
