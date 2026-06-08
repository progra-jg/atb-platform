import api from "./api";
import type { KpiItem, EvolutionPoint, CultureRepartition, MonthlyCert, FiliereCompletion } from "../types";
import React from "react";
import { Users, Plant, SealCheck, Warning, Package } from "@phosphor-icons/react";

export interface SystemHealthItem {
  label: string;
  status: string;
  uptime: string;
}

export interface PendingAction {
  action: string;
  count: number;
  path: string;
}

export interface RegionDataItem {
  region: string;
  lots: number;
  producteurs: number;
  color: string;
}

export interface RecentAlertItem {
  type: string;
  severity: string;
  parcelle: string;
  date: string;
}

export interface DashboardData {
  kpis: KpiItem[];
  evolution: EvolutionPoint[];
  cultureRepartition: CultureRepartition[];
  monthlyCerts: MonthlyCert[];
  completion: FiliereCompletion[];
  systemHealth: SystemHealthItem[];
  pendingActions: PendingAction[];
  regionData: RegionDataItem[];
  recentAlerts: RecentAlertItem[];
}

const MOCK: DashboardData = {
  kpis: [
    { label: "Producteurs actifs", value: "890", change: "+12%", icon: React.createElement(Users), color: "#1976d2", bg: "rgba(25,118,210,0.1)", up: true },
    { label: "Lots tracés", value: "3,400", change: "+8%", icon: React.createElement(Package), color: "#2e7d32", bg: "rgba(46,125,50,0.1)", up: true },
    { label: "Certifications", value: "1,200", change: "+5%", icon: React.createElement(SealCheck), color: "#f57c00", bg: "rgba(245,124,0,0.1)", up: true },
    { label: "Parcelles", value: "1,250", change: "+3%", icon: React.createElement(Plant), color: "#7b1fa2", bg: "rgba(123,31,162,0.1)", up: true },
    { label: "Alertes", value: "3", change: "-2", icon: React.createElement(Warning), color: "#d32f2f", bg: "rgba(211,47,47,0.1)", up: false },
  ],
  evolution: [
    { month: "Jan", lots: 180, producteurs: 620 },
    { month: "Fév", lots: 220, producteurs: 650 },
    { month: "Mar", lots: 280, producteurs: 700 },
    { month: "Avr", lots: 350, producteurs: 740 },
    { month: "Mai", lots: 410, producteurs: 790 },
    { month: "Jun", lots: 480, producteurs: 820 },
    { month: "Jul", lots: 520, producteurs: 860 },
    { month: "Aoû", lots: 580, producteurs: 890 },
  ],
  cultureRepartition: [
    { name: "Cacao", value: 42, color: "#5d4037" },
    { name: "Coton", value: 28, color: "#efebe9" },
    { name: "Anacarde", value: 15, color: "#ffb300" },
    { name: "Café", value: 10, color: "#4e342e" },
    { name: "Maïs", value: 5, color: "#ffd54f" },
  ],
  monthlyCerts: [
    { month: "Jan", certs: 65 }, { month: "Fév", certs: 78 },
    { month: "Mar", certs: 92 }, { month: "Avr", certs: 110 },
    { month: "Mai", certs: 135 }, { month: "Jun", certs: 160 },
    { month: "Jul", certs: 140 }, { month: "Aoû", certs: 180 },
  ],
  completion: [
    { name: "Cacao", pct: 95, color: "#5d4037" },
    { name: "Coton", pct: 88, color: "#78909c" },
    { name: "Anacarde", pct: 72, color: "#ffb300" },
    { name: "Café", pct: 96, color: "#4e342e" },
    { name: "Maïs", pct: 82, color: "#ffd54f" },
  ],
  systemHealth: [
    { label: "API REST", status: "ok", uptime: "99.97%" },
    { label: "Blockchain", status: "ok", uptime: "99.99%" },
    { label: "Base de données", status: "ok", uptime: "99.95%" },
    { label: "Sentinel Hub", status: "warning", uptime: "98.20%" },
    { label: "WebSocket", status: "ok", uptime: "99.88%" },
  ],
  pendingActions: [
    { action: "Nouveaux producteurs", count: 12, path: "/farmers" },
    { action: "Certificats à vérifier", count: 8, path: "/compliance" },
    { action: "Alertes non résolues", count: 3, path: "/alerts" },
    { action: "Comptes en attente", count: 4, path: "/users" },
  ],
  regionData: [
    { region: "Zou", lots: 320, producteurs: 210, color: "#1b5e20" },
    { region: "Borgou", lots: 280, producteurs: 185, color: "#1565c0" },
    { region: "Mono", lots: 195, producteurs: 130, color: "#e65100" },
    { region: "Ouémé", lots: 160, producteurs: 110, color: "#6a1b9a" },
    { region: "Atlantique", lots: 95, producteurs: 75, color: "#2e7d32" },
  ],
  recentAlerts: [
    { type: "Déforestation", severity: "Haute", parcelle: "P-1024", date: "Aujourd'hui" },
    { type: "Déforestation", severity: "Moyenne", parcelle: "P-2048", date: "Hier" },
    { type: "Risque feu", severity: "Basse", parcelle: "P-3072", date: "Il y a 2 j" },
  ],
};

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function fetchDashboardData(): Promise<DashboardData> {
  try { const { data } = await api.get("/admin/dashboard"); return data; }
  catch { await delay(); return { ...MOCK, kpis: MOCK.kpis.map((k) => ({ ...k })) }; }
}
