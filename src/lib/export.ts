import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Trip } from './types';
import { stopDays, tripCost, tripDays } from './store';
import { formatMoney, convertFromUSD, type CurrencyCode } from './currency';

// ============= PDF EXPORT =============
export function exportTripPDF(trip: Trip, currency: CurrencyCode = 'USD') {
  const fmt = (usd: number) => formatMoney(usd, currency);
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 40;
  const cost = tripCost(trip);

  // Header banner
  doc.setFillColor(20, 90, 130);
  doc.rect(0, 0, pageW, 110, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(trip.name, margin, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(
    `${new Date(trip.startDate).toLocaleDateString()}  to  ${new Date(trip.endDate).toLocaleDateString()}   |   ${tripDays(trip)} days   |   ${trip.stops.length} stops`,
    margin, 72,
  );
  if (trip.description) {
    doc.setFontSize(10);
    const wrap = doc.splitTextToSize(trip.description, pageW - margin * 2);
    doc.text(wrap.slice(0, 2), margin, 92);
  }

  // Summary block
  doc.setTextColor(30, 30, 30);
  let y = 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Trip summary', margin, y);
  y += 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const summaryRows: [string, string][] = [
    ['Total estimated cost', fmt(cost.total)],
    ['Budget', trip.budget ? fmt(trip.budget) : 'Not set'],
    ['Transport', fmt(cost.transport)],
    ['Stay', fmt(cost.stay)],
    ['Meals', fmt(cost.meals)],
    ['Activities', fmt(cost.activities)],
    ['Currency', currency],
  ];
  autoTable(doc, {
    startY: y,
    body: summaryRows,
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 160 }, 1: { halign: 'right', cellWidth: 120 } },
    margin: { left: margin },
  });

  // Itinerary
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 24;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Itinerary', margin, y);

  const itinRows = trip.stops.map((s, i) => {
    const days = stopDays(s);
    const stopTotal =
      (s.costs.stay || 0) * Math.max(0, days - 1) +
      (s.costs.meals || 0) * days +
      (s.costs.transport || 0) +
      s.activities.reduce((a, b) => a + b.cost, 0);
    return [
      String(i + 1),
      `${s.city}, ${s.country}`,
      `${new Date(s.startDate).toLocaleDateString()} → ${new Date(s.endDate).toLocaleDateString()}`,
      `${days}d`,
      String(s.activities.length),
      `$${stopTotal.toLocaleString()}`,
    ];
  });
  autoTable(doc, {
    startY: y + 8,
    head: [['#', 'City', 'Dates', 'Days', 'Activities', 'Cost']],
    body: itinRows,
    theme: 'striped',
    headStyles: { fillColor: [20, 90, 130], textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 5 },
    columnStyles: { 0: { cellWidth: 24 }, 5: { halign: 'right' } },
    margin: { left: margin, right: margin },
  });

  // Per-stop activities
  trip.stops.forEach((s, i) => {
    if (s.activities.length === 0) return;
    let yy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    if (yy > 720) { doc.addPage(); yy = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.text(`Stop ${i + 1} — ${s.city}: activities`, margin, yy);
    autoTable(doc, {
      startY: yy + 6,
      head: [['Time', 'Activity', 'Category', 'Hours', 'Cost']],
      body: s.activities.map(a => [
        a.time || '—',
        a.name,
        a.category,
        `${a.durationHours}h`,
        `$${a.cost.toLocaleString()}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [240, 240, 245], textColor: 30, fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 4: { halign: 'right' } },
      margin: { left: margin, right: margin },
    });
  });

  // Packing
  if (trip.packing && trip.packing.length > 0) {
    let yy = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 18;
    if (yy > 700) { doc.addPage(); yy = 50; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Packing checklist', margin, yy);
    autoTable(doc, {
      startY: yy + 8,
      head: [['Item', 'Category', 'Packed']],
      body: trip.packing.map(p => [p.label, p.category, p.packed ? 'Yes' : 'No']),
      theme: 'striped',
      headStyles: { fillColor: [20, 90, 130], textColor: 255, fontSize: 10 },
      styles: { fontSize: 9, cellPadding: 4 },
      margin: { left: margin, right: margin },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(`Traveloop · ${trip.name} · Page ${p} of ${pageCount}`, margin, doc.internal.pageSize.getHeight() - 18);
  }

  doc.save(`${slug(trip.name)}-itinerary.pdf`);
}

// ============= CSV EXPORT =============
export function exportTripCSV(trip: Trip) {
  const rows: (string | number)[][] = [];
  rows.push(['Trip', trip.name]);
  rows.push(['Dates', trip.startDate, trip.endDate]);
  rows.push(['Days', tripDays(trip)]);
  rows.push(['Budget (USD)', trip.budget ?? '']);
  rows.push([]);
  rows.push(['Stop #', 'City', 'Country', 'Start', 'End', 'Days', 'Transport', 'Stay total', 'Meals total', 'Activities total', 'Stop total']);

  trip.stops.forEach((s, i) => {
    const days = stopDays(s);
    const stay = (s.costs.stay || 0) * Math.max(0, days - 1);
    const meals = (s.costs.meals || 0) * days;
    const acts = s.activities.reduce((a, b) => a + b.cost, 0);
    const total = (s.costs.transport || 0) + stay + meals + acts;
    rows.push([i + 1, s.city, s.country, s.startDate, s.endDate, days, s.costs.transport || 0, stay, meals, acts, total]);
  });

  rows.push([]);
  rows.push(['Activity breakdown']);
  rows.push(['Stop', 'City', 'Activity', 'Category', 'Time', 'Hours', 'Cost (USD)']);
  trip.stops.forEach((s, i) => {
    s.activities.forEach(a => {
      rows.push([i + 1, s.city, a.name, a.category, a.time || '', a.durationHours, a.cost]);
    });
  });

  rows.push([]);
  const cost = tripCost(trip);
  rows.push(['Totals']);
  rows.push(['Transport', cost.transport]);
  rows.push(['Stay', cost.stay]);
  rows.push(['Meals', cost.meals]);
  rows.push(['Activities', cost.activities]);
  rows.push(['Total', cost.total]);

  const csv = rows.map(r => r.map(csvCell).join(',')).join('\n');
  download(`${slug(trip.name)}-costs.csv`, csv, 'text/csv;charset=utf-8;');
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
