-- ============================================================
-- ATB AgriTrace - Schéma de base de données PostgreSQL
-- (version sans PostGIS, coordonnées en JSONB)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 1. COOPÉRATIVES (doit être avant farmer_profiles à cause de la FK)
CREATE TABLE cooperatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  region VARCHAR(50) NOT NULL,
  member_ids TEXT[] DEFAULT '{}',
  president_name VARCHAR(100),
  contact_email VARCHAR(100),
  contact_phone VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROFILS UTILISATEURS
CREATE TABLE farmer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) UNIQUE NOT NULL,
  village VARCHAR(255),
  gps_coordinates JSONB,
  languages TEXT[] DEFAULT '{fr}',
  cooperative_id UUID REFERENCES cooperatives(id),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'farmer',
  anonymous_id VARCHAR(20) UNIQUE,
  is_anonymous BOOLEAN DEFAULT false,
  did_hash VARCHAR(255),
  did_verified BOOLEAN DEFAULT false,
  experience INT DEFAULT 0,
  display_name VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE buyer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company VARCHAR(150) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  country VARCHAR(50) NOT NULL,
  accreditations TEXT[],
  wallet_address VARCHAR(255),
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'buyer',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. ADMINISTRATEURS
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('superadmin','admin','manager')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PARCELLES (sans PostGIS, coordonnées en JSONB)
CREATE TABLE parcelles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES farmer_profiles(id),
  polygone JSONB NOT NULL,
  centre JSONB,
  superficie FLOAT NOT NULL,
  culture VARCHAR(50) NOT NULL,
  village VARCHAR(255),
  photos TEXT[],
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_parcelles_owner ON parcelles(owner_id);

-- 4. LOTS
CREATE TABLE lots (
  id VARCHAR(20) PRIMARY KEY,
  culture VARCHAR(50) NOT NULL,
  origine VARCHAR(100),
  region VARCHAR(50),
  quantite VARCHAR(20),
  certification VARCHAR(50),
  statut VARCHAR(20) DEFAULT 'Disponible' CHECK (statut IN ('Disponible','En transit','Vendu')),
  prix FLOAT NOT NULL,
  producteur_id UUID REFERENCES farmer_profiles(id),
  cooperative VARCHAR(150),
  note INT DEFAULT 0,
  date DATE,
  phone VARCHAR(20),
  parcelle_id UUID REFERENCES parcelles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PESÉES IoT
CREATE TABLE weighings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id VARCHAR(20) REFERENCES lots(id),
  producteur_id UUID REFERENCES farmer_profiles(id),
  weight_kg FLOAT NOT NULL,
  culture VARCHAR(50),
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  device_id VARCHAR(50) NOT NULL,
  device_type VARCHAR(20) DEFAULT 'balance',
  battery_level INT,
  location JSONB,
  raw_payload JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_weighings_lot ON weighings(lot_id);
CREATE INDEX idx_weighings_device ON weighings(device_id);

-- 6. CERTIFICATIONS
CREATE TABLE certificates (
  id VARCHAR(50) PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  lot_id VARCHAR(20) REFERENCES lots(id),
  culture VARCHAR(50),
  statut VARCHAR(20) DEFAULT 'Valide',
  emis DATE,
  expire DATE,
  emetteur VARCHAR(100),
  format VARCHAR(20),
  blockchain BOOLEAN DEFAULT false,
  blockchain_tx_hash VARCHAR(255),
  metadata_uri VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TRANSACTIONS & BLOCKCHAIN
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_id VARCHAR(20) REFERENCES lots(id),
  producteur_id UUID REFERENCES farmer_profiles(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('Vente','Livraison','Avance','Paiement')),
  montant VARCHAR(50),
  statut VARCHAR(20),
  blockchain_hash VARCHAR(255),
  blockchain_block VARCHAR(50),
  blockchain_timestamp TIMESTAMPTZ,
  on_chain BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CONFORMITÉ EUDR
CREATE TABLE eudr_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelle_id UUID REFERENCES parcelles(id),
  lot_id VARCHAR(20) REFERENCES lots(id),
  compliant BOOLEAN DEFAULT false,
  deforestation_detected BOOLEAN DEFAULT false,
  last_analysis DATE,
  satellite_source VARCHAR(50),
  ndvi_score FLOAT,
  details TEXT,
  alert_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_eudr_parcelle ON eudr_compliance(parcelle_id);

-- 9. PRÉDICTIONS IA (Rendement)
CREATE TABLE yield_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parcelle_id UUID REFERENCES parcelles(id),
  producteur_id UUID REFERENCES farmer_profiles(id),
  predicted FLOAT NOT NULL,
  unit VARCHAR(10) DEFAULT 'T',
  confidence FLOAT,
  confidence_interval VARCHAR(20),
  model_version VARCHAR(20),
  history JSONB,
  last_updated DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ALERTES PRIX
CREATE TABLE price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES buyer_profiles(id),
  crop VARCHAR(50) NOT NULL,
  direction VARCHAR(10) NOT NULL CHECK (direction IN ('above','below')),
  target_price INT NOT NULL,
  triggered BOOLEAN DEFAULT false,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, user_type);

-- 12. FAVORIS (acheteurs)
CREATE TABLE user_favorites (
  user_id UUID REFERENCES buyer_profiles(id),
  lot_id VARCHAR(20) REFERENCES lots(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, lot_id)
);

-- 13. HISTORIQUE DES PRIX
CREATE TABLE price_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  culture VARCHAR(50) NOT NULL,
  prix_moyen DECIMAL(10,2) NOT NULL,
  prix_min DECIMAL(10,2),
  prix_max DECIMAL(10,2),
  date DATE NOT NULL,
  source VARCHAR(20) DEFAULT 'market'
);
CREATE INDEX idx_price_history_culture ON price_history(culture);
CREATE INDEX idx_price_history_date ON price_history(date);

