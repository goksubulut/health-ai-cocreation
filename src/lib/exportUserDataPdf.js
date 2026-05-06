import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const MARGIN = 14;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

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

export function downloadUserDataPdf(payload, filename = 'healthai_data_export.pdf') {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  
  // Draw Header Background
  doc.setFillColor(15, 15, 23); // very dark slate
  doc.rect(0, 0, PAGE_W, 40, 'F');
  
  // Draw Logo / Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('HEALTH AI', MARGIN, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 200);
  doc.text('Data Export (GDPR)', PAGE_W - MARGIN, 20, { align: 'right' });
  
  const exportedAt = payload?.exportedAt != null 
    ? new Date(payload.exportedAt).toLocaleString() 
    : new Date().toLocaleString();
  doc.text(`Generated: ${exportedAt}`, PAGE_W - MARGIN, 26, { align: 'right' });

  // Intro text
  let y = 50;
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.text(
    'This document is a copy of the data we store that relates to your account, provided for transparency and portability.',
    MARGIN,
    y,
    { maxWidth: CONTENT_W }
  );
  y += 15;

  // 1. Profile Table
  const safeProfile = sanitizeProfile(payload?.profile);
  const profileData = Object.entries(safeProfile).map(([k, v]) => [k, String(v ?? '')]);
  
  autoTable(doc, {
    startY: y,
    head: [['Field', 'Value']],
    body: profileData.length ? profileData : [['No profile data', '']],
    theme: 'grid',
    headStyles: { fillColor: [45, 212, 191] }, // Teal matching theme
    margin: { left: MARGIN, right: MARGIN },
  });
  
  y = doc.lastAutoTable.finalY + 15;

  // 2. Posts Table
  const posts = payload?.posts ?? [];
  const postsData = posts.map(p => [p.id, p.title || 'Untitled', p.status || 'draft', p.city || 'N/A']);
  
  autoTable(doc, {
    startY: y,
    head: [['Post ID', 'Title', 'Status', 'City']],
    body: postsData.length ? postsData : [['No posts', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [139, 92, 246] }, // Violet matching theme
    margin: { left: MARGIN, right: MARGIN },
  });
  
  y = doc.lastAutoTable.finalY + 15;

  // 3. Meeting Requests
  const meetings = payload?.meetingRequests ?? [];
  const meetingsData = meetings.map(m => [m.id, m.status || 'pending', m.requesterId || '-', m.postOwnerId || '-']);
  
  autoTable(doc, {
    startY: y,
    head: [['Meeting ID', 'Status', 'Requester ID', 'Owner ID']],
    body: meetingsData.length ? meetingsData : [['No meeting requests', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [59, 130, 246] }, // Blue
    margin: { left: MARGIN, right: MARGIN },
  });

  y = doc.lastAutoTable.finalY + 15;

  // 4. NDAs
  const ndas = payload?.ndaAcceptances ?? [];
  const ndasData = ndas.map(n => [n.id, n.postId || '-', new Date(n.createdAt).toLocaleDateString()]);
  
  autoTable(doc, {
    startY: y,
    head: [['NDA ID', 'Post ID', 'Accepted At']],
    body: ndasData.length ? ndasData : [['No NDAs', '', '']],
    theme: 'grid',
    headStyles: { fillColor: [245, 158, 11] }, // Amber
    margin: { left: MARGIN, right: MARGIN },
  });

  doc.save(filename);
}
