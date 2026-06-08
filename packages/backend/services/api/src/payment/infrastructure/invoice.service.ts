import { Injectable, Logger } from "@nestjs/common";
import * as QRCode from "qrcode";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import * as PDFDocument from "pdfkit";
import { translate, getLocale, nombreEnLettres, legalMentions, Lang } from "../../pdf-i18n";

const INVOICE_SECRET = process.env.INVOICE_SIGNING_SECRET || "atb_inv_secret_dev_2024";

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  buyerName: string;
  buyerEmail: string;
  buyerIfu: string;
  buyerAddress: string;
  items: { name: string; quantity: number; price: number; unit: string }[];
  amount: number;
  currency: string;
  method: string;
  provider: string;
  paidAt: Date;
  transactionId: string;
  lang?: Lang;
}

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);

  generateInvoiceNumber(): string {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, "");
    const rand = randomBytes(3).toString("hex").toUpperCase();
    return `FACT-${date}-${rand}`;
  }

  generateSignature(invoiceNumber: string): string {
    return createHmac("sha256", INVOICE_SECRET)
      .update(invoiceNumber)
      .digest("hex");
  }

  verifySignature(invoiceNumber: string, signature: string): boolean {
    const expected = this.generateSignature(invoiceNumber);
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  async generateQRDataUrl(invoiceNumber: string): Promise<string> {
    const signature = this.generateSignature(invoiceNumber);
    const verifyUrl = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/api/payment/invoice/verify/${invoiceNumber}?sig=${signature}`;
    return QRCode.toDataURL(verifyUrl, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 300,
      color: { dark: "#0a6e4a", light: "#ffffff" },
    });
  }

  async generatePDF(data: InvoiceData): Promise<Buffer> {
    const qrDataUrl = await this.generateQRDataUrl(data.invoiceNumber);
    const lang: Lang = data.lang || "fr";
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: `${translate("FACTURE", lang)} ${data.invoiceNumber}`, Author: "ATB AgriTrace" } });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));

    const tr = (key: string) => translate(key, lang);
    const pageWidth = doc.page.width - 96;
    const green = "#0a6e4a";
    const gray = "#6b7280";
    const dark = "#1f2937";
    const lightBg = "#f9fafb";

    const locale = getLocale(lang);
    const d = (dt: Date | string) => new Date(dt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    const fmt = (n: number) => n.toLocaleString("fr-FR");
    const pageNum = () => { doc.fontSize(7).fillColor(gray).text(`${lang === "en" ? "Page" : "Page"} ${doc.bufferedPageRange().count - 1} / ${doc.bufferedPageRange().count}`, 48, doc.page.height - 55, { width: pageWidth, align: "center" }); };

    // --- HEADER (letterhead) ---
    doc.rect(0, 0, doc.page.width, 130).fill(green);
    doc.fill("#ffffff").fontSize(26).font("Helvetica-Bold").text("ATB AGRITRACE", 48, 28);
    doc.fontSize(9).font("Helvetica").text(tr("Plateforme B2B – Traçabilité Blockchain – Conformité EUDR"), 48, 60);
    doc.fontSize(7.5).text("Cotonou, Bénin  |  IFU: 3202012345678  |  RCCM: RB/COT/24 A 12345  |  www.agritrace.bj", 48, 78);
    doc.text("contact@agritrace.bj  |  +229 01 23 45 67 89  |  BP 1234 Cotonou", 48, 92);

    const badgeX = doc.page.width - 48 - 170;
    doc.rect(badgeX, 18, 170, 46).fill("#ffffff");
    doc.fillColor(green).fontSize(16).font("Helvetica-Bold").text(tr("FACTURE"), badgeX + 14, 26);
    doc.fontSize(8).font("Helvetica").fillColor(gray).text(`N° ${data.invoiceNumber}`, badgeX + 14, 46);

    doc.rect(0, 130, doc.page.width, 2).fill(gray);

    // --- SELLER INFO (left) / DOC REF (right) ---
    let y = 150;
    doc.fillColor(dark).fontSize(9).font("Helvetica-Bold").text(tr("PRESTATAIRE"), 48, y);
    doc.fontSize(8).font("Helvetica").fillColor(dark);
    y += 14;
    doc.text("ATB AgriTrace Bénin SARL", 48, y);
    y += 12;
    doc.text("IFU: 3202012345678  |  RCCM: RB/COT/24 A 12345", 48, y);
    y += 12;
    doc.text("Cotonou, Bénin  |  contact@agritrace.bj  |  +229 01 23 45 67 89", 48, y);
    y += 12;
    doc.text("BP 1234 Cotonou  |  www.agritrace.bj", 48, y);

    doc.fillColor(gray).fontSize(7.5).font("Helvetica");
    doc.text(tr("Date d'émission:"), doc.page.width - 240, 150, { width: 80 });
    doc.fillColor(dark).text(d(data.paidAt), doc.page.width - 160, 150, { width: 120 });
    doc.fillColor(gray).text(tr("Mode de paiement:"), doc.page.width - 240, 164, { width: 80 });
    doc.fillColor(dark).text(data.method === "mobile_money" ? "Mobile Money" : data.method, doc.page.width - 160, 164, { width: 120 });
    doc.fillColor(gray).text(tr("Transaction:"), doc.page.width - 240, 178, { width: 80 });
    doc.fillColor(dark).fontSize(6.5).text(data.transactionId, doc.page.width - 160, 178, { width: 120 });
    doc.fillColor(gray).fontSize(7.5).text(tr("Fournisseur:"), doc.page.width - 240, 192, { width: 80 });
    doc.fillColor(dark).text(data.provider, doc.page.width - 160, 192, { width: 120 });

    y = Math.max(y + 16, 260);
    doc.rect(48, y, pageWidth, 1).fill(green + "40");

    // --- BILL TO ---
    y += 14;
    doc.fillColor(dark).fontSize(9).font("Helvetica-Bold").text(tr("FACTURÉ À"), 48, y);
    y += 14;
    doc.fontSize(8.5).font("Helvetica").fillColor(dark);
    doc.text(data.buyerName, 48, y); y += 13;
    doc.text(data.buyerEmail, 48, y); y += 13;
    if (data.buyerIfu) doc.text(`IFU: ${data.buyerIfu}`, 48, y); y += data.buyerIfu ? 13 : 0;
    if (data.buyerAddress) doc.text(data.buyerAddress, 48, y); y += data.buyerAddress ? 13 : 0;

    // --- ORDER REF ---
    doc.fontSize(7.5).fillColor(gray);
    doc.text(`Commande: ${data.orderId.slice(0, 12)}...`, doc.page.width - 200, y - 60, { width: 160, align: "right" });
    doc.text(`Paiement ID: ${data.paymentId.slice(0, 12)}...`, doc.page.width - 200, y - 48, { width: 160, align: "right" });

    y = Math.max(y + 12, 340);
    doc.rect(48, y, pageWidth, 1).fill(green + "40");

    // --- ITEMS TABLE ---
    y += 12;
    const colDefs = [
      { x: 48, w: 28, align: "center" as const },
      { x: 78, w: 162, align: "left" as const },
      { x: 242, w: 80, align: "right" as const },
      { x: 324, w: 60, align: "right" as const },
      { x: 386, w: 60, align: "right" as const },
      { x: 448, w: 68, align: "right" as const },
    ];
    const colH = 20;

    doc.rect(48, y, pageWidth, colH).fill(green + "12");
    doc.fillColor(dark).fontSize(7.5).font("Helvetica-Bold");
    const th = [tr("#"), tr("Produit"), tr("Prix unit."), tr("Qté"), tr("Montant"), tr("Total")];
    th.forEach((h, i) => doc.text(h, colDefs[i].x, y + 6, { width: colDefs[i].w, align: colDefs[i].align }));
    y += colH;

    doc.fontSize(8).font("Helvetica");
    let subtotal = 0;
    for (let i = 0; i < data.items.length; i++) {
      const item = data.items[i];
      const total = item.price * item.quantity;
      subtotal += total;
      const fill = i % 2 === 0 ? "#ffffff" : lightBg;
      doc.rect(48, y, pageWidth, 18).fill(fill);
      doc.fillColor(dark);
      const cells = [`${i + 1}`, item.name, `${fmt(item.price)} F`, `x${item.quantity}`, `${fmt(item.price * item.quantity)} F`, `${fmt(total)} FCFA`];
      cells.forEach((c, j) => doc.text(c, colDefs[j].x, y + 5, { width: colDefs[j].w, align: colDefs[j].align }));
      y += 18;
    }

    // --- TOTALS ---
    y = Math.max(y + 12, 400);
    doc.rect(48, y, pageWidth, 1).fill(green);
    y += 14;

    const fee = Math.round(subtotal * 0.008);
    const totalColX = 340;
    const totalValX = 480;
    const itemsTotal = [{ l: tr("Sous-total"), v: `${fmt(subtotal)} FCFA`, b: false, c: dark },
                        { l: tr("Frais de service (0,8 %)"), v: `${fmt(fee)} FCFA`, b: false, c: dark },
                        { l: "", v: "", b: false, c: dark },
                        { l: tr("TOTAL FACTURÉ"), v: `${fmt(data.amount)} FCFA`, b: true, c: green }];

    for (const t of itemsTotal) {
      if (t.l) {
        doc.fontSize(t.b ? 12 : 9).font(t.b ? "Helvetica-Bold" : "Helvetica").fillColor(t.c);
        doc.text(t.l, totalColX, y);
        doc.text(t.v, totalValX, y, { align: "right" });
      }
      y += t.b ? 22 : 14;
    }

    // --- AMOUNT IN WORDS ---
    y += 4;
    doc.rect(48, y, pageWidth, 0.5).fill(gray + "40");
    y += 10;
    doc.fontSize(8).font("Helvetica-Bold").fillColor(dark).text(tr("Arrêtée la présente facture à la somme de :"), 48, y);
    y += 14;
    doc.fontSize(9).font("Helvetica").fillColor(green).text(`${nombreEnLettres(Math.floor(data.amount), lang)} ${tr("francs CFA")}${data.amount % 1 ? " et " + nombreEnLettres(Math.round(data.amount % 1 * 100), lang) + " centimes" : ""}`, 48, y, { width: pageWidth });

    // --- QR CODE + LEGAL MENTIONS ---
    y += 28;
    const qrSize = 90;
    const footerY = doc.page.height - 40;
    if (y + qrSize + 16 > footerY) {
      pageNum();
      doc.addPage();
      y = 48;
    }

    try {
      const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ""), "base64");
      doc.image(qrBuffer, doc.page.width - 48 - qrSize, y, { width: qrSize, height: qrSize });
      doc.fontSize(6.5).fillColor(gray).text(tr("Scannez pour vérifier\nauthenticité"), doc.page.width - 48 - qrSize, y + qrSize + 2, { width: qrSize, align: "center" });
    } catch {
      this.logger.warn("QR generation failed, skipping");
    }

    const legalX = 48;
    const legalW = doc.page.width - 48 - qrSize - 64 - 48;
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor(dark).text(tr("Conditions et mentions légales"), legalX, y);
    doc.fontSize(6.5).font("Helvetica").fillColor(gray);
    y += 13;
    const legalMentionsList = legalMentions(lang);
    for (const m of legalMentionsList) {
      doc.text(m, legalX, y, { width: legalW });
      y += 11;
    }

    // --- FOOTER ---
    const footY = doc.page.height - 40;
    doc.rect(48, footY - 6, pageWidth, 0.5).fill(gray + "30");
    doc.fontSize(6.5).fillColor(gray).font("Helvetica").text("ATB AgriTrace Bénin SARL – IFU: 3202012345678 – RCCM: RB/COT/24 A 12345 – BP 1234 Cotonou, Bénin – contact@agritrace.bj – +229 01 23 45 67 89", 48, footY, { width: pageWidth, align: "center" });

    pageNum();

    return new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.end();
    });
  }
}
