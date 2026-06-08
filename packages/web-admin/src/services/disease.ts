import api from "./api";

export interface DiseaseRisk {
  id: string;
  region: string;
  crop: string;
  date: string;
  diseaseName: string;
  diseaseNameEn?: string;
  riskLevel: string;
  riskScore: number;
  description: string;
  preventiveMeasures: string;
  preventiveMeasuresEn?: string;
  treatment: string;
  treatmentEn?: string;
  activeAlert: boolean;
}

export interface DiseaseReport {
  id: string;
  farmerId?: string;
  region: string;
  crop: string;
  diseaseName: string;
  estimatedArea: number;
  severity?: string;
  status: string;
  imageUrl?: string;
  description: string;
  createdAt: string;
}

export interface DiseaseSummary {
  totalRisks: number;
  highRisk: number;
  moderateRisk: number;
  lowRisk: number;
  activeAlerts: number;
  reportsThisMonth: number;
  topDisease: string;
  mostAffectedRegion: string;
  mostAffectedCrop: string;
  riskTrend: { date: string; score: number }[];
}

const REGIONS = ["Zou", "Borgou", "Mono", "Ouémé", "Atlantique", "Collines", "Couffo", "Plateau"];
const CROPS = ["Cacao", "Coton", "Anacarde", "Café", "Maïs", "Soja", "Banane", "Ananas", "Manioc", "Riz"];
const DISEASES = [
  { diseaseName: "Mildiou", diseaseNameEn: "Downy mildew", crops: ["Cacao", "Anacarde", "Manioc"],
    risk: (t: number, h: number, p: number) => h > 70 && t > 18 && t < 25 ? 70 + Math.round(Math.random()*20) : 20 + Math.round(Math.random()*30) },
  { diseaseName: "Fusariose", diseaseNameEn: "Fusarium wilt", crops: ["Coton", "Maïs", "Soja", "Banane"],
    risk: (t: number, h: number, p: number) => t > 25 && h > 60 ? 65 + Math.round(Math.random()*20) : 15 + Math.round(Math.random()*30) },
  { diseaseName: "Rouille", diseaseNameEn: "Rust", crops: ["Café", "Soja", "Maïs", "Anacarde"],
    risk: (t: number, h: number, p: number) => h > 70 && p > 10 ? 60 + Math.round(Math.random()*25) : 10 + Math.round(Math.random()*30) },
  { diseaseName: "Pourriture brune", diseaseNameEn: "Brown rot", crops: ["Cacao", "Ananas", "Manioc", "Banane"],
    risk: (t: number, h: number, p: number) => h > 80 && p > 15 ? 75 + Math.round(Math.random()*20) : 25 + Math.round(Math.random()*25) },
  { diseaseName: "Cercosporiose", diseaseNameEn: "Cercospora leaf spot", crops: ["Soja", "Coton", "Manioc", "Riz"],
    risk: (t: number, h: number, p: number) => h > 75 && t > 22 ? 55 + Math.round(Math.random()*25) : 15 + Math.round(Math.random()*25) },
  { diseaseName: "Anthracnose", diseaseNameEn: "Anthracnose", crops: ["Mangue", "Anacarde", "Coton", "Haricot"],
    risk: (t: number, h: number, p: number) => h > 80 && p > 12 && t > 20 ? 70 + Math.round(Math.random()*20) : 20 + Math.round(Math.random()*25) },
  { diseaseName: "Oïdium", diseaseNameEn: "Powdery mildew", crops: ["Manioc", "Coton", "Haricot", "Soja"],
    risk: (t: number, h: number, p: number) => h > 40 && h < 70 && t > 15 && t < 27 ? 60 + Math.round(Math.random()*20) : 10 + Math.round(Math.random()*25) },
  { diseaseName: "Bactériose", diseaseNameEn: "Bacterial blight", crops: ["Riz", "Coton", "Manioc", "Tomate"],
    risk: (t: number, h: number, p: number) => h > 85 && p > 20 && t > 24 ? 65 + Math.round(Math.random()*25) : 15 + Math.round(Math.random()*25) },
];

