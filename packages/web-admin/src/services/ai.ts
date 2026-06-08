import api from "./api";

export interface AIAlert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  region: string;
  crop: string;
  createdAt: string;
  confidence: number;
}

export interface CropHealth {
  crop: string;
  healthScore: number;
  weatherFavorability: number;
  diseaseRisk: number;
  ndviEstimate: number;
  status: string;
}

export interface AIDashboardData {
  predictions: number;
  highRisks: number;
  weatherAlerts: number;
  monitoredCrops: number;
  riskTrend: { date: string; score: number }[];
  alerts: AIAlert[];
  cropHealth: CropHealth[];
  summary: string;
}

const delay = (ms = 400) => new Promise(r => setTimeout(r, ms + Math.random() * 300));

const MOCK: AIDashboardData = {
  predictions: 1284,
  highRisks: 7,
  weatherAlerts: 3,
  monitoredCrops: 11,
  riskTrend: Array.from({length:14}, (_,i) => ({ date: new Date(Date.now()-(13-i)*86400000).toISOString().split("T")[0], score: 25+Math.round(Math.random()*50) })),
  alerts: [
    { id:"1", type:"disease", severity:"high", title:"Risque Mildiou - Zou", description:"Conditions favorables au mildiou détectées dans la région du Zou pour les cultures de cacao", region:"Zou", crop:"Cacao", createdAt: new Date().toISOString(), confidence: 0.87 },
    { id:"2", type:"weather", severity:"moderate", title:"Stress thermique - Borgou", description:"Températures élevées prévues pour les 3 prochains jours dans le Borgou", region:"Borgou", crop:"Coton", createdAt: new Date(Date.now()-86400000).toISOString(), confidence: 0.92 },
    { id:"3", type:"disease", severity:"high", title:"Foyers de Fusariose - Mono", description:"Plusieurs foyers de fusariose signalés dans les plantations de coton du Mono", region:"Mono", crop:"Coton", createdAt: new Date(Date.now()-2*86400000).toISOString(), confidence: 0.78 },
    { id:"4", type:"weather", severity:"low", title:"Précipitations modérées - Ouémé", description:"Pluies modérées attendues dans l'Ouémé, favorables aux semis", region:"Ouémé", crop:"Maïs", createdAt: new Date(Date.now()-3*86400000).toISOString(), confidence: 0.95 },
    { id:"5", type:"yield", severity:"info", title:"Récolte prometteuse - Atlantique", description:"Les prévisions de rendement pour le maïs dans l'Atlantique sont supérieures de 15% à la moyenne", region:"Atlantique", crop:"Maïs", createdAt: new Date(Date.now()-4*86400000).toISOString(), confidence: 0.73 },
  ],
  cropHealth: [
    { crop:"Cacao", healthScore: 62, weatherFavorability: 58, diseaseRisk: 45, ndviEstimate: 72, status: "moderate" },
    { crop:"Coton", healthScore: 48, weatherFavorability: 42, diseaseRisk: 65, ndviEstimate: 55, status: "critical" },
    { crop:"Anacarde", healthScore: 78, weatherFavorability: 72, diseaseRisk: 25, ndviEstimate: 82, status: "healthy" },
    { crop:"Café", healthScore: 55, weatherFavorability: 60, diseaseRisk: 50, ndviEstimate: 60, status: "moderate" },
    { crop:"Maïs", healthScore: 85, weatherFavorability: 82, diseaseRisk: 18, ndviEstimate: 88, status: "healthy" },
    { crop:"Soja", healthScore: 72, weatherFavorability: 68, diseaseRisk: 30, ndviEstimate: 75, status: "healthy" },
    { crop:"Banane", healthScore: 45, weatherFavorability: 40, diseaseRisk: 70, ndviEstimate: 50, status: "critical" },
    { crop:"Ananas", healthScore: 68, weatherFavorability: 65, diseaseRisk: 35, ndviEstimate: 70, status: "moderate" },
    { crop:"Manioc", healthScore: 58, weatherFavorability: 55, diseaseRisk: 55, ndviEstimate: 62, status: "moderate" },
    { crop:"Riz", healthScore: 80, weatherFavorability: 78, diseaseRisk: 20, ndviEstimate: 85, status: "healthy" },
    { crop:"Sésame", healthScore: 70, weatherFavorability: 72, diseaseRisk: 28, ndviEstimate: 74, status: "healthy" },
  ],
  summary: "Au cours des dernières 24h, l'IA a analysé 1284 parcelles. 7 alertes maladie de niveau élevé sont actives, principalement dans le Zou (mildiou du cacao) et le Mono (fusariose du coton). Les prévisions météo indiquent un stress thermique modéré dans le Borgou. Les cultures les plus saines sont le maïs et le riz (score >80), tandis que le coton et la banane nécessitent une attention particulière.",
};

export async function fetchAIDashboard(): Promise<AIDashboardData> {
  try { const { data } = await api.get("/ai/dashboard"); return data; }
  catch { await delay(); return MOCK; }
}

export async function fetchCropHealth(region: string, crop: string) {
  try { const { data } = await api.get(`/ai/crop-health/${region}/${crop}`); return data; }
  catch { await delay(); return { region, crop, score: 65, status: "moderate", details: "Sample analysis based on satellite and weather data" }; }
}

export async function fetchPredictiveAlerts() {
  try { const { data } = await api.get("/ai/predictive-alerts"); return data; }
  catch { await delay(); return MOCK.alerts; }
}
