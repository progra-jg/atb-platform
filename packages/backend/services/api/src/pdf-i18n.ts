export type Lang = "fr" | "en";

const locale = (lang: Lang) => lang === "en" ? "en-US" : "fr-FR";

export function t(key: string, lang: Lang): string {
  return contractMap[key]?.[lang] ?? invoiceMap[key]?.[lang] ?? key;
}

const contractMap: Record<string, Record<Lang, string>> = {
  CONTRAT: { fr: "CONTRAT", en: "CONTRACT" },
  "Plateforme B2B – Traçabilité Blockchain – Conformité EUDR": { fr: "Plateforme B2B – Traçabilité Blockchain – Conformité EUDR", en: "B2B Platform – Blockchain Traceability – EUDR Compliance" },
  PARTIES: { fr: "PARTIES", en: "PARTIES" },
  "Plateforme:": { fr: "Plateforme:", en: "Platform:" },
  "Acheteur:": { fr: "Acheteur:", en: "Buyer:" },
  "Producteur:": { fr: "Producteur:", en: "Producer:" },
  "Lot réf:": { fr: "Lot réf:", en: "Lot ref:" },
  "OBJET & DURÉE": { fr: "OBJET & DURÉE", en: "PURPOSE & DURATION" },
  "CONDITIONS FINANCIÈRES": { fr: "CONDITIONS FINANCIÈRES", en: "FINANCIAL TERMS" },
  Rubrique: { fr: "Rubrique", en: "Item" },
  Détail: { fr: "Détail", en: "Detail" },
  "Prix unitaire": { fr: "Prix unitaire", en: "Unit price" },
  Volume: { fr: "Volume", en: "Volume" },
  Montant: { fr: "Montant", en: "Amount" },
  Culture: { fr: "Culture", en: "Crop" },
  Prix: { fr: "Prix", en: "Price" },
  "MONTANT TOTAL": { fr: "MONTANT TOTAL", en: "TOTAL AMOUNT" },
  "Arrêté à :": { fr: "Arrêté à :", en: "Amount in words:" },
  "CONDITIONS PARTICULIÈRES": { fr: "CONDITIONS PARTICULIÈRES", en: "SPECIAL CONDITIONS" },
  "LIVRAISONS & PAIEMENTS": { fr: "LIVRAISONS & PAIEMENTS", en: "DELIVERIES & PAYMENTS" },
  Date: { fr: "Date", en: "Date" },
  Statut: { fr: "Statut", en: "Status" },
  Échéance: { fr: "Échéance", en: "Due date" },
  "En attente": { fr: "En attente", en: "Pending" },
  DISPOSITIONS: { fr: "DISPOSITIONS", en: "TERMS" },
  "Vérifier": { fr: "Vérifier", en: "Verify" },
  "ID:": { fr: "ID:", en: "ID:" },
  "Date:": { fr: "Date:", en: "Date:" },
  "Statut:": { fr: "Statut:", en: "Status:" },
  "Lieu:": { fr: "Lieu:", en: "Place:" },
};

const invoiceMap: Record<string, Record<Lang, string>> = {
  FACTURE: { fr: "FACTURE", en: "INVOICE" },
  PRESTATAIRE: { fr: "PRESTATAIRE", en: "PROVIDER" },
  "Date d'émission:": { fr: "Date d'émission:", en: "Issue date:" },
  "Mode de paiement:": { fr: "Mode de paiement:", en: "Payment method:" },
  "Transaction:": { fr: "Transaction:", en: "Transaction:" },
  "Fournisseur:": { fr: "Fournisseur:", en: "Provider:" },
  "FACTURÉ À": { fr: "FACTURÉ À", en: "BILL TO" },
  "#": { fr: "#", en: "#" },
  Produit: { fr: "Produit", en: "Product" },
  "Prix unit.": { fr: "Prix unit.", en: "Unit price" },
  Qté: { fr: "Qté", en: "Qty" },
  Total: { fr: "Total", en: "Total" },
  "Sous-total": { fr: "Sous-total", en: "Subtotal" },
  "TOTAL FACTURÉ": { fr: "TOTAL FACTURÉ", en: "TOTAL INVOICED" },
  "Conditions et mentions légales": { fr: "Conditions et mentions légales", en: "Terms and legal notices" },
  "Scannez pour vérifier\nauthenticité": { fr: "Scannez pour vérifier\nauthenticité", en: "Scan to verify\nauthenticity" },
};

const inlineTranslations: Record<string, Record<Lang, string>> = {
  "Cotonou, Bénin": { fr: "Cotonou, Bénin", en: "Cotonou, Benin" },
  "Vente de": { fr: "Vente de", en: "Sale of" },
  Du: { fr: "Du", en: "From" },
  au: { fr: "au", en: "to" },
  renouvelable: { fr: "renouvelable", en: "renewable" },
  "Frais de service (0,8 %)": { fr: "Frais de service (0,8 %)", en: "Service fee (0.8%)" },
  "francs CFA": { fr: "francs CFA", en: "CFA francs" },
  "Arrêtée la présente facture à la somme de :": { fr: "Arrêtée la présente facture à la somme de :", en: "This invoice is hereby stated in the amount of:" },
};