-- 14. ALERTES UTILISATEUR AVANCÉES
CREATE TABLE user_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('price_alert','new_lot','price_drop','new_producer')),
  crop VARCHAR(50),
  region VARCHAR(50),
  certification VARCHAR(50),
  direction VARCHAR(10) CHECK (direction IN ('above','below')),
  target_price DECIMAL(10,2),
  active BOOLEAN DEFAULT TRUE,
  triggered BOOLEAN DEFAULT FALSE,
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_user_alerts_user ON user_alerts(user_id);
CREATE INDEX idx_user_alerts_active ON user_alerts(user_id, active);

-- 15. DEMANDES D'ÉCHANTILLON
CREATE TABLE sample_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  lot_id VARCHAR(20) REFERENCES lots(id) ON DELETE CASCADE,
  producteur_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  quantite_demandee VARCHAR(50) DEFAULT '1 kg',
  message TEXT,
  adresse_livraison VARCHAR(255),
  telephone VARCHAR(30),
  statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('en_attente','acceptee','refusee','expediee','livree')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sample_requests_buyer ON sample_requests(buyer_id);

-- 16. MARCHÉ (Marketplace)
CREATE TABLE marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('semence','engrais','phyto','outillage','equipement')),
  description TEXT,
  price FLOAT NOT NULL,
  stock INT DEFAULT 0,
  image_url VARCHAR(500),
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE marketplace_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producteur_id UUID REFERENCES farmer_profiles(id),
  items JSONB NOT NULL,
  total FLOAT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','confirmed','paid','shipped','delivered','cancelled')),
  delivery_gps VARCHAR(255),
  payment_reference VARCHAR(255),
  tracking_number VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14B. POINTS DE VÉRIFICATION
CREATE TABLE verification_points (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  region VARCHAR(100) NOT NULL,
  ville VARCHAR(100) NOT NULL,
  cooperative VARCHAR(200) NOT NULL,
  coordinates DOUBLE PRECISION[] NOT NULL,
  capacity_tonnes INTEGER NOT NULL,
  services TEXT[] NOT NULL,
  contact VARCHAR(30) NOT NULL,
  inspection_fee_fcfa INTEGER NOT NULL
);

-- 15. JOURNAL D'AUDIT
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id VARCHAR(50),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_audit_user ON audit_log(user_id);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

-- ============================================================
-- VUES
-- ============================================================
CREATE VIEW v_farmer_dashboard AS
SELECT
  f.id,
  f.display_name,
  f.anonymous_id,
  f.is_anonymous,
  COUNT(DISTINCT p.id) AS parcelle_count,
  COALESCE(SUM(p.superficie), 0) AS superficie_totale,
  COUNT(DISTINCT l.id) AS lots_count,
  COALESCE(AVG(l.note), 0) AS note_moyenne
FROM farmer_profiles f
LEFT JOIN parcelles p ON p.owner_id = f.id
LEFT JOIN lots l ON l.producteur_id = f.id
GROUP BY f.id;

-- 16. CONTRATS CADRE
CREATE TABLE framework_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  producteur_id UUID REFERENCES farmer_profiles(id) ON DELETE CASCADE,
  lot_id VARCHAR(20) REFERENCES lots(id),
  culture VARCHAR(50) NOT NULL,
  volume_kg DECIMAL(12,2) NOT NULL,
  prix_kg DECIMAL(12,2) NOT NULL,
  devise VARCHAR(10) DEFAULT 'FCFA',
  date_debut DATE NOT NULL,
  date_fin DATE NOT NULL,
  calendrier_livraisons JSONB DEFAULT '[]',
  contre_offres JSONB DEFAULT '[]',
  conditions TEXT,
  statut VARCHAR(20) DEFAULT 'brouillon' CHECK (statut IN ('brouillon','envoye','en_negociation','signe','actif','termine','resilie')),
  signature_buyer_at TIMESTAMPTZ,
  signature_producteur_at TIMESTAMPTZ,
  montant_total DECIMAL(16,2),
  renouvelable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_framework_contracts_buyer ON framework_contracts(buyer_id);
