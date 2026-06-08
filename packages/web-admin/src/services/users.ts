import api from "./api";
import type { UserAccount } from "../types";

const MOCK: UserAccount[] = [
  { id: "ATB-U001", name: "Amadou Kouassi", email: "a.kouassi@atb.bj", company: "AgriExport SARL", role: "manager", status: "Actif", lastLogin: "2026-05-17", lots: 24,
    permissions: ["Export PDF", "Export CSV", "Voir lots", "Gérer commandes"],
    logs: [
      { action: "Connexion", date: "2026-05-17 09:15", details: "Depuis Cotonou, IP 197.x.x.x" },
      { action: "Export CSV", date: "2026-05-17 09:20", details: "Export de 24 lots" },
      { action: "Modification profil", date: "2026-05-16 14:30", details: "Mise à jour email" },
    ] },
  { id: "ATB-U002", name: "Fatou Diallo", email: "f.diallo@cotonbenin.bj", company: "Coton Bénin SA", role: "viewer", status: "Actif", lastLogin: "2026-05-16", lots: 18,
    permissions: ["Voir lots"],
    logs: [
      { action: "Connexion", date: "2026-05-16 08:00", details: "Depuis Bohicon" },
      { action: "Consultation lots", date: "2026-05-16 08:05", details: "Consultation de 3 lots Coton" },
    ] },
  { id: "ATB-U003", name: "Jean Adjovi", email: "j.adjovi@cacao.bj", company: "Cacao Export", role: "manager", status: "Actif", lastLogin: "2026-05-15", lots: 31,
    permissions: ["Export PDF", "Export CSV", "Voir lots", "Gérer commandes", "Créer lots"],
    logs: [
      { action: "Connexion", date: "2026-05-15 10:30", details: "Depuis Zogbodomey" },
      { action: "Création lot", date: "2026-05-15 10:45", details: "Création lot ATB-2403-009 (Cacao 2t)" },
    ] },
  { id: "ATB-U004", name: "Mariam Soro", email: "m.soro@anacarde.bj", company: "Anacarde Bénin", role: "viewer", status: "Inactif", lastLogin: "2026-04-28", lots: 5,
    permissions: ["Voir lots"],
    logs: [
      { action: "Connexion", date: "2026-04-28 07:45", details: "Depuis Parakou" },
      { action: "Déconnexion", date: "2026-04-28 16:30", details: "Fermeture session" },
    ] },
  { id: "ATB-U005", name: "Paul Zinsou", email: "p.zinsou@agriplus.bj", company: "AgriPlus", role: "user", status: "Actif", lastLogin: "2026-05-17", lots: 12,
    permissions: ["Export CSV", "Voir lots", "Gérer commandes"],
    logs: [
      { action: "Connexion", date: "2026-05-17 11:00", details: "Depuis Cotonou" },
      { action: "Commande", date: "2026-05-17 11:15", details: "Commande CMD-2024-005 confirmée" },
    ] },
  { id: "ATB-U006", name: "Kofi Mensah", email: "k.mensah@agrolog.bj", company: "AgroLogistique", role: "user", status: "Actif", lastLogin: "2026-05-14", lots: 9,
    permissions: ["Voir lots", "Export CSV"],
    logs: [
      { action: "Connexion", date: "2026-05-14 09:30", details: "Depuis Cotonou" },
    ] },
  { id: "ATB-U007", name: "Sébastien Hounkpatin", email: "s.hounkpatin@agri.bj", company: "AgriTech Bénin", role: "manager", status: "Actif", lastLogin: "2026-05-17", lots: 16,
    permissions: ["Export PDF", "Export CSV", "Voir lots", "Gérer commandes", "Créer lots"],
    logs: [
      { action: "Connexion", date: "2026-05-17 08:20", details: "Depuis Grand-Popo" },
      { action: "Export PDF", date: "2026-05-17 08:30", details: "Rapport mensuel téléchargé" },
    ] },
  { id: "ATB-U008", name: "Gilles Aholou", email: "g.aholou@admin.atb.bj", company: "ATB Administration", role: "super_admin", status: "Actif", lastLogin: "2026-05-18", lots: 0,
    permissions: ["Toutes les permissions", "Gestion utilisateurs", "Gestion plateforme", "Voir rapports", "Export"],
    logs: [
      { action: "Connexion", date: "2026-05-18 06:00", details: "Depuis Cotonou (admin)" },
      { action: "Modification utilisateur", date: "2026-05-18 06:15", details: "Activation compte Mariam Soro" },
      { action: "Export système", date: "2026-05-17 23:00", details: "Export journalier des logs" },
    ] },
  { id: "ATB-U009", name: "Rachel Zannou", email: "r.zannou@admin.atb.bj", company: "ATB Administration", role: "admin", status: "Actif", lastLogin: "2026-05-18", lots: 0,
    permissions: ["Gestion utilisateurs", "Voir rapports", "Export", "Modération"],
    logs: [
      { action: "Connexion", date: "2026-05-18 07:30", details: "Depuis Cotonou (admin)" },
      { action: "Validation certificat", date: "2026-05-17 16:00", details: "Certificat EUDR-2024-0250 validé" },
    ] },
];

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function fetchUsers(): Promise<UserAccount[]> {
  try { const { data } = await api.get("/users"); return data; }
  catch { await delay(); return [...MOCK]; }
}
