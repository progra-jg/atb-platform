export function downloadCSV(headers: string[], rows: (string | number)[][], filename: string) {
  const bom = "\uFEFF";
  const csv = [
    headers.join(","),
    ...rows.map((r) => r.map((cell) => {
      const s = String(cell);
      return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(",")),
  ].join("\r\n");

  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

import jsPDF from "jspdf";

export function downloadPDF(content: string, filename: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const lines = content.split("\n");

  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Rapport de conformité", pageW / 2, 18, { align: "center" });

  doc.setTextColor(33, 33, 33);
  doc.setFontSize(10);
  let y = 42;
  lines.forEach((line) => {
    if (y > 280) { doc.addPage(); y = 20; }
    if (line.startsWith("=")) {
      doc.setDrawColor(200, 200, 200);
      doc.line(14, y, pageW - 14, y);
      y += 4;
    } else if (line.trim()) {
      doc.text(line, 14, y);
      y += 6;
    } else {
      y += 3;
    }
  });

  doc.save(`${filename}.pdf`);
}

export function downloadXML(content: string, filename: string) {
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + content], { type: "application/xml;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}