function genRisks(): DiseaseRisk[] {
  const risks: DiseaseRisk[] = [];
  for (const region of REGIONS) {
    const temp = 22 + Math.round(Math.random() * 10);
    const hum = 55 + Math.round(Math.random() * 35);
    const prec = Math.round(Math.random() * 30);
    for (const d of DISEASES) {
      for (const crop of d.crops) {
        if (Math.random() > 0.3) {
          const score = d.risk(temp, hum, prec);
          risks.push({
            id: `${region}-${crop}-${d.diseaseName}`.toLowerCase().replace(/\s/g, "-"),
            region, crop, date: new Date().toISOString().split("T")[0],
            diseaseName: d.diseaseName, diseaseNameEn: d.diseaseNameEn,
            riskLevel: score >= 70 ? "severe" : score >= 50 ? "high" : score >= 30 ? "moderate" : "low",
            riskScore: Math.min(100, score),
            description: `${d.diseaseName} risk for ${crop} in ${region} based on current weather conditions`,
            preventiveMeasures: "Ensure good air circulation, avoid excess humidity, crop rotation",
            preventiveMeasuresEn: "Ensure good air circulation, avoid excess humidity, crop rotation",
            treatment: "Apply appropriate fungicides. Consult local agricultural extension service.",
            treatmentEn: "Apply appropriate fungicides. Consult local agricultural extension service.",
            activeAlert: score > 65,
          });
        }
      }
    }
  }
  return risks;
}

function genReports(): DiseaseReport[] {
  return [
    { id: "1", region: "Zou", crop: "Cacao", diseaseName: "Pourriture brune", estimatedArea: 2.5, severity: "high", status: "confirmed", description: "Fruits de cacao présentant des symptômes de pourriture brune dans la zone de Bohicon", createdAt: new Date(Date.now() - 2*86400000).toISOString() },
    { id: "2", region: "Borgou", crop: "Coton", diseaseName: "Fusariose", estimatedArea: 1.8, severity: "moderate", status: "reported", description: "Flétrissement suspect sur cotonniers près de Parakou", createdAt: new Date(Date.now() - 5*86400000).toISOString() },
    { id: "3", region: "Mono", crop: "Manioc", diseaseName: "Mildiou", estimatedArea: 3.2, severity: "high", status: "treated", description: "Attaque de mildiou sur parcelle de manioc à Lokossa", createdAt: new Date(Date.now() - 12*86400000).toISOString() },
    { id: "4", region: "Ouémé", crop: "Soja", diseaseName: "Rouille", estimatedArea: 1.0, severity: "low", status: "resolved", description: "Quelques foyers de rouille asiatique détectés et traités", createdAt: new Date(Date.now() - 20*86400000).toISOString() },
  ];
}

function genSummary(): DiseaseSummary {
  const risks = genRisks();
  return {
    totalRisks: risks.length,
    highRisk: risks.filter(r => r.riskLevel === "severe" || r.riskLevel === "high").length,
    moderateRisk: risks.filter(r => r.riskLevel === "moderate").length,
    lowRisk: risks.filter(r => r.riskLevel === "low").length,
    activeAlerts: risks.filter(r => r.activeAlert).length,
    reportsThisMonth: 4,
    topDisease: "Mildiou",
    mostAffectedRegion: "Zou",
    mostAffectedCrop: "Cacao",
    riskTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toISOString().split("T")[0],
      score: 20 + Math.round(Math.random() * 60),
    })),
  };
}

const MOCK_RISKS = genRisks();
const MOCK_REPORTS = genReports();
const MOCK_SUMMARY = genSummary();

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 300));

export async function fetchDiseaseRisks(region?: string, crop?: string): Promise<DiseaseRisk[]> {
  try {
    let url = "/disease/risks";
    if (region && crop) url += `/${region}/${crop}`;
    else if (region) url += `/${region}`;
    const { data } = await api.get(url);
    return data;
  } catch { await delay(); return MOCK_RISKS; }
}

export async function fetchDiseaseSummary(): Promise<DiseaseSummary> {
  try { const { data } = await api.get("/disease/summary"); return data; }
  catch { await delay(); return MOCK_SUMMARY; }
}

export async function fetchDiseaseReports(region?: string): Promise<DiseaseReport[]> {
  try { const { data } = await api.get(region ? `/disease/reports/${region}` : "/disease/reports"); return data; }
  catch { await delay(); return MOCK_REPORTS; }
}
