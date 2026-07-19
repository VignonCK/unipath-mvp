/**
 * En-tête officiel pour les PDF générés côté Node (PDFKit).
 * L'image active est résolue via pdf-header-config (custom DEC ou défaut MESRS).
 */
const fs = require('fs');
const path = require('path');
const {
  resolvePdfHeaderSync,
  DEFAULT_ASPECT,
} = require('./pdf-header-config.helper');

/** Polices PDFKit : Times New Roman système si dispo, sinon Times standard. */
let useSystemTimesNewRoman = null; // null = pas encore testé

function resolveTimesFontPaths() {
  const winFonts = process.env.WINDIR
    ? path.join(process.env.WINDIR, 'Fonts')
    : 'C:\\Windows\\Fonts';
  return {
    regular: path.join(winFonts, 'times.ttf'),
    bold: path.join(winFonts, 'timesbd.ttf'),
  };
}

function ensureTimesNewRomanFonts(doc) {
  if (useSystemTimesNewRoman === null) {
    const { regular, bold } = resolveTimesFontPaths();
    useSystemTimesNewRoman = fs.existsSync(regular) && fs.existsSync(bold);
  }
  if (useSystemTimesNewRoman) {
    const { regular, bold } = resolveTimesFontPaths();
    try {
      doc.registerFont('TimesNewRoman', regular);
      doc.registerFont('TimesNewRoman-Bold', bold);
    } catch (err) {
      console.warn('[PDF] Times New Roman indisponible, repli Times:', err.message);
      useSystemTimesNewRoman = false;
    }
  }
}

function getPdfFont() {
  return useSystemTimesNewRoman ? 'TimesNewRoman' : 'Times-Roman';
}

function getPdfFontBold() {
  return useSystemTimesNewRoman ? 'TimesNewRoman-Bold' : 'Times-Bold';
}

function getMesrsHeaderPath() {
  return resolvePdfHeaderSync().path || null;
}

/**
 * Dessine le bandeau officiel + titre du document.
 * @returns {number} position Y après l'en-tête
 */
function drawMesrsHeader(doc, {
  marginLeft,
  usableWidth,
  title,
  subtitle = null,
  metaLine = null,
  yStart = 20,
} = {}) {
  const header = resolvePdfHeaderSync();
  let y = yStart;

  if (header.path) {
    const aspect = header.aspectRatio || DEFAULT_ASPECT;
    const headerH = usableWidth * aspect;
    doc.image(header.path, marginLeft, y, {
      width: usableWidth,
      height: headerH,
    });
    y += headerH + 10;
  }

  ensureTimesNewRomanFonts(doc);

  doc.fillColor('#1e3a8a').font(getPdfFontBold()).fontSize(14)
    .text(title || '', marginLeft, y, {
      width: usableWidth,
      align: 'center',
    });
  y += 20;

  if (subtitle) {
    doc.fillColor('#111827').font(getPdfFontBold()).fontSize(11)
      .text(subtitle, marginLeft, y, {
        width: usableWidth,
        align: 'center',
      });
    y += 16;
  }

  if (metaLine) {
    doc.fillColor('#4b5563').font(getPdfFont()).fontSize(9)
      .text(metaLine, marginLeft, y, {
        width: usableWidth,
        align: 'center',
      });
    y += 14;
  }

  doc.moveTo(marginLeft, y)
    .lineTo(marginLeft + usableWidth, y)
    .strokeColor('#d1d5db')
    .lineWidth(1)
    .stroke();

  return y + 10;
}

module.exports = {
  getMesrsHeaderPath,
  drawMesrsHeader,
  ensureTimesNewRomanFonts,
  getPdfFont,
  getPdfFontBold,
  HEADER_ASPECT: DEFAULT_ASPECT,
};
