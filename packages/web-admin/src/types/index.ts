export interface AdminSession {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "superadmin" | "admin" | "manager";
  token: string;
}

export interface Farmer {
  id: string;
  name: string;
  phone: string;
  village: string;
  cooperative: string;
  culture: string;
  parcelles: number;
  lots: number;
  status: string;
}

export interface LogEntry {
  action: string;
  date: string;
  details: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  company: string;
  role: "super_admin" | "admin" | "manager" | "user" | "viewer";
  status: string;
  lastLogin: string;
  lots: number;
  permissions: string[];
  logs: LogEntry[];
}

export interface AlertItem {
  id: number;
  type: string;
  severity: string;
  parcelle: string;
  culture: string;
  date: string;
  status: string;
  surface: string;
  coordinates: string;
}

export interface ReportRow {
  filiere: string;
  lots: number;
  conformes: number;
  nonConformes: number;
  taux: number;
}

export interface KpiItem {
  label: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  up: boolean;
}

export interface EvolutionPoint {
  month: string;
  lots: number;
  producteurs: number;
}

export interface CultureRepartition {
  name: string;
  value: number;
  color: string;
}

export interface MonthlyCert {
  month: string;
  certs: number;
}

export interface FiliereCompletion {
  name: string;
  pct: number;
  color: string;
}

export interface CertificateItem {
  id: string;
  type: string;
  lot: string;
  culture: string;
  statut: string;
  emis: string;
  expire: string;
  emetteur: string;
  format: string;
  blockchain: boolean;
}
