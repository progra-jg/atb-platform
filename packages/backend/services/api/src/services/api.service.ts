import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import * as bcrypt from "bcrypt";
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import * as QRCode from "qrcode";
import * as PDFDocument from "pdfkit";
import { MarketDataSourceService } from "./market-data-source.service";
import { Farmer } from "../entities/farmer.entity";
import { Buyer } from "../entities/buyer.entity";
import { AdminUser } from "../entities/admin.entity";
import { Parcelle } from "../entities/parcelle.entity";
import { Lot } from "../entities/lot.entity";
import { Certificate } from "../entities/certificate.entity";
import { EudrCompliance } from "../entities/compliance.entity";
import { Notification } from "../entities/notification.entity";
import { Order } from "../entities/order.entity";
import { Product } from "../entities/product.entity";
import { Cooperative } from "../entities/cooperative.entity";
import { AuditLog } from "../entities/audit-log.entity";
import { Review } from "../entities/review.entity";
import { Message } from "../entities/message.entity";
import { Transaction } from "../entities/transaction.entity";
import { PriceRecord } from "../entities/price-record.entity";
import { UserAlert } from "../entities/user-alert.entity";
import { UserFavorite } from "../entities/user-favorite.entity";
import { SampleRequest } from "../entities/sample-request.entity";
import { FrameworkContract } from "../entities/framework-contract.entity";
import { translate, getLocale, statutLabel, nombreEnLettres, dispositionsText, electronicNoticeText, Lang } from "../pdf-i18n";

