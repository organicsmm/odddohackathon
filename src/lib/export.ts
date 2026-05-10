import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Trip } from './types';
import { stopDays, tripCost, tripDays } from './store';
import { formatMoney, convertFromUSD, type CurrencyCode } from './currency';

// ============= PDF EXPORT (editorial) =============

// Editorial palette — kept minimal so it prints well in B&W too
const INK: [number, number, number] = [15, 23, 42];        // slate-900
const MUTED: [number, number, number] = [100, 116, 139];   // slate-500
const HAIR: [number, number, number] = [226, 232, 240];    // slate-200
const ACCENT: [number, number, number] = [14, 116, 144];   // teal-700

type LastTbl = { lastAutoTable: { finalY: number } };

export function exportTripPDF(trip: Trip, currency: CurrencyCode = 'USD') {
  const fmt = (usd: number) => formatMoney(usd, currency);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 56; // generous margin
  const cost = tripCost(trip);
  const days = tripDays(trip);
  const avg = days > 0 ? cost.total / days : 0;

  // ── helpers
  const setFill = (c: [number, number, number]) => doc.setFillColor(c[0], c[1], c[2]);
  const setText = (c: [number, number, number]) => doc.setTextColor(c[0], c[1], c[2]);
  const setStroke = (c: [number, number, number]) => doc.setDrawColor(c[0], c[1], c[2]);
  const hairline = (y: number, x1 = M, x2 = pageW - M) => {
    setStroke(HAIR); doc.setLineWidth(0.5); doc.line(x1, y, x2, y);
  };
  const eyebrow = (text: string, x: number, y: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setText(MUTED);
    doc.text(text.toUpperCase(), x, y, { charSpace: 1.2 });
  };
  const ensureSpace = (y: number, needed: number): number => {
    if (y + needed > pageH - M) { doc.addPage(); return M + 10; }
    return y;
  };

  // ── COVER HEADER
  let y = M + 18;

  eyebrow(trip.isPublic ? 'Public itinerary' : 'Itinerary', M, y);
  // tiny accent dot
  setFill(ACCENT); doc.circle(M - 10, y - 2.5, 1.4, 'F');
  y += 22;

  // Massive display title — wrap if long
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(34);
  setText(INK);
  const titleLines = doc.splitTextToSize(trip.name, pageW - M * 2);
  doc.text(titleLines, M, y);
  y += titleLines.length * 36;

  // Date range / stops in a refined meta row
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  setText(MUTED);
  const dateStr = `${new Date(trip.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}  →  ${new Date(trip.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  doc.text(`${dateStr}     ·     ${days} days     ·     ${trip.stops.length} stops`, M, y + 8);
  y += 22;

  if (trip.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    setText(INK);
    const wrap = doc.splitTextToSize(trip.description, pageW - M * 2);
    doc.text(wrap.slice(0, 4), M, y + 12);
    y += Math.min(wrap.length, 4) * 14 + 12;
  }

  y += 14;
  hairline(y);
  y += 24;

  // ── KPI STRIP (4 columns, hand-drawn)
  const kpis: [string, string][] = [
    ['Total', fmt(cost.total)],
    ['Avg / day', fmt(avg)],
    ['Stops', String(trip.stops.length)],
    ['Days', String(days)],
  ];
  const colW = (pageW - M * 2) / kpis.length;
  kpis.forEach(([label, value], i) => {
    const x = M + i * colW;
    eyebrow(label, x, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    setText(INK);
    doc.text(value, x, y + 24);
  });
  y += 44;
  hairline(y);
  y += 28;

  // ── COST SUMMARY
  eyebrow('Cost summary', M, y);
  y += 14;

  const summaryRows: [string, string][] = [
    ['Transport', fmt(cost.transport)],
    ['Accommodation', fmt(cost.stay)],
    ['Meals', fmt(cost.meals)],
    ['Activities', fmt(cost.activities)],
    ['Budget', trip.budget ? fmt(trip.budget) : '—'],
  ];

  autoTable(doc, {
    startY: y,
    body: [...summaryRows, ['Total estimated', fmt(cost.total)]],
    theme: 'plain',
    styles: { font: 'helvetica', fontSize: 10.5, cellPadding: { top: 7, bottom: 7, left: 0, right: 0 }, textColor: INK, lineColor: HAIR, lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 } },
    columnStyles: { 0: { textColor: MUTED, cellWidth: 220 }, 1: { halign: 'right', fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === summaryRows.length) {
        data.cell.styles.fontSize = 13;
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = INK;
        data.cell.styles.cellPadding = { top: 12, bottom: 4, left: 0, right: 0 };
      }
    },
    margin: { left: M, right: M },
  });

  y = (doc as unknown as LastTbl).lastAutoTable.finalY + 36;

  // ── ITINERARY
  y = ensureSpace(y, 80);
  eyebrow('The route', M, y);
  y += 16;

  const itinRows = trip.stops.map((s, i) => {
    const d = stopDays(s);
    const stopTotal =
      (s.costs.stay || 0) * Math.max(0, d - 1) +
      (s.costs.meals || 0) * d +
      (s.costs.transport || 0) +
      s.activities.reduce((a, b) => a + b.cost, 0);
    return [
      String(i + 1).padStart(2, '0'),
      `${s.city}, ${s.country}`,
      `${new Date(s.startDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} → ${new Date(s.endDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`,
      `${d}d`,
      String(s.activities.length),
      fmt(stopTotal),
    ];
  });

  autoTable(doc, {
    startY: y,
    head: [['#', 'City', 'Dates', 'Days', 'Acts', 'Cost']],
    body: itinRows,
    theme: 'plain',
    headStyles: {
      font: 'helvetica', fontStyle: 'bold', fontSize: 8, textColor: MUTED,
      cellPadding: { top: 6, bottom: 8, left: 0, right: 8 },
      lineColor: INK, lineWidth: { bottom: 1, top: 0, left: 0, right: 0 },
    },
    bodyStyles: {
      font: 'helvetica', fontSize: 10.5, textColor: INK,
      cellPadding: { top: 10, bottom: 10, left: 0, right: 8 },
      lineColor: HAIR, lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
    },
    columnStyles: {
      0: { cellWidth: 28, textColor: MUTED, fontStyle: 'bold' },
      1: { fontStyle: 'bold' },
      2: { textColor: MUTED },
      3: { halign: 'right', textColor: MUTED, cellWidth: 40 },
      4: { halign: 'right', textColor: MUTED, cellWidth: 40 },
      5: { halign: 'right', fontStyle: 'bold', cellWidth: 80 },
    },
    margin: { left: M, right: M },
    didParseCell: (d) => { if (d.section === 'head') d.cell.text = d.cell.text.map(t => t.toUpperCase()); },
  });

  y = (doc as unknown as LastTbl).lastAutoTable.finalY + 40;

  // ── PER-STOP DETAIL
  trip.stops.forEach((s, i) => {
    if (s.activities.length === 0) return;
    y = ensureSpace(y, 90);

    eyebrow(`Stop ${String(i + 1).padStart(2, '0')}`, M, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setText(INK);
    doc.text(s.city, M, y + 22);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    setText(MUTED);
    const cityW = doc.getTextWidth(s.city);
    doc.text(s.country, M + cityW + 8, y + 22);
    y += 34;

    autoTable(doc, {
      startY: y,
      head: [['Time', 'Activity', 'Category', 'Hours', 'Cost']],
      body: s.activities.map(a => [
        a.time || '—',
        a.name,
        a.category,
        `${a.durationHours}h`,
        fmt(a.cost),
      ]),
      theme: 'plain',
      headStyles: {
        font: 'helvetica', fontStyle: 'bold', fontSize: 8, textColor: MUTED,
        cellPadding: { top: 6, bottom: 8, left: 0, right: 8 },
        lineColor: INK, lineWidth: { bottom: 1, top: 0, left: 0, right: 0 },
      },
      bodyStyles: {
        font: 'helvetica', fontSize: 10, textColor: INK,
        cellPadding: { top: 8, bottom: 8, left: 0, right: 8 },
        lineColor: HAIR, lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
      },
      columnStyles: {
        0: { cellWidth: 50, textColor: MUTED },
        1: { fontStyle: 'bold' },
        2: { textColor: MUTED },
        3: { halign: 'right', textColor: MUTED, cellWidth: 50 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 70 },
      },
      margin: { left: M, right: M },
      didParseCell: (d) => { if (d.section === 'head') d.cell.text = d.cell.text.map(t => t.toUpperCase()); },
    });

    y = (doc as unknown as LastTbl).lastAutoTable.finalY + 30;
  });

  // ── PACKING
  if (trip.packing && trip.packing.length > 0) {
    y = ensureSpace(y, 100);
    eyebrow('Packing checklist', M, y);
    y += 16;

    const packed = trip.packing.filter(p => p.packed).length;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    setText(MUTED);
    doc.text(`${packed} of ${trip.packing.length} packed`, M, y);
    y += 14;

    autoTable(doc, {
      startY: y,
      head: [['', 'Item', 'Category']],
      body: trip.packing.map(p => [p.packed ? '●' : '○', p.label, p.category]),
      theme: 'plain',
      headStyles: {
        font: 'helvetica', fontStyle: 'bold', fontSize: 8, textColor: MUTED,
        cellPadding: { top: 6, bottom: 8, left: 0, right: 8 },
        lineColor: INK, lineWidth: { bottom: 1, top: 0, left: 0, right: 0 },
      },
      bodyStyles: {
        font: 'helvetica', fontSize: 10, textColor: INK,
        cellPadding: { top: 7, bottom: 7, left: 0, right: 8 },
        lineColor: HAIR, lineWidth: { bottom: 0.5, top: 0, left: 0, right: 0 },
      },
      columnStyles: {
        0: { cellWidth: 18, textColor: ACCENT, fontStyle: 'bold' },
        1: { fontStyle: 'bold' },
        2: { textColor: MUTED, halign: 'right' },
      },
      margin: { left: M, right: M },
      didParseCell: (d) => { if (d.section === 'head') d.cell.text = d.cell.text.map(t => t.toUpperCase()); },
    });
  }

  // ── FOOTER on every page (minimal)
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    // top hairline mark
    setFill(ACCENT);
    doc.rect(M, M - 22, 16, 1.5, 'F');

    // footer line
    setStroke(HAIR); doc.setLineWidth(0.5);
    doc.line(M, pageH - M + 14, pageW - M, pageH - M + 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setText(INK);
    doc.text('TRAVELOOP', M, pageH - M + 26, { charSpace: 1.5 });

    doc.setFont('helvetica', 'normal');
    setText(MUTED);
    const center = trip.name.length > 60 ? trip.name.slice(0, 60) + '…' : trip.name;
    doc.text(center, pageW / 2, pageH - M + 26, { align: 'center' });

    doc.text(`${p} / ${pageCount}`, pageW - M, pageH - M + 26, { align: 'right' });
  }

  doc.save(`${slug(trip.name)}-itinerary.pdf`);
}

// ============= CSV EXPORT =============
export function exportTripCSV(trip: Trip, currency: CurrencyCode = 'USD') {
  const conv = (usd: number) => Number(convertFromUSD(usd, currency).toFixed(2));
  const rows: (string | number)[][] = [];
  rows.push(['Trip', trip.name]);
  rows.push(['Dates', trip.startDate, trip.endDate]);
  rows.push(['Days', tripDays(trip)]);
  rows.push(['Currency', currency]);
  rows.push([`Budget (${currency})`, trip.budget != null ? conv(trip.budget) : '']);
  rows.push([]);
  rows.push(['Stop #', 'City', 'Country', 'Start', 'End', 'Days',
    `Transport (${currency})`, `Stay total (${currency})`, `Meals total (${currency})`,
    `Activities total (${currency})`, `Stop total (${currency})`]);

  trip.stops.forEach((s, i) => {
    const days = stopDays(s);
    const stay = (s.costs.stay || 0) * Math.max(0, days - 1);
    const meals = (s.costs.meals || 0) * days;
    const acts = s.activities.reduce((a, b) => a + b.cost, 0);
    const total = (s.costs.transport || 0) + stay + meals + acts;
    rows.push([i + 1, s.city, s.country, s.startDate, s.endDate, days,
      conv(s.costs.transport || 0), conv(stay), conv(meals), conv(acts), conv(total)]);
  });

  rows.push([]);
  rows.push(['Activity breakdown']);
  rows.push(['Stop', 'City', 'Activity', 'Category', 'Time', 'Hours', `Cost (${currency})`]);
  trip.stops.forEach((s, i) => {
    s.activities.forEach(a => {
      rows.push([i + 1, s.city, a.name, a.category, a.time || '', a.durationHours, conv(a.cost)]);
    });
  });

  rows.push([]);
  const cost = tripCost(trip);
  rows.push(['Totals']);
  rows.push([`Transport (${currency})`, conv(cost.transport)]);
  rows.push([`Stay (${currency})`, conv(cost.stay)]);
  rows.push([`Meals (${currency})`, conv(cost.meals)]);
  rows.push([`Activities (${currency})`, conv(cost.activities)]);
  rows.push([`Total (${currency})`, conv(cost.total)]);

  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
  download(`${slug(trip.name)}-costs-${currency.toLowerCase()}.csv`, csv, 'text/csv;charset=utf-8;');
}

function csvCell(v: string | number): string {
  if (v === null || v === undefined) return '';
  const s = String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trip';
}
