import { jsPDF } from 'jspdf';

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;
const LINE_H = 5;
const MAX_Y = PAGE_H - MARGIN;

const OMIT_PROFILE_KEYS = new Set([
  'passwordHash',
  'verifyToken',
  'resetToken',
]);

function sanitizeProfile(profile) {
  if (!profile || typeof profile !== 'object') return {};
  const out = {};
  Object.keys(profile).forEach((key) => {
    if (!OMIT_PROFILE_KEYS.has(key)) out[key] = profile[key];
  });
  return out;
}

function createDoc() {
  return new jsPDF({ unit: 'mm', format: 'a4' });
}

/** @returns {{ doc: import('jspdf').jsPDF, y: number, addPage: () => void }} */
function pageWriter(doc, startY = MARGIN) {
  let y = startY;
  const addPage = () => {
    doc.addPage();
    y = MARGIN;
  };
  const ensureSpace = (mm) => {
    if (y + mm > MAX_Y) addPage();
  };
  const writeLines = (lines, fontSize = 10, lineHeight = LINE_H) => {
    doc.setFontSize(fontSize);
    for (let i = 0; i < lines.length; i += 1) {
      ensureSpace(lineHeight);
      doc.text(lines[i], MARGIN, y);
      y += lineHeight;
    }
  };
  return { doc, get y() {
    return y; }, setY: (v) => { y = v; }, addPage, writeLines, ensureSpace };
}

/**
 * @param {object} payload - API export JSON
 * @param {string} [filename]
 */
export function downloadUserDataPdf(payload, filename = 'healthai_data_export.pdf') {
  const doc = createDoc();
  const w = pageWriter(doc, MARGIN + 4);

  w.doc.setFont('helvetica', 'bold');
  w.writeLines(w.doc.splitTextToSize('Health AI Co-creation — personal data export', CONTENT_W), 16, 7);
  w.setY(w.y + 2);
  w.doc.setFont('helvetica', 'normal');
  w.writeLines(
    w.doc.splitTextToSize(
      'This document is a copy of the data we store that relates to your account, provided for transparency and portability (GDPR-style export).',
      CONTENT_W,
    ),
    10,
  );

  const exportedAt =
    payload?.exportedAt != null
      ? new Date(payload.exportedAt).toLocaleString(undefined, {
          dateStyle: 'full',
          timeStyle: 'short',
        })
      : new Date().toLocaleString();
  w.doc.setFont('helvetica', 'italic');
  w.writeLines(w.doc.splitTextToSize(`Generated: ${exportedAt}`, CONTENT_W), 9);
  w.doc.setFont('helvetica', 'normal');
  w.setY(w.y + 4);

  const sections = [
    {
      title: '1. Profile',
      body: JSON.stringify(sanitizeProfile(payload?.profile), null, 2),
    },
    {
      title: '2. Posts',
      body: JSON.stringify(payload?.posts ?? [], null, 2),
    },
    {
      title: '3. Meeting requests',
      body: JSON.stringify(payload?.meetingRequests ?? [], null, 2),
    },
    {
      title: '4. NDA acceptances',
      body: JSON.stringify(payload?.ndaAcceptances ?? [], null, 2),
    },
  ];

  sections.forEach(({ title, body }) => {
    w.ensureSpace(12);
    w.doc.setFont('helvetica', 'bold');
    w.writeLines(w.doc.splitTextToSize(title, CONTENT_W), 12, 6);
    w.doc.setFont('helvetica', 'normal');
    w.writeLines(w.doc.splitTextToSize(body, CONTENT_W), 9, 4.5);
    w.setY(w.y + 3);
  });

  w.doc.save(filename);
}
