import api from "./api";
import type { Lot, LotMedia, LotHarvest, LotStockQuality, LotLabResult, Certificate, DashboardStat } from "../types";
import { getAllFarmerLots, getFarmerLotById } from "./farmerLots";
import { formatNumber } from "../utils/format";

function mockLotMedia(culture: string, id: string): LotMedia[] {
  const palette: Record<string, string[]> = {
    Anacarde: ["#d4a373", "#e9c46a", "#f4a261"],
    Cacao: ["#6f4e37", "#8b5e3c", "#a67b5b"],
    Coton: ["#e3d5ca", "#d5bdaf", "#f5ebe0"],
    Café: ["#3e2723", "#5d4037", "#795548"],
    Riz: ["#f5f5dc", "#e8e0c8", "#fff8e7"],
    Soja: ["#8bc34a", "#9ccc65", "#aed581"],
  };
  const colors = palette[culture] || ["#81c784", "#66bb6a", "#4caf50"];
  return [
    { id: `${id}-img-1`, url: "", thumbnail: "", caption: "Vue d'ensemble du lot", type: "product" as const },
    { id: `${id}-img-2`, url: "", thumbnail: "", caption: "Parcelle de récolte", type: "field" as const },
    { id: `${id}-img-3`, url: "", thumbnail: "", caption: "Conditionnement", type: "product" as const },
  ].map((m, i) => ({ ...m, thumbnail: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${colors[i]}" rx="8"/><text x="200" y="140" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="48" font-weight="700">${culture[0]}</text><text x="200" y="180" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="16">${m.caption}</text></svg>`)}`, url: `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><rect width="1200" height="800" fill="${colors[i]}" rx="12"/><text x="600" y="380" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="72" font-weight="700">${culture[0]}</text><text x="600" y="440" text-anchor="middle" fill="rgba(255,255,255,0.6)" font-size="24">${m.caption}</text><text x="600" y="490" text-anchor="middle" fill="rgba(255,255,255,0.3)" font-size="14">${id} · cliquer pour agrandir</text></svg>`)}` }));
}

function mockHarvest(culture: string): LotHarvest {
  const years = ["2025", "2026"];
  return {
    date: `15/${Math.floor(Math.random() * 4 + 3)}/2026`,
    location: "Glazoué, Collines",
    year: years[Math.floor(Math.random() * years.length)],
    conditions: "Ensoleillé, récolte manuelle triée",
    qualityGrade: "Grade A — Premium",
  };
}

function mockStockQuality(): LotStockQuality {
  return {
    moisture: `${(8 + Math.random() * 4).toFixed(1)}%`,
    impurities: `${(1 + Math.random() * 3).toFixed(1)}%`,
    defects: `${(2 + Math.random() * 5).toFixed(1)}%`,
    netWeight: "4 850 kg",
    grossWeight: "5 200 kg",
    packaging: "Sacs de 50 kg — 97 sacs",
    packagingDate: `10/${Math.floor(Math.random() * 4 + 3)}/2026`,
    storageLocation: "Magasin de Glazoué",
    storageConditions: "Ventilé, 22–26°C, hygrométrie 55%",
  };
}

function mockLabResults(culture: string, id: string): LotLabResult[] {
  const results: Record<string, LotLabResult[]> = {
    Anacarde: [
      { id: `${id}-lab-1`, type: "Qualité", parameter: "Taux d'humidité", result: "8.2%", method: "ISO 665", date: "12/03/2026", laboratory: "Labo Bénin Contrôle" },
      { id: `${id}-lab-2`, type: "Qualité", parameter: "Taux de grains immatures", result: "3.5%", method: "ISO 6479", date: "12/03/2026", laboratory: "Labo Bénin Contrôle" },
      { id: `${id}-lab-3`, type: "Pureté", parameter: "Corps étrangers", result: "0.8%", method: "ISO 927", date: "12/03/2026", laboratory: "SGS Bénin" },
    ],
    Cacao: [
      { id: `${id}-lab-1`, type: "Qualité", parameter: "Taux d'humidité", result: "6.5%", method: "ISO 2291", date: "10/03/2026", laboratory: "Labo Bénin Contrôle" },
      { id: `${id}-lab-2`, type: "Qualité", parameter: "Taux de brisures", result: "2.1%", method: "ISO 2451", date: "10/03/2026", laboratory: "Labo Bénin Contrôle" },
      { id: `${id}-lab-3`, type: "Fermentation", parameter: "Test à la coupe", result: "82% bien fermenté", method: "ISO 1114", date: "10/03/2026", laboratory: "SGS Bénin" },
    ],
    Coton: [
      { id: `${id}-lab-1`, type: "Fibre", parameter: "Longueur de fibre", result: "30.2 mm", method: "HVI", date: "08/03/2026", laboratory: "Labo Textile Bénin" },
      { id: `${id}-lab-2`, type: "Fibre", parameter: "Résistance", result: "32.5 g/tex", method: "HVI", date: "08/03/2026", laboratory: "Labo Textile Bénin" },
    ],
  };
  return results[culture] || [
    { id: `${id}-lab-1`, type: "Qualité", parameter: "Taux d'humidité", result: "7.8%", method: "ISO 665", date: "12/03/2026", laboratory: "Labo Bénin Contrôle" },
    { id: `${id}-lab-2`, type: "Qualité", parameter: "Impuretés", result: "1.2%", method: "ISO 927", date: "12/03/2026", laboratory: "SGS Bénin" },
  ];
}

export async function fetchLots(params?: { culture?: string; statut?: string; region?: string }): Promise<Lot[]> {
  let apiLots: Lot[] = [];
  try {
    const { data } = await api.get("/lots", { params });
    apiLots = (data ?? []).map((d: any) => ({
      id: d.id, culture: d.culture, origine: d.origine || "",
      region: d.region || "", quantite: d.quantite || "",
      certification: d.certification || "", statut: d.statut || "Disponible",
      prix: d.prix || 0, producteur: d.cooperative || d.origine || "",
      producteurId: d.producteurId || "", cooperative: d.cooperative || "",
      note: d.note || 0, date: d.date || "", phone: d.phone || "",
      images: d.images?.length ? d.images : mockLotMedia(d.culture, d.id),
      harvest: d.harvest || mockHarvest(d.culture),
      stockQuality: d.stockQuality || mockStockQuality(),
      labResults: d.labResults?.length ? d.labResults : mockLabResults(d.culture, d.id),
    }));
  } catch { /* API fallback */ }

  const farmerLots = getAllFarmerLots().map((l: Lot) => ({
    ...l,
    images: l.images?.length ? l.images : mockLotMedia(l.culture, l.id),
    harvest: l.harvest || mockHarvest(l.culture),
    stockQuality: l.stockQuality || mockStockQuality(),
    labResults: l.labResults?.length ? l.labResults : mockLabResults(l.culture, l.id),
  }));

  const merged = [...farmerLots, ...apiLots];
  const seen = new Set<string>();
  return merged.filter((l: Lot) => { if (seen.has(l.id)) return false; seen.add(l.id); return true; });
}

export async function fetchLotById(id: string): Promise<any> {
  const farmerLot = getFarmerLotById(id);
  if (farmerLot) {
    const images = farmerLot.images?.length ? farmerLot.images : mockLotMedia(farmerLot.culture, farmerLot.id);
    const harvest = farmerLot.harvest || mockHarvest(farmerLot.culture);
    const stockQuality = farmerLot.stockQuality || mockStockQuality();
    const labResults = farmerLot.labResults?.length ? farmerLot.labResults : mockLabResults(farmerLot.culture, farmerLot.id);
    return { lot: { ...farmerLot, images, harvest, stockQuality, labResults }, timeline: [], certificates: [] };
  }
  try { const { data } = await api.get(`/lots/${id}`);
  const images = data.images?.length ? data.images : mockLotMedia(data.culture, data.id);
  const harvest = data.harvest || mockHarvest(data.culture);
  const stockQuality = data.stockQuality || mockStockQuality();
  const labResults = data.labResults?.length ? data.labResults : mockLabResults(data.culture, data.id);
  return {
    ...data,
    lot: {
      id: data.id, culture: data.culture, origine: data.origine || "",
      region: data.region || "", quantite: data.quantite || "",
      certification: data.certification || "", statut: data.statut || "Disponible",
      prix: data.prix || 0, producteur: data.cooperative || data.origine || "",
      producteurId: data.producteurId || "", cooperative: data.cooperative || "",
      note: data.note || 0, date: data.date || "", phone: data.phone || "",
      images, harvest, stockQuality, labResults,
    },
    timeline: data.transactions?.map((t: any, i: number) => ({
      step: i + 1, title: t.type, date: t.createdAt?.slice(0, 10) || "",
      lieu: "", acteur: "", desc: `${t.type} — ${t.montant || ""}`,
      status: t.onChain ? "completed" : "active",
    })) || [],
    certificates: data.certificates || [],
  };
  } catch { return null; }
}

function toFrenchDate(iso: string): string {
  if (!iso || iso === "—") return iso;
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  return iso;
}

export async function fetchCertificates(): Promise<Certificate[]> {
  try {
    const { data } = await api.get("/certificates");
    return (data ?? []).map((d: any) => ({
      id: d.id,
      type: d.type,
      lot: d.lotId || d.lot || "",
      culture: d.culture || "",
      statut: d.statut || "Valide",
      emis: toFrenchDate(d.emis || ""),
      expire: toFrenchDate(d.expire || ""),
      emetteur: d.emetteur || "",
      format: d.format || "",
      blockchain: d.blockchain || false,
    }));
  } catch {
    return [...MOCK_CERTIFICATES];
  }
}

const MOCK_CERTIFICATES: Certificate[] = [
  { id: "CERT-EUDR-001", type: "EUDR Due Diligence", lot: "ATB-2403-001", culture: "Cacao", statut: "Valide", emis: "12/05/2026", expire: "31/12/2026", emetteur: "SGS Bénin", format: "PDF", blockchain: true },
  { id: "CERT-GG-002", type: "GlobalGAP", lot: "ATB-2403-002", culture: "Coton", statut: "Valide", emis: "15/06/2025", expire: "15/06/2026", emetteur: "Control Union", format: "PDF", blockchain: true },
  { id: "CERT-BIO-003", type: "Certification Bio", lot: "ATB-2403-004", culture: "Café", statut: "Valide", emis: "02/03/2026", expire: "02/03/2027", emetteur: "Ecocert", format: "PDF", blockchain: false },
  { id: "CERT-EUDR-004", type: "EUDR Due Diligence", lot: "ATB-2403-005", culture: "Anacarde", statut: "Valide", emis: "10/04/2026", expire: "10/04/2027", emetteur: "Bureau Veritas", format: "PDF", blockchain: true },
  { id: "CERT-GG-005", type: "GlobalGAP", lot: "ATB-2403-007", culture: "Cacao", statut: "Valide", emis: "20/01/2026", expire: "20/01/2027", emetteur: "SGS Bénin", format: "PDF", blockchain: true },
  { id: "CERT-EUDR-006", type: "EUDR Due Diligence", lot: "ATB-2403-009", culture: "Café", statut: "Valide", emis: "05/05/2026", expire: "05/05/2027", emetteur: "Control Union", format: "PDF", blockchain: false },
  { id: "CERT-BIO-007", type: "Certification Bio", lot: "ATB-2403-010", culture: "Riz", statut: "Valide", emis: "15/11/2025", expire: "15/11/2026", emetteur: "Ecocert", format: "PDF", blockchain: true },
  { id: "CERT-EUDR-008", type: "EUDR Due Diligence", lot: "ATB-2403-012", culture: "Coton", statut: "Valide", emis: "22/03/2026", expire: "22/03/2027", emetteur: "SGS Bénin", format: "PDF", blockchain: true },
];

const FALLBACK_STATS: DashboardStat[] = [
  { labelKey: "dashboard.stats.lots", value: "0", sub: "—", color: "#1b5e20", bg: "#e8f5e9" },
  { labelKey: "dashboard.stats.validCertificates", value: "0", sub: "—", color: "#1565c0", bg: "#e3f2fd" },
  { labelKey: "dashboard.stats.farmers", value: "0", sub: "—", color: "#e65100", bg: "#fff3e0" },
  { labelKey: "dashboard.stats.averagePrice", value: "— FCFA", sub: "—", color: "#6a1b9a", bg: "#f3e5f5" },
];

export async function fetchDashboardStats(): Promise<DashboardStat[]> {
  try {
    const { data } = await api.get("/stats");
    return [
      { labelKey: "dashboard.stats.lots", value: String(data.lotsDisponibles ?? 0), sub: `+${data.lotsDisponibles ?? 0} ce mois`, color: "#1b5e20", bg: "#e8f5e9" },
      { labelKey: "dashboard.stats.validCertificates", value: String(data.certsValides ?? 0), sub: `${data.certsValides ?? 0} en cours`, color: "#1565c0", bg: "#e3f2fd" },
      { labelKey: "dashboard.stats.farmers", value: String(data.producteurs ?? 0), sub: `dans ${(data.prix ?? []).length} filières`, color: "#e65100", bg: "#fff3e0" },
      { labelKey: "dashboard.stats.averagePrice", value: data.prix?.[0]?.prixMoyen != null ? `${formatNumber(data.prix[0].prixMoyen)} FCFA` : "— FCFA", sub: data.prix?.[0]?.culture ?? "", color: "#6a1b9a", bg: "#f3e5f5" },
    ];
  } catch { return FALLBACK_STATS; }
}