export function translate(key: string, lang: Lang): string {
  return contractMap[key]?.[lang] ?? invoiceMap[key]?.[lang] ?? inlineTranslations[key]?.[lang] ?? key;
}

export function getLocale(lang: Lang): string {
  return locale(lang);
}

export function statutLabel(statut: string, lang: Lang): string {
  const map: Record<string, Record<Lang, string>> = {
    en_attente: { fr: "En attente", en: "Pending" },
    payé: { fr: "Payé", en: "Paid" },
    reglé: { fr: "Réglé", en: "Settled" },
    livré: { fr: "Livré", en: "Delivered" },
    confirmé: { fr: "Confirmé", en: "Confirmed" },
  };
  return map[statut.toLowerCase()]?.[lang] ?? statut.replace(/_/g, " ");
}

export function nombreEnLettresFR(n: number): string {
  if (n === 0) return "zéro";
  const unités = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf", "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
  const dizaines = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];
  const f = (m: number): string => {
    if (m >= 1000) { const r = f(Math.floor(m / 1000)); return r + (r === "un" ? " mille" : " mille") + (m % 1000 ? " " + f(m % 1000) : ""); }
    if (m >= 100) { const c = Math.floor(m / 100); return (c > 1 ? unités[c] + " cent" : "cent") + (m % 100 ? " " + f(m % 100) : c > 1 ? "s" : ""); }
    if (m >= 20) { const d = Math.floor(m / 10); const u = m % 10; const base = dizaines[d]; return base + (u ? (d === 7 || d === 9 ? " et " : "-") + unités[u] : (d === 8 ? "s" : "")); }
    return unités[m];
  };
  return f(n);
}

export function nombreEnLettresEN(n: number): string {
  if (n === 0) return "zero";
  const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
  const f = (m: number): string => {
    if (m >= 1000000) { const r = f(Math.floor(m / 1000000)); return r + (r === "one" ? " million" : " million") + (m % 1000000 ? " " + f(m % 1000000) : ""); }
    if (m >= 1000) { const r = f(Math.floor(m / 1000)); return r + (r === "one" ? " thousand" : " thousand") + (m % 1000 ? " " + f(m % 1000) : ""); }
    if (m >= 100) { const c = Math.floor(m / 100); return (c > 1 ? ones[c] + " hundred" : "a hundred") + (m % 100 ? " and " + f(m % 100) : ""); }
    if (m >= 20) { const d = Math.floor(m / 10); const u = m % 10; return tens[d] + (u ? "-" + ones[u] : ""); }
    return ones[m];
  };
  return f(n);
}

export function nombreEnLettres(n: number, lang: Lang): string {
  return lang === "en" ? nombreEnLettresEN(n) : nombreEnLettresFR(n);
}

export function dispositionsText(lang: Lang): string {
  return lang === "en"
    ? "Blockchain & EUDR traceability  |  Commercial Court Cotonou  |  Force majeure suspends obligations  |  OHADA electronic signature  |  Confidentiality of exchanges"
    : "Traçabilité blockchain & EUDR  |  Tribunal de Commerce Cotonou  |  Force majeure suspend les obligations  |  Signature électronique OHADA  |  Confidentialité des échanges";
}

export function electronicNoticeText(lang: Lang): string {
  return lang === "en"
    ? "Electronic document generated by ATB AgriTrace – Made in Cotonou, Benin – Legal value under OHADA and Law No. 2017-20 on electronic transactions in Benin."
    : "Document électronique généré par ATB AgriTrace – Fait à Cotonou, Bénin – Valeur légale au sens de l'OHADA et de la loi n° 2017-20 sur les transactions électroniques au Bénin.";
}

export function legalMentions(lang: Lang): string[] {
  if (lang === "en") {
    return [
      "1. VAT not applicable – Article 299 bis of the CGI, exemption for agricultural products.",
      "2. Payment due immediately upon receipt. Any dispute must be reported within 72 business hours.",
      "3. Late penalties: 1.5% of the amount due per month of delay, in accordance with Law No. 2017-05.",
      "4. In case of dispute, exclusive jurisdiction of the Commercial Court of Cotonou (Benin).",
      "5. This invoice serves as proof of transaction on the ATB AgriTrace platform.",
      "6. To verify authenticity, scan the QR code or visit www.agritrace.bj/verify.",
    ];
  }
  return [
    "1. TVA non applicable – Article 299 bis du CGI, exonération des produits agricoles.",
    "2. Paiement dû immédiatement à réception. Tout litige doit être signalé dans les 72 heures ouvrées.",
    "3. Pénalités de retard : 1,5 % du montant dû par mois de retard, conformément à la loi n° 2017-05.",
    "4. En cas de litige, attribution exclusive au Tribunal de Commerce de Cotonou (Bénin).",
    "5. Cette facture fait office de preuve de transaction sur la plateforme ATB AgriTrace.",
    "6. Pour vérifier l'authenticité, scannez le QR code ou rendez-vous sur www.agritrace.bj/verify.",
  ];
}
