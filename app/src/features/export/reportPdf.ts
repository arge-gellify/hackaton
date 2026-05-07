import { jsPDF } from 'jspdf';
import type { Card, Report, Retro, User } from '../../domain/types';
import { getTemplate } from '../../domain/templates';
import { fmtDate } from '../../lib/format';

export function buildReportPdf(report: Report, retro: Retro, users: User[]): jsPDF {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 56;
  const margin = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(retro.title, margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110);
  doc.text(`Report generated ${fmtDate(report.generatedAt)} • Status: ${report.isFinal ? 'Final' : 'Draft'}`, margin, y);
  y += 22;

  doc.setDrawColor(220);
  doc.line(margin, y, W - margin, y);
  y += 20;

  const tpl = getTemplate(retro.templateId);
  doc.setTextColor(0);

  for (const col of tpl.columns) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(col.title, margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const top = retro.cards
      .filter((c) => c.columnKey === col.key)
      .sort((a: Card, b: Card) => b.votes.length - a.votes.length)
      .slice(0, 3);
    if (top.length === 0) {
      doc.setTextColor(140);
      doc.text('No cards', margin + 12, y);
      doc.setTextColor(0);
      y += 16;
    } else {
      for (const c of top) {
        const lines = doc.splitTextToSize(`• [${c.votes.length} votes] ${c.text}`, W - margin * 2 - 12);
        doc.text(lines, margin + 12, y);
        y += lines.length * 14;
      }
    }
    y += 8;
    if (y > 720) { doc.addPage(); y = 56; }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Action Items', margin, y);
  y += 16;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const items = retro.cards.flatMap((c) => c.actionItems);
  if (items.length === 0) {
    doc.setTextColor(140);
    doc.text('No action items', margin + 12, y);
    doc.setTextColor(0);
    y += 16;
  } else {
    for (const ai of items) {
      const a = users.find((u) => u.id === ai.assigneeId);
      const line = `[${ai.status.toUpperCase()}] ${ai.title}${a ? ' — ' + a.name : ''}${ai.dueDate ? ' (due ' + fmtDate(ai.dueDate) + ')' : ''}`;
      const lines = doc.splitTextToSize('• ' + line, W - margin * 2 - 12);
      doc.text(lines, margin + 12, y);
      y += lines.length * 14;
      if (y > 760) { doc.addPage(); y = 56; }
    }
  }

  if (report.summary?.trim()) {
    y += 12;
    if (y > 720) { doc.addPage(); y = 56; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Summary', margin, y);
    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const lines = doc.splitTextToSize(report.summary, W - margin * 2);
    doc.text(lines, margin, y);
  }

  return doc;
}