@Injectable()
export class ApiService {
  private static memoryStore = new Map<string, { hash: string; user: Buyer }>();
  constructor(
    private readonly marketSource: MarketDataSourceService,
    @InjectRepository(Farmer) private farmerRepo: Repository<Farmer>,
    @InjectRepository(Buyer) private buyerRepo: Repository<Buyer>,
    @InjectRepository(AdminUser) private adminRepo: Repository<AdminUser>,
    @InjectRepository(Parcelle) private parcelleRepo: Repository<Parcelle>,
    @InjectRepository(Lot) private lotRepo: Repository<Lot>,
    @InjectRepository(Certificate) private certRepo: Repository<Certificate>,
    @InjectRepository(EudrCompliance) private complianceRepo: Repository<EudrCompliance>,
    @InjectRepository(Notification) private notifRepo: Repository<Notification>,
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Cooperative) private coopRepo: Repository<Cooperative>,
    @InjectRepository(AuditLog) private auditRepo: Repository<AuditLog>,
    @InjectRepository(Transaction) private txRepo: Repository<Transaction>,
    @InjectRepository(Review) private reviewRepo: Repository<Review>,
    @InjectRepository(Message) private messageRepo: Repository<Message>,
    @InjectRepository(PriceRecord) private priceRepo: Repository<PriceRecord>,
    @InjectRepository(UserAlert) private alertRepo: Repository<UserAlert>,
    @InjectRepository(UserFavorite) private favRepo: Repository<UserFavorite>,
    @InjectRepository(SampleRequest) private sampleRepo: Repository<SampleRequest>,
    @InjectRepository(FrameworkContract) private contractRepo: Repository<FrameworkContract>,
  ) {}

  // ─── Auth ──────────────────────────────────────────────
  private syntheticBuyer(dto: any) {
    return {
      id: dto.id || crypto.randomUUID(),
      company: dto.company || "ATB Buyer",
      email: dto.email || "buyer@atb.agri",
      country: dto.country || "BJ",
      phone: dto.phone || "",
      address: dto.address || "",
      metadata: dto.metadata || null,
      role: "buyer",
      createdAt: new Date(),
      updatedAt: new Date(),
      passwordHash: "",
    } as Buyer;
  }

  async registerBuyer(dto: { company: string; email: string; password: string; country: string }) {
    try {
      const hash = await bcrypt.hash(dto.password, 12);
      const user = this.buyerRepo.create({
        id: crypto.randomUUID(),
        company: dto.company,
        email: dto.email,
        country: dto.country,
        passwordHash: hash,
        role: "buyer",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      return await this.buyerRepo.save(user);
    } catch {
      const hash = await bcrypt.hash(dto.password, 12);
      const buyer = this.syntheticBuyer({ ...dto, id: crypto.randomUUID() });
      ApiService.memoryStore.set(dto.email, { hash, user: buyer });
      return buyer;
    }
  }

  async validateBuyer(email: string, password: string): Promise<Buyer | null> {
    let dbUser: Buyer | null = null;
    try {
      dbUser = await this.buyerRepo.findOne({ where: { email }, select: ["id", "company", "email", "country", "passwordHash", "role", "createdAt", "updatedAt"] });
    } catch {
      // DB unavailable
    }
    if (dbUser) {
      const ok = await bcrypt.compare(password, dbUser.passwordHash);
      if (ok) return dbUser;
    }
    const cached = ApiService.memoryStore.get(email);
    if (cached) {
      const ok = await bcrypt.compare(password, cached.hash);
      if (ok) return cached.user;
    }
    return null;
  }

  async getBuyerById(id: string): Promise<Buyer | null> {
    for (const [, v] of ApiService.memoryStore) {
      if (v.user.id === id) return v.user;
    }
    try {
      const db = await this.buyerRepo.findOne({ where: { id } });
      if (db) return db;
    } catch {
      // DB unavailable
    }
    return null;
  }

  async updateBuyerProfile(id: string, dto: any): Promise<Buyer | null> {
    for (const [, v] of ApiService.memoryStore) {
      if (v.user.id === id) {
        const allowed = ["company", "email", "country", "phone", "address", "metadata"];
        for (const key of allowed) {
          if (dto[key] !== undefined) (v.user as any)[key] = dto[key];
        }
        v.user.updatedAt = new Date();
        return v.user;
      }
    }
    try {
      const user = await this.buyerRepo.findOne({ where: { id } });
      if (user) {
        const allowed = ["company", "email", "country", "phone", "address", "metadata"];
        for (const key of allowed) {
          if (dto[key] !== undefined) (user as any)[key] = dto[key];
        }
        user.updatedAt = new Date();
        return await this.buyerRepo.save(user);
      }
    } catch {
      // DB unavailable
    }
    return null;
  }

  async changeBuyerPassword(id: string, currentPassword: string, newPassword: string): Promise<boolean> {
    for (const [, v] of ApiService.memoryStore) {
      if (v.user.id === id) {
        const ok = await bcrypt.compare(currentPassword, v.hash);
        if (!ok) return false;
        v.hash = await bcrypt.hash(newPassword, 12);
        return true;
      }
    }
    try {
      const user = await this.buyerRepo.findOne({ where: { id }, select: ["id", "passwordHash"] });
      if (user) {
        const ok = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!ok) return false;
        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await this.buyerRepo.save(user);
        return true;
      }
    } catch {
      // DB unavailable
    }
    return true;
  }

  async findOrCreateGoogleUser(email: string, name: string): Promise<Buyer> {
    for (const [, v] of ApiService.memoryStore) {
      if (v.user.email === email) return v.user;
    }
    try {
      const existing = await this.buyerRepo.findOne({ where: { email } });
      if (existing) return existing;
    } catch {
      // DB unavailable
    }
    const buyer = this.syntheticBuyer({
      id: crypto.randomUUID(),
      email,
      company: name || email.split("@")[0],
      country: "BJ",
    });
    ApiService.memoryStore.set(email, { hash: "", user: buyer });
    return buyer;
  }

  // ─── Dashboard ─────────────────────────────────────────
  async getDashboardStats() {
    const [farmers, buyers, lots, parcelles, alerts, certificates] = await Promise.all([
      this.farmerRepo.count(),
      this.buyerRepo.count(),
      this.lotRepo.count(),
      this.parcelleRepo.count(),
      this.complianceRepo.count({ where: { alertGenerated: true } }),
      this.certRepo.count(),
    ]);
    const lotsDisponibles = await this.lotRepo.count({ where: { statut: "Disponible" } });
    const superficieTotale = await this.parcelleRepo
      .createQueryBuilder("p")
      .select("COALESCE(SUM(p.superficie), 0)", "total")
      .getRawOne();
    return { farmers, buyers, lots, parcelles, alerts, certificates, lotsDisponibles, superficieTotale: parseFloat(superficieTotale?.total || "0") };
  }

  async getAdminDashboard() {
    const [farmerCount, lotCount, certCount, parcelleCount, alertCount, farmerNoLots, notifUnread] = await Promise.all([
      this.farmerRepo.count(),
      this.lotRepo.count(),
      this.certRepo.count(),
      this.parcelleRepo.count(),
      this.complianceRepo.count({ where: { alertGenerated: true } }),
      this.farmerRepo.count({ where: { isAnonymous: true } }),
      this.notifRepo.count({ where: { isRead: false } }),
    ]);
    const cultures = await this.lotRepo
      .createQueryBuilder("l")
      .select("l.culture", "culture")
      .addSelect("COUNT(*)", "cnt")
      .groupBy("l.culture")
      .getRawMany();
    const [certMonthly, lotsMonthly, regionData, recentAlertsRaw] = await Promise.all([
      this.certRepo
        .createQueryBuilder("c")
        .select("TO_CHAR(c.created_at, 'MM')", "month_num")
        .addSelect("COUNT(*)", "cnt")
        .groupBy("TO_CHAR(c.created_at, 'MM')")
        .orderBy("MIN(c.created_at)")
        .getRawMany(),
      this.lotRepo
        .createQueryBuilder("l")
        .select("TO_CHAR(l.created_at, 'MM')", "month_num")
        .addSelect("COUNT(*)", "cnt")
        .groupBy("TO_CHAR(l.created_at, 'MM')")
        .orderBy("MIN(l.created_at)")
        .getRawMany(),
      this.lotRepo
        .createQueryBuilder("l")
        .select("l.region", "region")
        .addSelect("COUNT(*)", "lots")
        .addSelect("COUNT(DISTINCT l.producteur_id)", "producteurs")
        .groupBy("l.region")
        .orderBy("COUNT(*)", "DESC")
        .getRawMany(),
      this.complianceRepo
        .createQueryBuilder("c")
        .leftJoin("parcelles", "p", "p.id = c.parcelle_id")
        .addSelect("p.culture", "culture")
        .where("c.alert_generated = true")
        .orderBy("c.created_at", "DESC")
        .take(3)
        .getRawMany(),
    ]);
    const monthNames = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];
    const monthNums = ["01","02","03","04","05","06","07","08","09","10","11","12"];
    const evolution = monthNames.map((m, i) => {
      const lm = lotsMonthly.find((r: any) => r.month_num === monthNums[i]);
      return { month: m, lots: lm ? parseInt(lm.cnt) : 0, producteurs: farmerCount };
    });
    const cultureRepartition = cultures.map((c: any, i: number) => ({
      name: c.culture,
      value: parseInt(c.cnt),
      color: ["#5d4037","#efebe9","#ffb300","#4e342e","#ffd54f"][i] || "#888",
    }));
    const monthlyCerts = monthNames.map((m, i) => {
      const cm = certMonthly.find((r: any) => r.month_num === monthNums[i]);
      return { month: m, certs: cm ? parseInt(cm.cnt) : 0 };
    });
    const completion = cultures.map((c: any, i: number) => ({
      name: c.culture,
      pct: Math.min(100, 60 + Math.round(Math.random() * 40)),
      color: ["#5d4037","#78909c","#ffb300","#4e342e","#ffd54f"][i] || "#888",
    }));
    const regionColors: Record<string, string> = { Zou: "#1b5e20", Borgou: "#1565c0", Mono: "#e65100", "Ouémé": "#6a1b9a", Atlantique: "#2e7d32", Collines: "#00695c", Plateau: "#880e4f" };
    const regionDataMapped = regionData.map((r: any) => ({
      region: r.region,
      lots: parseInt(r.lots),
      producteurs: parseInt(r.producteurs),
      color: regionColors[r.region] || "#888",
    }));
    const nonResolues = await this.complianceRepo.count({ where: { alertGenerated: true, compliant: false, deforestationDetected: true } });
    const recentAlerts = recentAlertsRaw.map((c: any) => ({
      type: "Déforestation",
      severity: c.c_deforestation_detected ? "Haute" : "Basse",
      parcelle: c.c_parcelle_id || "—",
      date: c.c_last_analysis || "—",
    }));
    return {
      kpis: [
        { label: "Producteurs actifs", value: String(farmerCount), change: "+12%", icon: "Users", color: "#1976d2", bg: "rgba(25,118,210,0.1)", up: true },
        { label: "Lots tracés", value: String(lotCount), change: "+8%", icon: "Package", color: "#2e7d32", bg: "rgba(46,125,50,0.1)", up: true },
        { label: "Certifications", value: String(certCount), change: "+5%", icon: "SealCheck", color: "#f57c00", bg: "rgba(245,124,0,0.1)", up: true },
        { label: "Parcelles", value: String(parcelleCount), change: "+3%", icon: "Plant", color: "#7b1fa2", bg: "rgba(123,31,162,0.1)", up: true },
        { label: "Alertes", value: String(alertCount), change: "-2", icon: "Warning", color: "#d32f2f", bg: "rgba(211,47,47,0.1)", up: false },
      ],
      evolution,
      cultureRepartition,
      monthlyCerts,
      completion,
      systemHealth: [
        { label: "API REST", status: "ok", uptime: "99.97%" },
        { label: "Blockchain", status: "ok", uptime: "99.99%" },
        { label: "Base de données", status: "ok", uptime: "99.95%" },
        { label: "Sentinel Hub", status: "warning", uptime: "98.20%" },
        { label: "WebSocket", status: "ok", uptime: "99.88%" },
      ],
      pendingActions: [
        { action: "Nouveaux producteurs", count: farmerNoLots, path: "/farmers" },
        { action: "Certificats à vérifier", count: notifUnread, path: "/compliance" },
        { action: "Alertes non résolues", count: nonResolues, path: "/alerts" },
        { action: "Comptes en attente", count: Math.max(0, farmerNoLots), path: "/users" },
      ],
      regionData: regionDataMapped,
      recentAlerts,
    };
  }

  // ─── Farmers ───────────────────────────────────────────
  async getFarmers() {
    const farmers = await this.farmerRepo.find({ order: { createdAt: "DESC" } });
    const enriched = await Promise.all(
      farmers.map(async (f) => {
        const [parcelles, lots, coop] = await Promise.all([
          this.parcelleRepo.find({ where: { ownerId: f.id } }),
          this.lotRepo.find({ where: { producteurId: f.id } }),
          f.cooperativeId ? this.coopRepo.findOne({ where: { id: f.cooperativeId } }) : null,
        ]);
        const mainCulture = lots.length > 0
          ? lots.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0].culture
          : (parcelles.length > 0 ? parcelles[0].culture : "—");
        return {
          id: f.id,
          name: f.displayName || f.name,
          phone: f.phone || "—",
          village: f.village || "—",
          cooperative: coop?.name || "—",
          culture: mainCulture,
          parcelles: parcelles.length,
          lots: lots.length,
          status: f.isAnonymous ? "Inactif" : "Actif",
        };
      }),
    );
    return enriched;
  }

  async getFarmer(id: string) {
    const farmer = await this.farmerRepo.findOne({ where: { id } });
    if (!farmer) return null;
    const [parcelles, lots, transactions, coop, weighings, predictions] = await Promise.all([
      this.parcelleRepo.find({ where: { ownerId: id } }),
      this.lotRepo.find({ where: { producteurId: id } }),
      this.txRepo.find({ where: { producteurId: id }, order: { createdAt: "DESC" }, take: 10 }),
      farmer.cooperativeId ? this.coopRepo.findOne({ where: { id: farmer.cooperativeId } }) : null,
      this.farmerRepo.query(`SELECT w.id, w.date, w.weight_kg, w.culture, w.lot_id, w.device_id FROM weighings w WHERE w.producteur_id = $1 ORDER BY w.date DESC LIMIT 5`, [id]).catch(() => []),
      this.farmerRepo.query(`SELECT yp.predicted, yp.unit, yp.confidence, yp.confidence_interval, yp.model_version, yp.last_updated, yp.history FROM yield_predictions yp WHERE yp.producteur_id = $1 ORDER BY yp.last_updated DESC LIMIT 1`, [id]).catch(() => []),
    ]);
    const certifications = lots.length > 0
      ? await this.certRepo.find({ where: { lotId: In(lots.map(l => l.id)) }, take: 10 })
      : [];
    const parcelleData = parcelles.map((p) => ({
      id: p.id,
      culture: p.culture,
      superficie: p.superficie,
      coordinates: p.polygone || [],
    }));
    const centre = parcelles.length > 0
      ? (parcelles[0].centre?.coordinates || (Array.isArray(parcelles[0].polygone) && parcelles[0].polygone.length > 0
        ? parcelles[0].polygone[0] : [0, 0]))
      : [0, 0];
    const eudrRecords = await this.complianceRepo.find({ where: { parcelleId: id }, order: { createdAt: "DESC" }, take: 1 });
    const eudr = eudrRecords.length > 0 ? {
      compliant: eudrRecords[0].compliant,
      deforestationDetected: eudrRecords[0].deforestationDetected,
      lastAnalysis: eudrRecords[0].lastAnalysis || "—",
      satelliteSource: eudrRecords[0].satelliteSource || "Sentinel-2 (ESA)",
      ndviScore: eudrRecords[0].ndviScore || 0,
      details: eudrRecords[0].details || "Aucune analyse disponible.",
    } : { compliant: true, deforestationDetected: false, lastAnalysis: "—", satelliteSource: "Sentinel-2 (ESA)", ndviScore: 0, details: "Aucune analyse disponible." };
    const prediction = predictions?.[0] || null;
    const yieldPrediction = prediction ? {
      predicted: prediction.predicted,
      unit: prediction.unit || "T",
      confidence: prediction.confidence || 0,
      confidenceInterval: prediction.confidence_interval || "±0%",
      modelVersion: prediction.model_version || "N/A",
      lastUpdated: prediction.last_updated || "—",
      history: prediction.history || [],
    } : null;
    const certificationData = certifications.map((c) => ({
      id: c.id,
      type: c.type,
      emetteur: c.emetteur || "—",
      emis: c.emis || "—",
      expire: c.expire || "—",
      statut: c.statut,
      blockchain: c.blockchain,
    }));
    const transactionData = transactions.map((t) => ({
      id: t.id,
      date: t.createdAt?.toLocaleDateString("fr-FR") || "—",
      type: t.type,
      montant: t.montant || "—",
      statut: t.statut || "—",
      blockchain: t.onChain ? { hash: t.blockchainHash || "—", block: t.blockchainBlock || "—", timestamp: t.blockchainTimestamp?.toISOString() || "—" } : undefined,
    }));
    const weighingsData = weighings.map((w: any) => ({
      date: w.date ? new Date(w.date).toLocaleDateString("fr-FR") : "—",
      weight: w.weight_kg,
      culture: w.culture || "—",
      lotId: w.lot_id || "—",
      deviceId: w.device_id || "—",
    }));
    const totalVolume = lots.reduce((sum, l) => sum + (parseFloat(l.quantite) || 0), 0) / 1000;
    const totalSuperficie = parcelles.reduce((sum, p) => sum + p.superficie, 0);
    const credibilityScore = Math.min(100, 50 + (farmer.didVerified ? 20 : 0) + Math.min(30, (farmer.experience ?? 0) * 2));
    const trustIndex = Math.min(100, credibilityScore + (eudr.compliant ? 5 : -10));
    const localisation = farmer.village || (coop ? coop.region : "—");
    const region = coop?.region || "—";
    const volumeUnit = "Tonnes";
    return {
      anonymousId: farmer.anonymousId || id,
      anonymous: farmer.isAnonymous,
      displayName: farmer.displayName || farmer.name,
      cooperative: coop?.name || "—",
      localisation,
      region,
      experience: farmer.experience || 0,
      didVerified: farmer.didVerified,
      didHash: farmer.didHash || "—",
      credibilityScore,
      trustIndex,
      totalTracedVolume: Math.round(totalVolume * 10) / 10 || 0,
      volumeUnit,
      superficie: totalSuperficie,
      parcelleCount: parcelles.length,
      parcelles: parcelleData,
      centre,
      eudr,
      yieldPrediction,
      certifications: certificationData,
      timeline: [
        { step: 1, title: "Inscription plateforme ATB", date: farmer.createdAt?.toLocaleDateString("fr-FR") || "—", lieu: localisation, acteur: farmer.displayName || farmer.name, desc: "Enregistrement avec vérification d'identité et géolocalisation parcellaire", status: "completed" },
        { step: 2, title: certifications.length > 0 ? "Première certification" : "En attente de certification", date: certifications.length > 0 ? certifications[0].emis || "—" : "—", lieu: localisation, acteur: certifications[0]?.emetteur || "—", desc: certifications.length > 0 ? `Certification ${certifications[0].type}` : "Aucune certification enregistrée", status: certifications.length > 0 ? "completed" : "pending" },
        { step: 3, title: eudr.compliant ? "Conforme EUDR" : "Non conforme EUDR", date: eudr.lastAnalysis, lieu: localisation, acteur: eudr.satelliteSource, desc: eudr.details, status: eudr.compliant ? "completed" : "active" },
        { step: 4, title: prediction ? "Modèle IA actif" : "Prédiction non disponible", date: prediction?.last_updated || "—", lieu: localisation, acteur: "ATB Data Lab", desc: prediction ? `Prédiction de rendement : ${prediction.predicted} ${prediction.unit || "T"}` : "Pas assez de données pour la prédiction", status: prediction ? "completed" : "pending" },
      ],
      recentWeighings: weighingsData,
      transactions: transactionData,
      contact: {
        managerName: coop?.presidentName || "—",
        phone: coop?.contactPhone || farmer.phone || "—",
        email: coop?.contactEmail || "—",
      },
    };
  }

  // ─── Lots ──────────────────────────────────────────────
  async getLots(filters?: { culture?: string; statut?: string; region?: string }) {
    const qb = this.lotRepo.createQueryBuilder("l");
    if (filters?.culture) qb.andWhere("l.culture = :culture", { culture: filters.culture });
    if (filters?.statut) qb.andWhere("l.statut = :statut", { statut: filters.statut });
    if (filters?.region) qb.andWhere("l.region = :region", { region: filters.region });
    return qb.orderBy("l.created_at", "DESC").getMany();
  }

  async getLot(id: string) {
    const lot = await this.lotRepo.findOne({ where: { id } });
    if (!lot) return null;
    const [certificates, transactions] = await Promise.all([
      this.certRepo.find({ where: { lotId: id } }),
      this.txRepo.find({ where: { lotId: id } }),
    ]);
    return { ...lot, certificates, transactions };
  }

  // ─── Certificates ──────────────────────────────────────
  async getCertificates() {
    const certs = await this.certRepo.find({ order: { createdAt: "DESC" } });
    return certs.map((c) => ({
      id: c.id,
      type: c.type,
      lot: c.lotId || "—",
      culture: c.culture || "—",
      statut: c.statut,
      emis: c.emis || "—",
      expire: c.expire || "—",
      emetteur: c.emetteur || "—",
      format: c.format || "PDF",
      blockchain: c.blockchain,
    }));
  }

  // ─── Alerts & Compliance ───────────────────────────────
  async getAlerts() {
    const [complianceAlerts, notifications] = await Promise.all([
      this.complianceRepo
        .createQueryBuilder("c")
        .leftJoin("parcelles", "p", "p.id = c.parcelle_id")
        .addSelect("p.culture", "culture")
        .where("c.alert_generated = true")
        .orderBy("c.created_at", "DESC")
        .getRawMany(),
      this.notifRepo.find({ order: { createdAt: "DESC" }, take: 20 }),
    ]);
    const severityMap: Record<string, string> = { cacao: "Haute", coton: "Moyenne", anacarde: "Basse", café: "Haute", maïs: "Moyenne" };
    const alertsList = complianceAlerts.map((c: any, i: number) => ({
      id: i + 1,
      type: "Déforestation",
      severity: severityMap[c.culture?.toLowerCase()] || "Moyenne",
      parcelle: c.c_parcelle_id || "—",
      culture: c.culture || "—",
      date: c.c_last_analysis || "—",
      status: c.c_compliant ? "Résolu" : c.c_deforestation_detected ? "Non résolu" : "En cours",
      surface: "—",
      coordinates: "—",
    }));
    return alertsList;
  }

  async getCompliance() {
    const all = await this.complianceRepo
      .createQueryBuilder("c")
      .leftJoin("parcelles", "p", "p.id = c.parcelle_id")
      .addSelect("p.culture", "culture")
      .orderBy("c.created_at", "DESC")
      .getRawMany();
    const grouped: Record<string, { lots: number; conformes: number; nonConformes: number }> = {};
    for (const c of all) {
      const culture = c.culture || "Inconnu";
      if (!grouped[culture]) grouped[culture] = { lots: 0, conformes: 0, nonConformes: 0 };
      grouped[culture].lots++;
      if (c.c_compliant) grouped[culture].conformes++;
      else grouped[culture].nonConformes++;
    }
    return Object.entries(grouped).map(([filiere, v]) => ({
      filiere,
      lots: v.lots,
      conformes: v.conformes,
      nonConformes: v.nonConformes,
      taux: v.lots > 0 ? Math.round((v.conformes / v.lots) * 1000) / 10 : 0,
    }));
  }

  // ─── Users (admin) ─────────────────────────────────────
  async getUsers() {
    const [admins, farmers, buyers] = await Promise.all([
      this.adminRepo.find({ order: { createdAt: "DESC" } }),
      this.farmerRepo.find({ order: { createdAt: "DESC" } }),
      this.buyerRepo.find({ order: { createdAt: "DESC" } }),
    ]);
    const toUserAccount = (entity: any, role: string, company: string, userType: string): any => ({
      id: entity.id,
      name: entity.fullName || entity.displayName || entity.name || entity.username || "—",
      email: entity.email || "—",
      company: company || "—",
      role,
      status: entity.isActive !== false && !entity.isAnonymous ? "Actif" : "Inactif",
      lastLogin: entity.lastLogin || entity.updatedAt?.toISOString?.()?.split("T")[0] || "—",
      lots: 0,
      permissions: role === "super_admin" ? ["Toutes les permissions", "Gestion utilisateurs", "Gestion plateforme", "Voir rapports", "Export"]
        : role === "admin" ? ["Gestion utilisateurs", "Voir rapports", "Export", "Modération"]
        : role === "manager" ? ["Export PDF", "Export CSV", "Voir lots", "Gérer commandes"]
        : ["Voir lots"],
      logs: [],
      userType,
    });
    return [
      ...admins.map((a) => {
        const roleMap: Record<string, string> = { superadmin: "super_admin", admin: "admin", manager: "manager" };
        return toUserAccount(a, roleMap[a.role] || "admin", "ATB Administration", "admin");
      }),
      ...farmers.map((f) => toUserAccount(f, "user", "—", "farmer")),
      ...buyers.map((b) => toUserAccount(b, "viewer", b.company || "—", "buyer")),
    ];
  }

  async createUser(dto: any) {
    if (dto.userType === "admin") {
      const hash = await bcrypt.hash(dto.password, 12);
      const user = this.adminRepo.create({ username: dto.username, email: dto.email, fullName: dto.fullName, passwordHash: hash, role: dto.role || "admin" });
      return this.adminRepo.save(user);
    }
    if (dto.userType === "farmer") {
      const hash = await bcrypt.hash(dto.password, 12);
      const user = this.farmerRepo.create({ name: dto.name, phone: dto.phone, village: dto.village, passwordHash: hash });
      return this.farmerRepo.save(user);
    }
    if (dto.userType === "buyer") {
      const hash = await bcrypt.hash(dto.password, 12);
      const user = this.buyerRepo.create({ company: dto.company, email: dto.email, country: dto.country, passwordHash: hash });
      return this.buyerRepo.save(user);
    }
    return null;
  }

  async updateUser(id: string, dto: any) {
    let entity: any;
    if (dto.userType === "admin") entity = await this.adminRepo.findOne({ where: { id } });
    else if (dto.userType === "farmer") entity = await this.farmerRepo.findOne({ where: { id } });
    else entity = await this.buyerRepo.findOne({ where: { id } });
    if (!entity) return null;
    const allowed = ["name", "email", "phone", "fullName", "username", "company", "country", "village", "role", "isActive"];
    for (const key of allowed) {
      if (dto[key] !== undefined) entity[key] = dto[key];
    }
    if (dto.password) entity.passwordHash = await bcrypt.hash(dto.password, 12);
    if (dto.userType === "admin") return this.adminRepo.save(entity);
    if (dto.userType === "farmer") return this.farmerRepo.save(entity);
    return this.buyerRepo.save(entity);
  }

  async deleteUser(id: string, userType: string) {
    if (userType === "admin") return this.adminRepo.delete(id);
    if (userType === "farmer") return this.farmerRepo.delete(id);
    if (userType === "buyer") return this.buyerRepo.delete(id);
    return null;
  }

  // ─── Orders ────────────────────────────────────────────
  async getOrders() {
    const orders = await this.orderRepo.find({ order: { createdAt: "DESC" } });
    return orders.map((o) => this.mapOrder(o));
  }

  async getOrder(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) return null;
    return this.mapOrder(order, true);
  }

  async createOrder(dto: any) {
    try {
      const order = this.orderRepo.create({
        buyerId: dto.buyerId,
        producteurId: dto.producteurId,
        items: dto.items || [],
        total: dto.total || 0,
        status: dto.status || "pending",
        adresseLivraison: dto.adresseLivraison || null,
        contactPhone: dto.contactPhone || null,
      });
      return await this.orderRepo.save(order);
    } catch (e: any) {
      return {
        id: `CMD-${Date.now().toString(36).toUpperCase()}`,
        items: dto.items || [],
        total: dto.total || 0,
        status: dto.status || "pending",
        adresseLivraison: dto.adresseLivraison || null,
        contactPhone: dto.contactPhone || null,
        createdAt: new Date().toISOString(),
      };
    }
  }

  async updateOrderStatus(id: string, status: string) {
    await this.orderRepo.update(id, { status });
    return this.orderRepo.findOne({ where: { id } });
  }

  private mapOrder(order: Order, withTimeline = false) {
    const items: any[] = Array.isArray(order.items) ? order.items : (order.items ? [order.items] : []);
    const first = items[0] || {};
    const statusMap: Record<string, string> = { pending: "En attente", confirmed: "Confirmée", shipped: "En livraison", delivered: "Livrée", cancelled: "Annulée" };
    const totalFormatted = order.total ? `${(order.total).toLocaleString("fr-FR")} FCFA` : "—";
    const date = order.createdAt?.toISOString()?.split("T")[0]?.split("-")?.reverse()?.join("/") || "—";
    const result: any = {
      id: order.id,
      lot: first.lotId || order.trackingNumber || first.product || "—",
      culture: first.culture || first.product || "—",
      quantite: first.quantite || (first.qty ? `${first.qty} unités` : "—"),
      prixUnitaire: first.prixUnitaire || (first.price ? `${first.price.toLocaleString("fr-FR")} FCFA` : "—"),
      total: totalFormatted,
      statut: statusMap[order.status] || order.status,
      date,
      livraison: order.deliveryGps || "—",
      buyerId: order.buyerId,
      producteurId: order.producteurId,
    };
    if (withTimeline) {
      const timeline: any[] = [
        { step: 1, title: "Commande créée", date, lieu: "—", acteur: "Acheteur", desc: "Commande soumise pour validation", status: "completed" },
      ];
      if (order.status === "confirmed" || order.status === "shipped" || order.status === "delivered") {
        timeline.push({ step: 2, title: "Confirmée", date, lieu: order.deliveryGps || "—", acteur: "Producteur", desc: "Commande validée par le producteur", status: "completed" });
      }
      if (order.status === "shipped" || order.status === "delivered") {
        timeline.push({ step: 3, title: "Expédiée", date, lieu: order.deliveryGps || "—", acteur: "Transporteur", desc: "Lot chargé et en transit", status: "completed" });
      }
      if (order.status === "delivered") {
        timeline.push({ step: 4, title: "Livrée", date, lieu: order.deliveryGps || "—", acteur: "Acheteur", desc: "Livraison réceptionnée avec succès", status: "completed" });
      }
      const nextStepTitle = ["", "En attente de confirmation", "Expédition", "Livraison"][timeline.length] || "Livraison";
      timeline.push({
        step: timeline.length + 1,
        title: nextStepTitle,
        date: "—",
        lieu: "—",
        acteur: "—",
        desc: "En attente",
        status: "pending",
      });
      result.timeline = timeline;
    }
    return result;
  }

  // ─── Messages ──────────────────────────────────────────
  async getConversations(userId: string) {
    const messages = await this.messageRepo.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      order: { createdAt: "DESC" },
    });
    const seen = new Set<string>();
    const conversations: any[] = [];
    for (const m of messages) {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (seen.has(otherId)) continue;
      seen.add(otherId);
      const farmer = await this.farmerRepo.findOne({ where: { id: otherId } });
      const buyer = farmer ? null : await this.buyerRepo.findOne({ where: { id: otherId } });
      conversations.push({
        otherId,
        otherName: farmer?.displayName || farmer?.name || buyer?.company || "—",
        lastMessage: m.message,
        lastDate: m.createdAt?.toISOString()?.split("T")[0] || "—",
        unread: !m.isRead && m.receiverId === userId ? 1 : 0,
      });
    }
    return conversations;
  }

  async getMessagesBetween(userId: string, otherId: string) {
    const messages = await this.messageRepo.find({
      where: [{ senderId: userId, receiverId: otherId }, { senderId: otherId, receiverId: userId }],
      order: { createdAt: "ASC" },
    });
    await this.messageRepo.update(
      { senderId: otherId, receiverId: userId, isRead: false },
      { isRead: true },
    );
    return messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      message: m.message,
      lotId: m.lotId,
      isMine: m.senderId === userId,
      createdAt: m.createdAt?.toISOString()?.split("T")[0] || "—",
    }));
  }

  async sendMessage(dto: { senderId: string; receiverId: string; lotId?: string; message: string }) {
    const msg = this.messageRepo.create({
      id: crypto.randomUUID(),
      senderId: dto.senderId,
      receiverId: dto.receiverId,
      lotId: dto.lotId || null,
      message: dto.message,
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return this.messageRepo.save(msg);
  }

  async markMessageRead(id: string) {
    await this.messageRepo.update(id, { isRead: true, updatedAt: new Date() });
    return { success: true };
  }

  async getUnreadMessageCount(userId: string) {
    return this.messageRepo.count({ where: { receiverId: userId, isRead: false } });
  }

  // ─── Reviews ───────────────────────────────────────────
  async createReview(dto: { orderId: string; buyerId: string; rating: number; comment?: string }) {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new Error("Commande introuvable");
    if (order.status !== "delivered") throw new Error("Seules les commandes livrées peuvent être notées");
    if (order.buyerId !== dto.buyerId) throw new Error("Vous n'êtes pas l'acheteur de cette commande");
    const existing = await this.reviewRepo.findOne({ where: { orderId: dto.orderId } });
    if (existing) throw new Error("Cette commande a déjà été notée");
    const review = this.reviewRepo.create({
      id: crypto.randomUUID(),
      orderId: dto.orderId,
      buyerId: dto.buyerId,
      sellerId: order.producteurId,
      rating: dto.rating,
      comment: dto.comment || null,
      moderationStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.reviewRepo.save(review);
    await this.recalcSellerRating(order.producteurId);
    return saved;
  }

  async getSellerReviews(sellerId: string) {
    const reviews = await this.reviewRepo.find({
      where: { sellerId, moderationStatus: "approved" },
      order: { createdAt: "DESC" },
    });
    const enriched = await Promise.all(
      reviews.map(async (r) => {
        const buyer = await this.buyerRepo.findOne({ where: { id: r.buyerId } });
        return {
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          buyerName: buyer?.company || "Acheteur",
          createdAt: r.createdAt?.toISOString()?.split("T")[0] || "—",
        };
      }),
    );
    return enriched;
  }

  async getBuyerReviewForOrder(orderId: string, buyerId: string) {
    return this.reviewRepo.findOne({ where: { orderId, buyerId } });
  }

  private async recalcSellerRating(sellerId: string) {
    const result = await this.reviewRepo
      .createQueryBuilder("r")
      .select("AVG(r.rating)", "avg")
      .addSelect("COUNT(*)", "cnt")
      .where("r.seller_id = :sellerId", { sellerId })
      .andWhere("r.moderation_status = 'approved'")
      .getRawOne();
    const avg = result?.avg ? parseFloat(parseFloat(result.avg).toFixed(1)) : 0;
    const cnt = result?.cnt ? parseInt(result.cnt) : 0;
    await this.farmerRepo.update(sellerId, { avgRating: avg, reviewCount: cnt });
  }

  async getAllReviews(filters?: { sellerId?: string; moderationStatus?: string }) {
    const where: any = {};
    if (filters?.sellerId) where.sellerId = filters.sellerId;
    if (filters?.moderationStatus) where.moderationStatus = filters.moderationStatus;
    const reviews = await this.reviewRepo.find({ where, order: { createdAt: "DESC" } });
    return Promise.all(
      reviews.map(async (r) => {
        const [buyer, seller, order] = await Promise.all([
          this.buyerRepo.findOne({ where: { id: r.buyerId } }),
          this.farmerRepo.findOne({ where: { id: r.sellerId } }),
          this.orderRepo.findOne({ where: { id: r.orderId } }),
        ]);
        return {
          id: r.id,
          orderId: r.orderId,
          rating: r.rating,
          comment: r.comment,
          moderationStatus: r.moderationStatus,
          buyerName: buyer?.company || "—",
          sellerName: seller?.displayName || seller?.name || "—",
          orderStatus: order?.status || "—",
          createdAt: r.createdAt?.toISOString()?.split("T")[0] || "—",
        };
      }),
    );
  }

  async moderateReview(id: string, status: string) {
    await this.reviewRepo.update(id, { moderationStatus: status, updatedAt: new Date() });
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (review) await this.recalcSellerRating(review.sellerId);
    return { success: true };
  }

  // ─── Market ────────────────────────────────────────────
  async getMarketPrices() {
    // Try live data source (Mansa API), fallback to DB aggregation
    const live = await this.marketSource.fetch();
    if (live.length > 0) {
      return live.map((c) => ({
        culture: c.crop,
        prixMoyen: c.price,
        prixMin: c.price,
        prixMax: c.price,
        variation: c.change,
        unite: c.unit,
        miseAJour: c.lastUpdated,
        source: "live",
      }));
    }
    // Legacy fallback from lots table
    const lots = await this.lotRepo.find({ order: { date: "DESC" } });
    const grouped: Record<string, { culture: string; prix: number[] }> = {};
    for (const lot of lots) {
      if (!grouped[lot.culture]) grouped[lot.culture] = { culture: lot.culture, prix: [] };
      grouped[lot.culture].prix.push(lot.prix);
    }
    return Object.values(grouped).map((g) => ({
      culture: g.culture,
      prixMoyen: Math.round(g.prix.reduce((a, b) => a + b, 0) / g.prix.length),
      prixMin: Math.min(...g.prix),
      prixMax: Math.max(...g.prix),
      variation: 0,
      unite: "FCFA/kg",
      miseAJour: new Date().toISOString(),
      source: "internal",
    }));
  }

  async getProducts() {
    return this.productRepo.find({ where: { isAvailable: true }, order: { createdAt: "DESC" } });
  }

  // ─── Buyer Dashboard Stats ─────────────────────────────
  async getBuyerStats() {
    const lotsDisponibles = await this.lotRepo.count({ where: { statut: "Disponible" } });
    const certsValides = await this.certRepo.count({ where: { statut: "Valide" } });
    const producteurs = await this.farmerRepo.count();
    const marchands = await this.buyerRepo.count();
    const prix = await this.getMarketPrices();
    const lotsRecents = await this.lotRepo.find({ order: { date: "DESC" }, take: 5 });
    return { lotsDisponibles, certsValides, producteurs, marchands, prix, lotsRecents };
  }

  // ─── Parcelles ─────────────────────────────────────────
  async getParcelles(ownerId?: string) {
    if (ownerId) return this.parcelleRepo.find({ where: { ownerId }, order: { createdAt: "DESC" } });
    return this.parcelleRepo.find({ order: { createdAt: "DESC" } });
  }

  // ─── Audit Log ─────────────────────────────────────────
  async getAuditLogs() {
    return this.auditRepo.find({ order: { createdAt: "DESC" }, take: 100 });
  }

  async logAudit(entry: Partial<AuditLog>) {
    return this.auditRepo.save(this.auditRepo.create(entry));
  }

  // ─── Cooperatives ──────────────────────────────────────
  async getCooperatives() {
    return this.coopRepo.find({ order: { name: "ASC" } });
  }

  // ─── Notifications ─────────────────────────────────────
  private relativeTime(date: Date): string {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? "1 min" : `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? "1 h" : `${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 30) return days === 1 ? "1 j" : `${days} j`;
    return `${Math.floor(days / 30)} mois`;
  }

  async getNotifications() {
    const notifs = await this.notifRepo.find({ order: { createdAt: "DESC" }, take: 20 });
    return notifs.map((n) => ({
      id: n.id,
      title: n.title,
      desc: n.description || n.title,
      time: this.relativeTime(n.createdAt),
      unread: !n.isRead,
    }));
  }

  async markNotificationRead(id: string) {
    await this.notifRepo.update(id, { isRead: true });
  }

  async markAllNotificationsRead() {
    await this.notifRepo.createQueryBuilder().update().set({ isRead: true }).execute();
  }

  // ─── Price History ──────────────────────────────────────
  async getPriceHistory(culture: string | null, months: number) {
    const qb = this.priceRepo.createQueryBuilder("p")
      .orderBy("p.date", "DESC");

    if (culture) qb.andWhere("p.culture = :culture", { culture });

    const since = new Date();
    since.setMonth(since.getMonth() - months);
    qb.andWhere("p.date >= :since", { since: since.toISOString().split("T")[0] });

    const records = await qb.getMany();

    const grouped: Record<string, { culture: string; data: { date: string; avg: number; min: number; max: number }[] }> = {};
    for (const r of records) {
      if (!grouped[r.culture]) grouped[r.culture] = { culture: r.culture, data: [] };
      grouped[r.culture].data.push({
        date: r.date,
        avg: Number(r.prixMoyen),
        min: r.prixMin ? Number(r.prixMin) : Number(r.prixMoyen),
        max: r.prixMax ? Number(r.prixMax) : Number(r.prixMoyen),
      });
    }

    return Object.values(grouped).map((g) => ({
      ...g,
      data: g.data.sort((a, b) => a.date.localeCompare(b.date)),
    }));
  }

  // ─── User Alerts ────────────────────────────────────────
  async getUserAlerts(userId: string) {
    return this.alertRepo.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });
  }

  async createAlert(body: any) {
    const alert = this.alertRepo.create({
      id: crypto.randomUUID(),
      userId: body.userId,
      type: body.type,
      crop: body.crop || null,
      region: body.region || null,
      certification: body.certification || null,
      direction: body.direction || null,
      targetPrice: body.targetPrice || null,
      active: true,
      triggered: false,
    });
    return this.alertRepo.save(alert);
  }

  async toggleAlert(id: string) {
    const alert = await this.alertRepo.findOneBy({ id });
    if (!alert) return { error: "Alert not found" };
    alert.active = !alert.active;
    return this.alertRepo.save(alert);
  }

  async deleteAlert(id: string) {
    await this.alertRepo.delete(id);
    return { success: true };
  }

  async checkAlerts(userId: string) {
    const alerts = await this.alertRepo.find({ where: { userId, active: true, triggered: false } });
    const lots = await this.lotRepo.find();
    const triggered: any[] = [];

    for (const alert of alerts) {
      if (alert.type === "price_alert" && alert.crop && alert.targetPrice && alert.direction) {
        const matching = lots.filter((l) => l.culture === alert.crop);
        for (const lot of matching) {
          if (alert.direction === "above" && lot.prix >= alert.targetPrice) {
            alert.triggered = true;
            alert.triggeredAt = new Date();
            triggered.push({ alertId: alert.id, type: "price_alert", crop: alert.crop, message: `Le prix du ${alert.crop} a atteint ${lot.prix} CFA` });
            break;
          }
          if (alert.direction === "below" && lot.prix <= alert.targetPrice) {
            alert.triggered = true;
            alert.triggeredAt = new Date();
            triggered.push({ alertId: alert.id, type: "price_alert", crop: alert.crop, message: `Le prix du ${alert.crop} est descendu à ${lot.prix} CFA` });
            break;
          }
        }
      }

      if (alert.type === "new_lot" && alert.region) {
        const newLots = lots.filter((l) => l.region === alert.region && l.certification === (alert.certification || l.certification));
        if (newLots.length > 0) {
          alert.triggered = true;
          alert.triggeredAt = new Date();
          triggered.push({ alertId: alert.id, type: "new_lot", region: alert.region, message: `Nouveau lot ${alert.certification || ""} disponible dans ${alert.region}` });
        }
      }

      if (alert.type === "price_drop" && alert.crop) {
        const cropLots = lots.filter((l) => l.culture === alert.crop);
        const avg = cropLots.reduce((s, l) => s + l.prix, 0) / (cropLots.length || 1);
        const minPrice = Math.min(...cropLots.map((l) => l.prix));
        if (minPrice < avg * 0.85) {
          alert.triggered = true;
          alert.triggeredAt = new Date();
          triggered.push({ alertId: alert.id, type: "price_drop", crop: alert.crop, message: `Baisse significative du prix du ${alert.crop}` });
        }
      }

      if (alert.type === "new_producer" && alert.certification) {
        const certifiedLots = lots.filter((l) => l.certification === alert.certification);
        if (certifiedLots.length > 0) {
          alert.triggered = true;
          alert.triggeredAt = new Date();
          triggered.push({ alertId: alert.id, type: "new_producer", message: `Nouveaux lots certifiés ${alert.certification} disponibles` });
        }
      }
    }

    await this.alertRepo.save(alerts.filter((a) => a.triggered));
    return { triggered };
  }

  // ─── Favorites ──────────────────────────────────────────
  async getFavorites(userId: string) {
    const favs = await this.favRepo.find({ where: { userId } });
    if (favs.length === 0) return [];
    const lotIds = favs.map((f) => f.lotId);
    const lots = await this.lotRepo.find({ where: { id: In(lotIds) } });
    return favs.map((f) => ({
      lotId: f.lotId,
      createdAt: f.createdAt,
      lot: lots.find((l) => l.id === f.lotId) || null,
    }));
  }

  async addFavorite(userId: string, lotId: string) {
    const existing = await this.favRepo.findOneBy({ userId, lotId });
    if (existing) return existing;
    const fav = this.favRepo.create({ userId, lotId });
    return this.favRepo.save(fav);
  }

  async removeFavorite(userId: string, lotId: string) {
    await this.favRepo.delete({ userId, lotId });
    return { success: true };
  }

  async getFavoriteUpdates(userId: string) {
    const favs = await this.favRepo.find({ where: { userId } });
    if (favs.length === 0) return [];
    const lotIds = favs.map((f) => f.lotId);
    const lots = await this.lotRepo.find({ where: { id: In(lotIds) } });
    return lots.map((lot) => ({
      lotId: lot.id,
      culture: lot.culture,
      currentPrice: lot.prix,
      available: lot.statut === "Disponible",
      message: lot.statut === "Disponible" ? "Disponible à l'achat" : `Statut: ${lot.statut}`,
    }));
  }

  // ─── Sample Requests ────────────────────────────────────
  async getSampleRequests(buyerId: string) {
    return this.sampleRepo.find({
      where: { buyerId },
      order: { createdAt: "DESC" },
    });
  }

  async createSampleRequest(body: any) {
    const req = this.sampleRepo.create({
      id: crypto.randomUUID(),
      buyerId: body.buyerId,
      lotId: body.lotId,
      producteurId: body.producteurId,
      quantiteDemandee: body.quantiteDemandee || "1 kg",
      message: body.message || null,
      adresseLivraison: body.adresseLivraison || null,
      telephone: body.telephone || null,
      statut: "en_attente",
    });
    return this.sampleRepo.save(req);
  }

  async updateSampleRequestStatus(id: string, statut: string) {
    await this.sampleRepo.update(id, { statut, updatedAt: new Date() });
    return this.sampleRepo.findOneBy({ id });
  }

  // ─── Market Feed ─────────────────────────────────────────
  async getMarketFeed() {
    const [lots, certs, prices] = await Promise.all([
      this.lotRepo.find({ order: { date: "DESC" }, take: 10 }),
      this.certRepo.find({ order: { emis: "DESC" }, take: 6 }),
      this.getPriceHistory(null, 4),
    ]);

    const fmt = (d: any): string | null => {
      if (!d) return null;
      if (typeof d === "string") return d.split("T")[0];
      if (d instanceof Date) return d.toISOString().split("T")[0];
      return null;
    };

    const feed: {
      type: string; icon: string; message: string; sub: string;
      time: string; color: string; href: string; id: string;
    }[] = [];

    for (const lot of lots) {
      const t = fmt(lot.date);
      if (!t) continue;
      feed.push({
        type: "lot",
        icon: "📦",
        message: `Nouveau lot ${lot.culture}`,
        sub: `${lot.prix.toLocaleString()} FCFA/kg · ${lot.region} · ${lot.statut}`,
        time: t,
        color: "#1a73e8",
        href: `/lots/${lot.id}`,
        id: lot.id,
      });
    }

    for (const cert of certs) {
      const t = fmt(cert.emis);
      if (!t) continue;
      feed.push({
        type: "cert",
        icon: "✅",
        message: `Certification ${cert.type}`,
        sub: `Lot ${cert.lotId} · ${cert.emetteur || "Émetteur inconnu"}`,
        time: t,
        color: "#43a047",
        href: `/certificates`,
        id: cert.id,
      });
    }

    for (const crop of prices) {
      const d = crop.data;
      if (d.length >= 2) {
        const last = d[d.length - 1];
        const prev = d[d.length - 2];
        const change = ((last.avg - prev.avg) / prev.avg * 100);
        const dir = change >= 0 ? "📈" : "📉";
        const sign = change >= 0 ? "+" : "";
        feed.push({
          type: "price",
          icon: dir,
          message: `${crop.culture} : ${sign}${change.toFixed(1)}%`,
          sub: `${last.avg.toLocaleString()} FCFA/kg (min ${last.min.toLocaleString()} · max ${last.max.toLocaleString()})`,
          time: last.date,
          color: change >= 0 ? "#2e7d32" : "#c62828",
          href: `/prices?crop=${encodeURIComponent(crop.culture)}`,
          id: crop.culture,
        });
      }
    }

    return feed
      .sort((a, b) => b.time.localeCompare(a.time))
      .slice(0, 20);
  }

  // ─── ESG / Sustainability Score ─────────────────────────-
  async getSustainabilityScore(lotId: string) {
    const lot = await this.lotRepo.findOneBy({ id: lotId });
    if (!lot) return null;

    let score = 0;
    const breakdown: { label: string; points: number; max: number; color: string }[] = [];

    if (lot.certification) {
      const pts = lot.certification === "Bio" ? 25 : lot.certification === "EUDR" ? 20 : 15;
      score += pts;
      breakdown.push({ label: `Certification ${lot.certification}`, points: pts, max: 25, color: "#43a047" });
    }

    const farmer = lot.producteurId ? await this.farmerRepo.findOneBy({ id: lot.producteurId }) : null;
    if (farmer) {
      if (farmer.didVerified) { score += 10; breakdown.push({ label: "Identité vérifiée (DID)", points: 10, max: 10, color: "#1a73e8" }); }
      if (farmer.experience >= 5) { const pts = Math.min(farmer.experience, 15); score += pts; breakdown.push({ label: `Expérience (${farmer.experience} ans)`, points: pts, max: 15, color: "#7c3aed" }); }
      if (farmer.cooperativeId) { score += 10; breakdown.push({ label: "Membre d'une coopérative", points: 10, max: 10, color: "#0891b2" }); }
    }

    const parcelle = await this.parcelleRepo.findOneBy({ ownerId: lot.producteurId });
    if (parcelle) {
      if (parcelle.isVerified) { score += 10; breakdown.push({ label: "Parcelle vérifiée", points: 10, max: 10, color: "#22c55e" }); }
    }

    const compliance = lot.id ? await this.complianceRepo.findOneBy({ lotId: lot.id }) : null;
    if (compliance) {
      if (compliance.compliant) { score += 15; breakdown.push({ label: "Conforme EUDR", points: 15, max: 15, color: "#2e7d32" }); }
      if (!compliance.deforestationDetected) { score += 10; breakdown.push({ label: "Zéro déforestation", points: 10, max: 10, color: "#43a047" }); }
      if (compliance.ndviScore) { const pts = Math.round(compliance.ndviScore * 10); score += pts; breakdown.push({ label: `Santé végétation (NDVI: ${compliance.ndviScore.toFixed(2)})`, points: pts, max: 10, color: "#66bb6a" }); }
    }

    const totalMax = breakdown.reduce((s, b) => s + b.max, 0);
    const pct = totalMax ? Math.round((score / totalMax) * 100) : 0;

    return {
      score: pct,
      total: score,
      max: totalMax,
      breakdown,
      level: pct >= 80 ? "Excellent" : pct >= 60 ? "Très bien" : pct >= 40 ? "Bon" : pct >= 20 ? "Moyen" : "Faible",
      color: pct >= 80 ? "#2e7d32" : pct >= 60 ? "#43a047" : pct >= 40 ? "#f57f17" : pct >= 20 ? "#e65100" : "#c62828",
    };
  }

  // ─── Framework Contracts v2 ────────────────────────────
  private validTransitions: Record<string, string[]> = {
    brouillon: ["envoye", "resilie"],
    envoye: ["en_negociation", "signe", "resilie"],
    en_negociation: ["signe", "envoye", "brouillon", "resilie"],
    signe: ["actif", "resilie"],
    actif: ["termine", "resilie"],
    termine: [],
    resilie: [],
  };

  async getFrameworkContracts(buyerId?: string, producteurId?: string) {
    const where: any = {};
    if (buyerId) where.buyerId = buyerId;
    if (producteurId) where.producteurId = producteurId;
    return this.contractRepo.find({ where, order: { createdAt: "DESC" } });
  }

  async getFrameworkContractById(id: string) {
    return this.contractRepo.findOneBy({ id });
  }

  async suggestContractPrice(culture: string) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const records = await this.priceRepo.find({
      where: { culture },
      order: { date: "DESC" },
      take: 6,
    });
    if (records.length === 0) return { culture, avg: null, min: null, max: null, count: 0 };
    const prices = records.map((r) => Number(r.prixMoyen));
    return {
      culture,
      avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
      min: Math.round(Math.min(...prices)),
      max: Math.round(Math.max(...prices)),
      count: records.length,
    };
  }

  async createFrameworkContract(body: any) {
    if (body.dateFin && body.dateDebut && new Date(body.dateFin) <= new Date(body.dateDebut)) {
      throw new Error("La date de fin doit être postérieure à la date de début");
    }
    const volume = Number(body.volumeKg);
    const prix = Number(body.prixKg);
    if (volume <= 0 || prix <= 0) throw new Error("Le volume et le prix doivent être positifs");
    const contract = this.contractRepo.create({
      id: crypto.randomUUID(),
      buyerId: body.buyerId,
      producteurId: body.producteurId,
      lotId: body.lotId || null,
      culture: body.culture,
      volumeKg: volume,
      prixKg: prix,
      devise: body.devise || "FCFA",
      dateDebut: body.dateDebut,
      dateFin: body.dateFin,
      conditions: body.conditions || null,
      renouvelable: body.renouvelable || false,
      montantTotal: volume * prix,
      statut: "brouillon",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.contractRepo.save(contract);
    await this.createNotif(body.buyerId, "Contrat créé", `Votre contrat ${body.culture} a été créé en brouillon`, "info");
    return saved;
  }

  async updateFrameworkContract(id: string, body: any) {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    if (body.culture) contract.culture = body.culture;
    if (body.volumeKg) { contract.volumeKg = Number(body.volumeKg); contract.montantTotal = contract.volumeKg * contract.prixKg; }
    if (body.prixKg) { contract.prixKg = Number(body.prixKg); contract.montantTotal = contract.volumeKg * contract.prixKg; }
    if (body.dateDebut) contract.dateDebut = body.dateDebut;
    if (body.dateFin) contract.dateFin = body.dateFin;
    if (body.conditions) contract.conditions = body.conditions;
    if (body.renouvelable !== undefined) contract.renouvelable = body.renouvelable;
    if (body.calendrierLivraisons) contract.calendrierLivraisons = body.calendrierLivraisons;
    if (body.statut) {
      const allowed = this.validTransitions[contract.statut] || [];
      if (!allowed.includes(body.statut)) throw new Error(`Transition ${contract.statut} → ${body.statut} non autorisée`);
      contract.statut = body.statut;
    }
    if (body.lotId) contract.lotId = body.lotId;
    if (body.producteurId) contract.producteurId = body.producteurId;
    contract.updatedAt = new Date();
    return this.contractRepo.save(contract);
  }

  async negotiateFrameworkContract(id: string, body: { role: string; prixKg: number; volumeKg: number; message: string }) {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    const allowedStates = ["brouillon", "envoye", "en_negociation"];
    if (!allowedStates.includes(contract.statut)) throw new Error("Ce contrat n'est pas en négociation");
    const offer = {
      role: body.role,
      prixKg: Number(body.prixKg),
      volumeKg: Number(body.volumeKg),
      message: body.message || "",
      createdAt: new Date().toISOString(),
    };
    contract.counterOffers = [...(contract.counterOffers || []), offer];
    contract.statut = "en_negociation";
    contract.updatedAt = new Date();
    const saved = await this.contractRepo.save(contract);
    const other = body.role === "buyer" ? "Le producteur" : "L'acheteur";
    await this.createNotif(contract.buyerId, `Contre-offre reçue`, `${other} a proposé ${offer.prixKg} FCFA/kg pour ${offer.volumeKg} kg`, "warning");
    return saved;
  }

  async signFrameworkContract(id: string, role: "buyer" | "producteur") {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    const allowed = ["brouillon", "envoye", "en_negociation", "signe"];
    if (!allowed.includes(contract.statut)) throw new Error("Ce contrat ne peut pas être signé");
    const now = new Date();
    if (role === "buyer") contract.signatureBuyerAt = now;
    else contract.signatureProducteurAt = now;
    if (contract.signatureBuyerAt && contract.signatureProducteurAt) {
      contract.statut = "actif";
      if (!contract.calendrierLivraisons || contract.calendrierLivraisons.length === 0) {
        const start = new Date(contract.dateDebut);
        const end = new Date(contract.dateFin);
        const months = Math.max(1, Math.round((end.getTime() - start.getTime()) / 30 / 86400000));
        const perMonth = +(contract.volumeKg / months).toFixed(2);
        const cal: { date: string; volume: number; statut: string }[] = [];
        for (let i = 0; i < months; i++) {
          const d = new Date(start.getFullYear(), start.getMonth() + i, 1);
          cal.push({ date: d.toISOString().split("T")[0], volume: perMonth, statut: "planifié" });
        }
        contract.calendrierLivraisons = cal;
      }
      // Auto-generate payments
      if (!contract.paiements || contract.paiements.length === 0) {
        const deliveries = contract.calendrierLivraisons || [];
        const total = Number(contract.montantTotal);
        const pms: { echeance: string; montant: number; statut: string; livraisonIndex?: number }[] = [];
        if (deliveries.length > 1) {
          const perDelivery = +(total / deliveries.length).toFixed(2);
          for (let i = 0; i < deliveries.length; i++) {
            pms.push({ echeance: deliveries[i].date, montant: perDelivery, statut: "en_attente", livraisonIndex: i });
          }
        } else {
          pms.push({ echeance: contract.dateFin, montant: total, statut: "en_attente" });
        }
        contract.paiements = pms;
      }
      await this.createNotif(contract.buyerId, "Contrat signé", `Le contrat ${contract.culture} est signé et actif`, "success");
    } else {
      const by = role === "buyer" ? "Vous avez" : "Le producteur a";
      await this.createNotif(contract.buyerId, "Signature partielle", `${by} signé le contrat ${contract.culture}`, "info");
    }
    contract.updatedAt = now;
    return this.contractRepo.save(contract);
  }

  async renewFrameworkContract(id: string) {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    if (contract.statut !== "termine" && contract.statut !== "actif") {
      throw new Error("Seuls les contrats actifs ou terminés peuvent être renouvelés");
    }
    const start = new Date(contract.dateFin);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setFullYear(end.getFullYear() + 1);
    const renewed = this.contractRepo.create({
      id: crypto.randomUUID(),
      buyerId: contract.buyerId,
      producteurId: contract.producteurId,
      culture: contract.culture,
      volumeKg: contract.volumeKg,
      prixKg: contract.prixKg,
      devise: contract.devise,
      dateDebut: start.toISOString().split("T")[0],
      dateFin: end.toISOString().split("T")[0],
      conditions: contract.conditions,
      renouvelable: contract.renouvelable,
      montantTotal: contract.montantTotal,
      statut: "brouillon",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.contractRepo.save(renewed);
    await this.createNotif(contract.buyerId, "Contrat renouvelé", `Le contrat ${contract.culture} a été renouvelé`, "success");
    return saved;
  }

  async markDeliveryReceived(id: string, index: number) {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    if (!contract.calendrierLivraisons || index >= contract.calendrierLivraisons.length) {
      throw new Error("Élément de livraison introuvable");
    }
    if (contract.calendrierLivraisons[index].statut === "livré") {
      throw new Error("Cette livraison est déjà marquée comme reçue");
    }
    contract.calendrierLivraisons[index].statut = "livré";
    contract.updatedAt = new Date();
    const allDelivered = contract.calendrierLivraisons.every((d) => d.statut === "livré");
    if (allDelivered) {
      contract.statut = "termine";
      await this.createNotif(contract.buyerId, "Contrat terminé", `Toutes les livraisons de ${contract.culture} sont reçues`, "success");
    }
    return this.contractRepo.save(contract);
  }

  async deleteFrameworkContract(id: string) {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    if (contract.statut !== "brouillon") throw new Error("Seuls les contrats en brouillon peuvent être supprimés");
    await this.contractRepo.remove(contract);
    return { deleted: true, id };
  }

  async duplicateFrameworkContract(id: string) {
    const orig = await this.contractRepo.findOneBy({ id });
    if (!orig) return null;
    const dup = this.contractRepo.create({
      id: crypto.randomUUID(),
      buyerId: orig.buyerId,
      producteurId: orig.producteurId,
      lotId: orig.lotId,
      culture: orig.culture,
      volumeKg: orig.volumeKg,
      prixKg: orig.prixKg,
      devise: orig.devise,
      dateDebut: orig.dateDebut,
      dateFin: orig.dateFin,
      conditions: orig.conditions ? `[Dupliqué] ${orig.conditions}` : "[Dupliqué]",
      renouvelable: orig.renouvelable,
      montantTotal: orig.montantTotal,
      statut: "brouillon",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const saved = await this.contractRepo.save(dup);
    await this.createNotif(orig.buyerId, "Contrat dupliqué", `Le contrat ${orig.culture} a été dupliqué en brouillon`, "info");
    return saved;
  }

  async markPaiementRegle(id: string, index: number) {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;
    if (!contract.paiements || index >= contract.paiements.length) throw new Error("Paiement introuvable");
    contract.paiements[index].statut = "payé";
    contract.paiements[index].methode = contract.paiements[index].methode || "virement";
    contract.paiements[index].payeAt = new Date().toISOString();
    // Check if all payments paid -> terminer contrat
    if (contract.paiements.every((p) => p.statut === "payé")) {
      contract.statut = "termine";
    }
    contract.updatedAt = new Date();
    return this.contractRepo.save(contract);
  }

  private getContractSignature(id: string): string {
    const secret = process.env.CONTRACT_SIGNING_SECRET || "atb_ctr_secret_dev_2024";
    return createHmac("sha256", secret).update(id).digest("hex");
  }

  verifyContractSignature(id: string, signature: string): boolean {
    const expected = this.getContractSignature(id);
    if (expected.length !== signature.length) return false;
    return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  }

  async exportFrameworkContractPdf(id: string, lang: Lang = "fr"): Promise<Buffer | null> {
    const contract = await this.contractRepo.findOneBy({ id });
    if (!contract) return null;

    const doc = new PDFDocument({ margin: 36, size: "A4", info: { Title: `${translate("CONTRAT", lang)} ${contract.culture}`, Author: "ATB AgriTrace" } });
    const bufs: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => bufs.push(chunk));

    const tr = (key: string) => translate(key, lang);
    const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n).replace(/\s/g, " ");
    const locale = getLocale(lang);
    const ds = (dt: Date | string) => new Date(dt).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" });
    const dl = (dt: Date | string) => new Date(dt).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    const pw = doc.page.width - 72;
    const green = "#0a6e4a";
    const gray = "#6b7280";
    const dark = "#1f2937";
    const light = "#f9fafb";

    // --- HEADER ---
    doc.rect(0, 0, doc.page.width, 80).fill(green);
    doc.fill("#ffffff").fontSize(18).font("Helvetica-Bold").text("ATB AGRITRACE", 36, 18);
    doc.fontSize(7).font("Helvetica").fillColor("#ffffffcc").text(tr("Plateforme B2B – Traçabilité Blockchain – Conformité EUDR"), 36, 46);

    const badgeX = doc.page.width - 36 - 135;
    doc.rect(badgeX, 16, 135, 36).fill("#ffffff");
    doc.fillColor(green).fontSize(13).font("Helvetica-Bold").text(tr("CONTRAT"), badgeX + 12, 22);
    doc.fontSize(7).font("Helvetica").fillColor(gray).text(contract.culture.toUpperCase(), badgeX + 12, 39);

    doc.rect(0, 80, doc.page.width, 1.5).fill(gray);

    // --- INFO BAR ---
    let y = 90;
    doc.rect(36, y, pw, 22).fill(green + "08");
    doc.fontSize(7).font("Helvetica").fillColor(dark);
    doc.text(`${tr("ID:")} ${contract.id.slice(0, 8)}...`, 40, y + 7, { width: 120 });
    doc.text(`${tr("Date:")} ${ds(contract.createdAt)}`, 180, y + 7, { width: 150 });
    doc.text(`${tr("Statut:")} ${statutLabel(contract.statut, lang).toUpperCase()}`, 360, y + 7, { width: 150 });
    doc.text(`${tr("Lieu:")} ${tr("Cotonou, Bénin")}`, 480, y + 7, { width: 120 });
    y += 28;

    // --- PARTIES ---
    doc.rect(36, y, pw, 1).fill(green); y += 8;
    doc.fillColor(dark).fontSize(8).font("Helvetica-Bold").text(tr("PARTIES"), 36, y); y += 12;
    doc.fontSize(6.5).font("Helvetica").fillColor(dark);

    const partyCol = [36, 185, 335];
    doc.font("Helvetica-Bold"); doc.text(tr("Plateforme:"), partyCol[0], y); doc.text(tr("Acheteur:"), partyCol[1], y); doc.text(tr("Producteur:"), partyCol[2], y); y += 10;
    doc.font("Helvetica").fillColor(gray);
    doc.text("ATB AgriTrace Bénin SARL", partyCol[0], y); doc.text(`ID: ${contract.buyerId?.slice(0, 12) || "—"}`, partyCol[1], y);
    if (contract.producteurId) doc.text(`ID: ${contract.producteurId.slice(0, 12)}`, partyCol[2], y); y += 9;
    if (contract.lotId) { doc.fillColor(dark).font("Helvetica-Bold").text(tr("Lot réf:"), partyCol[0], y); doc.font("Helvetica").fillColor(gray).text(contract.lotId.slice(0, 16), partyCol[0] + 40, y); }
    y += 18;

    // --- OBJET & DURÉE (compact) ---
    doc.rect(36, y, pw, 1).fill(green); y += 8;
    doc.fillColor(dark).fontSize(8).font("Helvetica-Bold").text(tr("OBJET & DURÉE"), 36, y); y += 12;
    doc.fontSize(6.5).font("Helvetica").fillColor(dark);
    const purposeText = `${tr("Vente de")} ${contract.culture} – ${tr("Du")} ${dl(contract.dateDebut)} ${tr("au")} ${dl(contract.dateFin)}${contract.renouvelable ? ` (${tr("renouvelable")})` : ""}.`;
    doc.text(purposeText, 36, y, { width: pw }); y += 16;

    // --- PRIX TABLE ---
    doc.rect(36, y, pw, 1).fill(green); y += 8;
    doc.fillColor(dark).fontSize(8).font("Helvetica-Bold").text(tr("CONDITIONS FINANCIÈRES"), 36, y); y += 12;

    const cx = [36, 170, 260, 340, 410, 490];
    const cw = [132, 88, 78, 68, 78, 40];
    doc.rect(36, y, pw, 16).fill(green + "10");
    doc.fillColor(dark).fontSize(6.5).font("Helvetica-Bold");
    [tr("Rubrique"), tr("Détail"), tr("Prix unitaire"), tr("Volume"), tr("Montant"), ""].forEach((h, i) => doc.text(h, cx[i], y + 5, { width: cw[i], align: i >= 2 ? "right" : "left" }));
    y += 16;

    doc.fontSize(7).font("Helvetica");
    const rd = [
      [tr("Culture"), contract.culture, "—", `${fmt(Number(contract.volumeKg))} kg`, "—", ""],
      [tr("Prix"), "", `${fmt(Number(contract.prixKg))} FCFA/kg`, "", "", ""],
    ];
    for (let i = 0; i < rd.length; i++) {
      doc.rect(36, y, pw, 15).fill(i % 2 === 0 ? "#ffffff" : light);
      doc.fillColor(dark);
      rd[i].forEach((c, j) => c ? doc.text(c, cx[j], y + 4, { width: cw[j], align: j >= 2 ? "right" : "left" }) : null);
      y += 15;
    }

    // Total row
    doc.rect(36, y, pw, 18).fill(green + "08");
    doc.font("Helvetica-Bold").fontSize(8).fillColor(green);
    doc.text(tr("MONTANT TOTAL"), 36, y + 5, { width: 130 });
    doc.text(`${fmt(Number(contract.montantTotal))} FCFA`, 36 + pw - 100, y + 5, { width: 90, align: "right" });
    y += 18;

    // Amount in words
    doc.rect(36, y, pw, 0.5).fill(gray + "40");
    y += 6;
    doc.fontSize(6.5).font("Helvetica").fillColor(gray).text(tr("Arrêté à :"), 36, y);
    doc.font("Helvetica-Bold").fillColor(dark).text(`${nombreEnLettres(Math.floor(Number(contract.montantTotal)), lang)} ${tr("francs CFA")}`, 36, y + 10, { width: pw });
    y += 28;

    // --- CONDITIONS ---
    if (contract.conditions) {
      doc.rect(36, y, pw, 1).fill(green); y += 8;
      doc.fillColor(dark).fontSize(7.5).font("Helvetica-Bold").text(tr("CONDITIONS PARTICULIÈRES"), 36, y); y += 10;
      doc.fontSize(6.5).font("Helvetica").fillColor(dark).text(contract.conditions, 36, y, { width: pw });
      y += 16;
    }

    // --- DELIVERIES & PAYMENTS (compact inline) ---
    let hasSub = false;
    if (contract.calendrierLivraisons?.length || contract.paiements?.length) {
      hasSub = true;
      doc.rect(36, y, pw, 1).fill(green); y += 8;
      doc.fillColor(dark).fontSize(7.5).font("Helvetica-Bold").text(tr("LIVRAISONS & PAIEMENTS"), 36, y); y += 10;

      if (contract.calendrierLivraisons?.length) {
        const dlArr = contract.calendrierLivraisons as any[];
        doc.rect(36, y, pw / 2 - 6, 14).fill(green + "08");
        doc.fillColor(dark).fontSize(6).font("Helvetica-Bold");
        doc.text(tr("Date"), 40, y + 4, { width: 60 }); doc.text(tr("Volume"), 140, y + 4, { width: 50 }); doc.text(tr("Statut"), 200, y + 4, { width: 50 });
        y += 14;
        doc.fontSize(6.5).font("Helvetica");
        for (let i = 0; i < Math.min(dlArr.length, 4); i++) {
          const l = dlArr[i];
          doc.rect(36, y, pw / 2 - 6, 13).fill(i % 2 === 0 ? "#ffffff" : light);
          doc.fillColor(dark);
          doc.text(dl(l.date), 40, y + 3, { width: 60 }); doc.text(fmt(Number(l.volume)), 140, y + 3, { width: 50 }); doc.text(statutLabel(l.statut || "en_attente", lang), 200, y + 3, { width: 50 });
          y += 13;
        }
        y += 4;
      }

      if (contract.paiements?.length) {
        const pmArr = contract.paiements as any[];
        const py = y - 4 - Math.min(pmArr.length, 4) * 13 - 14;
        doc.rect(pw / 2 + 42, py, pw / 2 - 6, 14).fill(green + "08");
        doc.fillColor(dark).fontSize(6).font("Helvetica-Bold");
        doc.text(tr("Échéance"), pw / 2 + 46, py + 4, { width: 70 }); doc.text(tr("Montant"), pw / 2 + 140, py + 4, { width: 60 }); doc.text(tr("Statut"), pw / 2 + 200, py + 4, { width: 50 });
        for (let i = 0; i < Math.min(pmArr.length, 4); i++) {
          const p = pmArr[i];
          const ry = py + 14 + i * 13;
          doc.rect(pw / 2 + 42, ry, pw / 2 - 6, 13).fill(i % 2 === 0 ? "#ffffff" : light);
          doc.fillColor(dark);
          doc.text(dl(p.echeance), pw / 2 + 46, ry + 3, { width: 70 }); doc.text(`${fmt(Number(p.montant))} FCFA`, pw / 2 + 140, ry + 3, { width: 60 }); doc.text(statutLabel(p.statut || "en_attente", lang), pw / 2 + 200, ry + 3, { width: 50 });
        }
        y = Math.max(y, py + 14 + Math.min(pmArr.length, 4) * 13 + 4) + 4;
      }
    }

    if (!hasSub) y += 4;

    // --- DISPOSITIONS ---
    doc.rect(36, y, pw, 1).fill(green); y += 8;
    doc.fillColor(dark).fontSize(7.5).font("Helvetica-Bold").text(tr("DISPOSITIONS"), 36, y); y += 10;
    doc.fontSize(5.8).font("Helvetica").fillColor(gray);
    const cl = [
      dispositionsText(lang),
    ];
    for (const c of cl) { doc.text(c, 36, y, { width: pw }); y += 9; }

    // --- ELECTRONIC NOTICE + QR ---
    y += 4;
    const qrS = 65;
    const ftrY = doc.page.height - 36;
    const noticeY = Math.min(y, ftrY - qrS - 16);
    if (y + qrS + 12 > ftrY) { noticeY; }

    doc.rect(36, noticeY, pw, 1).fill(green + "30");
    doc.fontSize(6).font("Helvetica").fillColor(gray);
    const noticeW = pw - qrS - 16;
    doc.text(electronicNoticeText(lang), 36, noticeY + 6, { width: noticeW });

    const qrUrl = `${process.env.API_PUBLIC_URL || "http://localhost:4000"}/api/framework-contracts/verify/${contract.id}?sig=${this.getContractSignature(contract.id)}`;
    try {
      const qr = await QRCode.toDataURL(qrUrl, { errorCorrectionLevel: "H", margin: 2, width: 200, color: { dark: green, light: "#ffffff" } });
      const qb = Buffer.from(qr.replace(/^data:image\/png;base64,/, ""), "base64");
      doc.image(qb, doc.page.width - 36 - qrS, noticeY, { width: qrS, height: qrS });
      doc.fontSize(5.5).fillColor(gray).text(tr("Vérifier"), doc.page.width - 36 - qrS, noticeY + qrS + 2, { width: qrS, align: "center" });
    } catch {}

    // --- FOOTER ---
    doc.rect(36, ftrY - 2, pw, 0.5).fill(gray + "30");
    doc.fontSize(5.5).fillColor(gray).font("Helvetica").text("ATB AgriTrace Bénin SARL – IFU: 3202012345678 – RCCM: RB/COT/24 A 12345 – contact@agritrace.bj – +229 01 23 45 67 89", 36, ftrY, { width: pw, align: "center" });

    return new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(bufs)));
      doc.end();
    });
  }

  private async createNotif(userId: string, title: string, message: string, type: string) {
    try {
      const notif = this.notifRepo.create({
        id: crypto.randomUUID(),
        userId,
        userType: "buyer",
        title,
        description: message,
        isRead: false,
        createdAt: new Date(),
      });
      await this.notifRepo.save(notif);
    } catch {}
  }
}
