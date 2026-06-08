import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { formatDate } from "./format";

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

export function downloadPDF(content: Record<string, any>, filename: string) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(27, 94, 32);
  doc.rect(0, 0, pageW, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Certificat", pageW / 2, 18, { align: "center" });

  const entries = Object.entries(content);
  const startY = 42;
  const lineH = 8;
  doc.setTextColor(33, 33, 33);
  doc.setFontSize(11);

  entries.forEach(([key, val], i) => {
    const y = startY + i * lineH;
    doc.setFillColor(i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255, i % 2 === 0 ? 245 : 255);
    doc.rect(10, y - 5, pageW - 20, lineH, "F");
    doc.setFont("helvetica", "bold");
    doc.text(key + ":", 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(String(val), 60, y);
  });

  const footerY = startY + entries.length * lineH + 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Généré le ${formatDate(new Date())} — ATB Platform`, 14, footerY);

  doc.save(`${filename}.pdf`);
}

export async function downloadFarmerProfilePDF(element: HTMLElement, farmerName: string, lang: "fr" | "en" = "fr") {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();

  doc.setFillColor(6, 78, 59);
  doc.rect(0, 0, pageW, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(lang === "fr" ? "Passeport de Confiance Numérique" : "Digital Trust Passport", pageW / 2, 14, { align: "center" });
  doc.setFontSize(9);
  doc.text(farmerName, pageW / 2, 22, { align: "center" });
  doc.setFontSize(7);
  doc.text(`${lang === "fr" ? "Généré le" : "Generated on"} ${formatDate(new Date())} — ATB Platform`, pageW / 2, 28, { align: "center" });

  const canvas = await html2canvas(element, {
    scale: 2, useCORS: true, logging: false, backgroundColor: "#ffffff",
  });
  const imgData = canvas.toDataURL("image/png");
  const imgW = pageW - 20;
  const imgH = (canvas.height / canvas.width) * imgW;
  const maxH = doc.internal.pageSize.getHeight() - 44;
  let yPos = 38;
  if (imgH > maxH) {
    const ratio = maxH / imgH;
    doc.addImage(imgData, "PNG", 10, yPos, imgW * ratio, imgH * ratio);
  } else {
    doc.addImage(imgData, "PNG", 10, yPos, imgW, imgH);
  }
  doc.save(`passeport-${farmerName.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function downloadXML(data: Record<string, any>, filename: string) {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<certificat>\n${Object.entries(data).map(([k, v]) => `  <${k}>${v}</${k}>`).join("\n")}\n</certificat>`;
  const blob = new Blob([xml], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.xml`;
  a.click();
  URL.revokeObjectURL(url);
}
