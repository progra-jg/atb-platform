const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export interface ReceiptOptions {
  receipt: { transactionId: string; orderId: string; amount: number; currency: string; provider: string; paidAt: string | Date };
  items?: { name: string; quantity: number; price: number }[];
  methodLabel: string;
  lang?: string;
}

export async function downloadPDFInvoice(paymentId: string, lang?: string): Promise<boolean> {
  try {
    const url = `${API_BASE}/payment/${paymentId}/invoice/download?lang=${lang || "fr"}`;
    const res = await fetch(url, { method: "POST" });
    if (!res.ok) return false;
    const blob = await res.blob();
    const urlObj = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = urlObj;
    a.download = `facture-atb-${paymentId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(urlObj);
    return true;
  } catch {
    return false;
  }
}

export function downloadReceipt(opts: ReceiptOptions): void {
  const paymentId = opts.receipt.transactionId;
  const lang = opts.lang || "fr";
  downloadPDFInvoice(paymentId, lang);
}

export function printReceipt(opts: ReceiptOptions): void {
  downloadReceipt(opts);
}