CREATE INDEX idx_framework_contracts_producteur ON framework_contracts(producteur_id);
CREATE INDEX idx_framework_contracts_statut ON framework_contracts(statut);

-- ============================================================
-- TRIGGER: mise à jour updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_farmer_updated BEFORE UPDATE ON farmer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_buyer_updated BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_admin_updated BEFORE UPDATE ON admin_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_parcelle_updated BEFORE UPDATE ON parcelles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_lot_updated BEFORE UPDATE ON lots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- PAYOUTS (paiement sortant vers producteurs)
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES payments(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  producteur_id UUID NOT NULL REFERENCES farmer_profiles(id),
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'XOF',
  method VARCHAR(30) NOT NULL DEFAULT 'mobile_money',
  provider VARCHAR(30),
  phone VARCHAR(20),
  provider_ref VARCHAR(255),
  provider_data TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  status_message VARCHAR(500),
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  failure_reason TEXT,
  retry_count INT DEFAULT 0,
  last_retry_at TIMESTAMPTZ,
  idempotency_key VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_payouts_payment ON payouts(payment_id);
CREATE INDEX idx_payouts_producteur ON payouts(producteur_id);
CREATE INDEX idx_payouts_status ON payouts(status);
CREATE TRIGGER trg_payout_updated BEFORE UPDATE ON payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Financing / Input Credit
-- ============================================================
CREATE TABLE IF NOT EXISTS financing_offers (
  id VARCHAR(50) PRIMARY KEY,
  input_type VARCHAR(100) NOT NULL,
  label VARCHAR(255) NOT NULL,
  max_amount INT NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  duration_days INT NOT NULL,
  min_trust_score INT NOT NULL DEFAULT 600,
  collateral_required TEXT NOT NULL DEFAULT '["harvest"]',
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS financing_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producteur_id VARCHAR(100) NOT NULL,
  offer_id VARCHAR(50) NOT NULL REFERENCES financing_offers(id),
  amount INT NOT NULL,
  interest_rate DECIMAL(5,2) NOT NULL,
  total_repayable INT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','repaid','defaulted','cancelled')),
  collateral_type VARCHAR(50) NOT NULL DEFAULT 'harvest',
  collateral_ref VARCHAR(255),
  disbursed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  repaid_at TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  schedule TEXT NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_financing_contracts_producteur ON financing_contracts(producteur_id);
CREATE INDEX idx_financing_contracts_status ON financing_contracts(status);
CREATE TRIGGER trg_financing_contract_updated BEFORE UPDATE ON financing_contracts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TABLE IF NOT EXISTS financing_repayments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES financing_contracts(id) ON DELETE CASCADE,
  installment_index INT NOT NULL,
  amount INT NOT NULL,
  penalty INT NOT NULL DEFAULT 0,
  total_paid INT NOT NULL,
  transaction_ref VARCHAR(255) NOT NULL,
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_financing_repayments_contract ON financing_repayments(contract_id);

-- Seed financing offers
INSERT INTO financing_offers (id, input_type, label, max_amount, interest_rate, duration_days, min_trust_score, collateral_required) VALUES
  ('offer_seeds_maize', 'seeds_maize', 'Semences maïs', 150000, 8.0, 180, 600, '["harvest"]'),
  ('offer_seeds_rice', 'seeds_rice', 'Semences riz', 200000, 8.0, 180, 600, '["harvest"]'),
  ('offer_fertilizer', 'fertilizer', 'Engrais NPK', 250000, 7.0, 150, 650, '["harvest"]'),
  ('offer_pesticide', 'pesticide', 'Pesticides', 100000, 9.0, 120, 600, '["harvest"]'),
  ('offer_equipment', 'equipment', 'Petit équipement', 500000, 6.0, 365, 700, '["harvest","guarantor"]'),
  ('offer_transport', 'transport', 'Crédit transport', 300000, 10.0, 90, 550, '["harvest"]'),
  ('offer_storage', 'storage', 'Stockage & conservation', 200000, 8.0, 180, 650, '["harvest"]'),
  ('offer_irrigation', 'irrigation', 'Kit irrigation', 350000, 6.0, 365, 700, '["harvest"]'),
  ('offer_certification', 'certification', 'Certification Bio/EUDR', 400000, 5.0, 365, 750, '["harvest"]'),
  ('offer_labor', 'labor', 'Main-d''œuvre', 150000, 10.0, 90, 550, '["harvest"]')
ON CONFLICT (id) DO NOTHING;
