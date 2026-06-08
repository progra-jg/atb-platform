-- ============================================================
-- ATB AgriTrace - Données de démonstration
-- ============================================================

-- 1. COOPÉRATIVES
INSERT INTO cooperatives (id, name, region, member_ids, president_name, contact_phone) VALUES
('c0a80121-0001-4000-8000-000000000001', 'Coopérative Agricole du Zou', 'Zou', '{}', 'Kouassi Amadou', '+229 01 23 45 67'),
('c0a80121-0001-4000-8000-000000000002', 'Coopérative du Mono', 'Mono', '{}', 'Moussa Diallo', '+229 97 88 99 00'),
('c0a80121-0001-4000-8000-000000000003', 'Coopérative du Borgou', 'Borgou', '{}', 'Bakari Toundé', '+229 61 23 45 67'),
('c0a80121-0001-4000-8000-000000000004', 'Coopérative de l''Ouémé', 'Ouémé', '{}', 'Gisèle Hounkpatin', '+229 90 12 34 56');

-- 2. PRODUCTEURS (password_hash = hash bcrypt de "password123")
INSERT INTO farmer_profiles (id, name, phone, village, cooperative_id, password_hash, role, anonymous_id, is_anonymous, did_hash, did_verified, display_name, experience) VALUES
('f0000000-0001-4000-8000-000000000001', 'Koffi Agbozo', '+229 01 98 76 54', 'Zogbodomey', 'c0a80121-0001-4000-8000-000000000001', '$2b$10$dummyhash', 'farmer', 'KOF-AGB-001', false, '0x7a9f3c8d2e5b1a4f6c0d8e2f4a6b8c0d1e2f3a4b', true, 'Koffi Agbozo', 12),
('f0000000-0001-4000-8000-000000000002', 'Kouassi Amadou', '+229 97 88 99 00', 'Bohicon', 'c0a80121-0001-4000-8000-000000000001', '$2b$10$dummyhash', 'farmer', 'KOU-AMA-002', false, '0x3b8d1e4f7a2c5d0e9f1b3c6d8e0f2a4b6c8d0e1f', true, 'Kouassi Amadou', 8),
('f0000000-0001-4000-8000-000000000003', 'Moussa Diallo', '+229 61 23 45 67', 'Kandi', 'c0a80121-0001-4000-8000-000000000002', '$2b$10$dummyhash', 'farmer', 'MOU-DIA-003', false, '0x5c2e7d0a1b3f4c8e9d0f2a5b7c9d1e3f5a7b9c0d', true, 'Moussa Diallo', 6),
('f0000000-0001-4000-8000-000000000004', 'Bakari Toundé', '+229 90 12 34 56', 'Parakou', 'c0a80121-0001-4000-8000-000000000003', '$2b$10$dummyhash', 'farmer', 'BAK-TOU-004', false, '0x8d1f3a5b7c9e0d2f4a6b8c0d2e4f6a8b0c2d4e6f', true, 'Bakari Toundé', 15),
('f0000000-0001-4000-8000-000000000005', 'Gisèle Hounkpatin', '+229 97 76 54 32', 'Kétou', 'c0a80121-0001-4000-8000-000000000004', '$2b$10$dummyhash', 'farmer', 'GIS-HOU-005', false, '0xa2c4e6f8b0d2f4a6c8e0f2a4b6c8d0e2f4a6b8c0', true, 'Gisèle Hounkpatin', 5),
('f0000000-0001-4000-8000-000000000006', 'Sébastien Ahouansou', '+229 01 23 45 67', 'Grand-Popo', 'c0a80121-0001-4000-8000-000000000002', '$2b$10$dummyhash', 'farmer', 'SEB-AHO-006', false, '0x1d3f5a7b9c1e3f5a7b9d1f3a5c7e9b1d3f5a7c9e1', true, 'Sébastien Ahouansou', 3);

-- 2b. ADMINISTRATEURS (password_hash = hash bcrypt de "admin123")
INSERT INTO admin_users (id, username, email, full_name, password_hash, role) VALUES
('a0000000-0001-4000-8000-000000000100', 'superadmin', 'superadmin@atb.bj', 'Admin Super ATB', '$2b$10$dummyhash', 'superadmin'),
('a0000000-0001-4000-8000-000000000101', 'manager', 'manager@atb.bj', 'Gestionnaire ATB', '$2b$10$dummyhash', 'manager');

-- 3. ACHETEURS
INSERT INTO buyer_profiles (id, company, email, country, password_hash, role) VALUES
('b0000000-0001-4000-8000-000000000001', 'Cacao Import Europe', 'contact@cacao-import.eu', 'France', '$2b$10$cl6NluL/V5l68ChBTLV7CuMW/jZwWcEsEUvH611zwsVQw7AauuOzG', 'buyer'),
('b0000000-0001-4000-8000-000000000002', 'Benin Agro Export', 'info@beninagro.bj', 'Bénin', '$2b$10$cl6NluL/V5l68ChBTLV7CuMW/jZwWcEsEUvH611zwsVQw7AauuOzG', 'buyer');

-- 4. PARCELLES (coordonnées en JSONB)
INSERT INTO parcelles (id, owner_id, polygone, centre, superficie, culture, village, is_verified) VALUES
('a0000000-0001-4000-8000-000000000001', 'f0000000-0001-4000-8000-000000000001',
  '{"type":"Polygon","coordinates":[[[2.606,7.351],[2.612,7.351],[2.612,7.346],[2.606,7.346],[2.606,7.351]]]}',
  '{"type":"Point","coordinates":[2.609,7.3485]}',
  1.8, 'Cacao', 'Zogbodomey', true),
('a0000000-0001-4000-8000-000000000002', 'f0000000-0001-4000-8000-000000000001',
  '{"type":"Polygon","coordinates":[[[2.598,7.342],[2.604,7.342],[2.604,7.337],[2.598,7.337],[2.598,7.342]]]}',
  '{"type":"Point","coordinates":[2.601,7.3395]}',
  1.4, 'Coton', 'Zogbodomey', true),
('a0000000-0001-4000-8000-000000000003', 'f0000000-0001-4000-8000-000000000001',
  '{"type":"Polygon","coordinates":[[[2.614,7.356],[2.620,7.356],[2.620,7.351],[2.614,7.351],[2.614,7.356]]]}',
  '{"type":"Point","coordinates":[2.617,7.3535]}',
  1.0, 'Anacarde', 'Zogbodomey', true);

-- 5. LOTS
INSERT INTO lots (id, culture, origine, region, quantite, certification, statut, prix, producteur_id, cooperative, note, date) VALUES
('ATB-2403-001', 'Cacao', 'Zogbodomey', 'Zou', '5 000 kg', 'EUDR', 'Disponible', 2500, 'f0000000-0001-4000-8000-000000000001', 'Coopérative Agricole du Zou', 92, '2024-03-15'),
('ATB-2403-002', 'Coton', 'Bohicon', 'Zou', '3 200 kg', 'GlobalGAP', 'En transit', 1800, 'f0000000-0001-4000-8000-000000000002', 'Coopérative du Mono', 88, '2024-03-14'),
('ATB-2403-003', 'Anacarde', 'Parakou', 'Borgou', '2 000 kg', 'EUDR', 'Disponible', 3200, 'f0000000-0001-4000-8000-000000000004', 'Coopérative du Borgou', 95, '2024-03-13'),
('ATB-2403-004', 'Café', 'Kétou', 'Ouémé', '800 kg', 'Bio', 'Disponible', 4500, 'f0000000-0001-4000-8000-000000000005', 'Coopérative de l''Ouémé', 90, '2024-03-12'),
('ATB-2403-005', 'Maïs', 'Savalou', 'Zou', '10 000 kg', 'GlobalGAP', 'Vendu', 650, 'f0000000-0001-4000-8000-000000000002', 'Coopérative Agricole du Zou', 78, '2024-03-11'),
('ATB-2403-006', 'Cacao', 'Grand-Popo', 'Mono', '1 500 kg', 'Fair Trade', 'Disponible', 2800, 'f0000000-0001-4000-8000-000000000006', 'Coopérative du Mono', 85, '2024-03-10'),
('ATB-2403-007', 'Anacarde', 'Nikki', 'Borgou', '3 500 kg', 'EUDR', 'Disponible', 3100, 'f0000000-0001-4000-8000-000000000004', 'Coopérative du Borgou', 91, '2024-03-09'),
('ATB-2403-008', 'Coton', 'Kandi', 'Borgou', '5 000 kg', 'GlobalGAP', 'Disponible', 1700, 'f0000000-0001-4000-8000-000000000003', 'Coopérative du Borgou', 82, '2024-03-08');

-- 6. PESÉES IoT
INSERT INTO weighings (lot_id, producteur_id, weight_kg, culture, date, device_id, battery_level) VALUES
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 1245, 'Cacao', '2024-03-15T08:30:00Z', 'ATB-BAL-017', 85),
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 980, 'Cacao', '2024-03-15T10:15:00Z', 'ATB-BAL-017', 82),
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 1500, 'Cacao', '2024-03-16T09:00:00Z', 'ATB-BAL-009', 91),
('ATB-2403-003', 'f0000000-0001-4000-8000-000000000004', 875, 'Anacarde', '2024-03-13T14:20:00Z', 'ATB-BAL-009', 78),
('ATB-2403-006', 'f0000000-0001-4000-8000-000000000006', 2100, 'Cacao', '2024-03-10T11:45:00Z', 'ATB-BAL-017', 73);

-- 7. CERTIFICATS
INSERT INTO certificates (id, type, lot_id, culture, statut, emis, expire, emetteur, format, blockchain) VALUES
('EUDR-2024-0241', 'EUDR Due Diligence', 'ATB-2403-001', 'Cacao', 'Valide', '2024-03-15', '2024-12-31', 'SGS Bénin', 'PDF+XML', true),
('GG-2024-0892', 'GlobalGAP', 'ATB-2403-001', 'Cacao', 'Valide', '2023-06-15', '2024-06-15', 'Control Union', 'PDF', false),
('LAB-2024-331', 'Analyse Laboratoire', 'ATB-2403-001', 'Cacao', 'Valide', '2024-03-18', '2024-06-20', 'Laboratoire National', 'PDF', false);

-- 8. TRANSACTIONS
INSERT INTO transactions (lot_id, producteur_id, type, montant, statut, on_chain) VALUES
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 'Vente', '12500000', 'Confirmée', true),
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 'Livraison', '—', 'En transit', true),
('ATB-2403-003', 'f0000000-0001-4000-8000-000000000004', 'Vente', '6400000', 'Confirmée', true),
('ATB-2403-002', 'f0000000-0001-4000-8000-000000000002', 'Avance', '2000000', 'En attente', false);

-- 9. CONFORMITÉ EUDR
INSERT INTO eudr_compliance (parcelle_id, lot_id, compliant, deforestation_detected, last_analysis, satellite_source, ndvi_score, details) VALUES
('a0000000-0001-4000-8000-000000000001', 'ATB-2403-001', true, false, '2024-03-20', 'Sentinel-2 L2A', 0.87,
 'Analyse du 20/03/2024 : aucun changement de couvert forestier détecté sur la parcelle KOF-AGB-001-A. NDVI moyen de 0.87 indiquant une végétation dense et saine. Conforme aux exigences EUDR.'),
('a0000000-0001-4000-8000-000000000002', 'ATB-2403-002', true, false, '2024-03-18', 'Sentinel-2 L2A', 0.82,
 'Parcelle conforme. Aucune alerte déforestation.'),
('a0000000-0001-4000-8000-000000000003', 'ATB-2403-003', true, false, '2024-03-19', 'Sentinel-2 L2A', 0.79,
 'Parcelle conforme. Végétation stable.');

-- 10. PRÉDICTIONS IA
INSERT INTO yield_predictions (parcelle_id, producteur_id, predicted, unit, confidence, model_version, history, last_updated) VALUES
('a0000000-0001-4000-8000-000000000001', 'f0000000-0001-4000-8000-000000000001',
  6.8, 'T', 92, 'lstm-v2.4',
  '[{"year":"2023-2024","value":6.2},{"year":"2022-2023","value":5.8},{"year":"2021-2022","value":6.5},{"year":"2020-2021","value":5.4}]',
  '2024-03-20');

-- 11. PRODUITS MARKETPLACE
INSERT INTO marketplace_products (name, category, description, price, stock, is_available) VALUES
('Semence Cacao hybride', 'semence', 'Semences certifiées de cacao hybride résistant à la pourriture brune', 2500, 500, true),
('Engrais NPK 15-15-15', 'engrais', 'Engrais complet pour cacao et cultures vivrières', 12000, 200, true),
('Pulvérisateur dorsal 16L', 'outillage', 'Pulvérisateur à pression préalable 16 litres', 35000, 50, true),
('Insecticide biologique', 'phyto', 'Insecticide à base de neem, certifié bio', 8500, 150, true),
('Machette professionnelle', 'outillage', 'Machette en acier carbone 22 pouces', 4500, 80, true);

-- ============================================================
-- PRIX HISTORIQUES (12 mois de données par culture)
-- ============================================================
INSERT INTO price_history (id, culture, prix_moyen, prix_min, prix_max, date, source) VALUES
-- Maïs (prix moyens saisonniers)
('a0000001-0001-4000-8000-000000000001', 'Maïs', 285, 250, 310, '2025-05-01', 'market'),
('a0000001-0001-4000-8000-000000000002', 'Maïs', 275, 240, 300, '2025-06-01', 'market'),
('a0000001-0001-4000-8000-000000000003', 'Maïs', 260, 230, 290, '2025-07-01', 'market'),
('a0000001-0001-4000-8000-000000000004', 'Maïs', 250, 220, 280, '2025-08-01', 'market'),
('a0000001-0001-4000-8000-000000000005', 'Maïs', 245, 225, 270, '2025-09-01', 'market'),
('a0000001-0001-4000-8000-000000000006', 'Maïs', 265, 240, 290, '2025-10-01', 'market'),
('a0000001-0001-4000-8000-000000000007', 'Maïs', 280, 255, 310, '2025-11-01', 'market'),
('a0000001-0001-4000-8000-000000000008', 'Maïs', 295, 270, 320, '2025-12-01', 'market'),
('a0000001-0001-4000-8000-000000000009', 'Maïs', 305, 280, 330, '2026-01-01', 'market'),
('a0000001-0001-4000-8000-000000000010', 'Maïs', 310, 285, 335, '2026-02-01', 'market'),
('a0000001-0001-4000-8000-000000000011', 'Maïs', 290, 265, 315, '2026-03-01', 'market'),
('a0000001-0001-4000-8000-000000000012', 'Maïs', 280, 255, 305, '2026-04-01', 'market'),
-- Cacao
('a0000001-0001-4000-8000-000000000020', 'Cacao', 1250, 1100, 1400, '2025-05-01', 'market'),
('a0000001-0001-4000-8000-000000000021', 'Cacao', 1280, 1150, 1420, '2025-06-01', 'market'),
('a0000001-0001-4000-8000-000000000022', 'Cacao', 1320, 1180, 1450, '2025-07-01', 'market'),
('a0000001-0001-4000-8000-000000000023', 'Cacao', 1350, 1200, 1480, '2025-08-01', 'market'),
('a0000001-0001-4000-8000-000000000024', 'Cacao', 1400, 1250, 1520, '2025-09-01', 'market'),
('a0000001-0001-4000-8000-000000000025', 'Cacao', 1380, 1220, 1500, '2025-10-01', 'market'),
('a0000001-0001-4000-8000-000000000026', 'Cacao', 1420, 1280, 1550, '2025-11-01', 'market'),
('a0000001-0001-4000-8000-000000000027', 'Cacao', 1450, 1300, 1580, '2025-12-01', 'market'),
('a0000001-0001-4000-8000-000000000028', 'Cacao', 1480, 1320, 1600, '2026-01-01', 'market'),
('a0000001-0001-4000-8000-000000000029', 'Cacao', 1520, 1380, 1650, '2026-02-01', 'market'),
('a0000001-0001-4000-8000-000000000030', 'Cacao', 1490, 1350, 1620, '2026-03-01', 'market'),
('a0000001-0001-4000-8000-000000000031', 'Cacao', 1450, 1300, 1580, '2026-04-01', 'market'),
-- Anacarde
('a0000001-0001-4000-8000-000000000040', 'Anacarde', 580, 520, 640, '2025-05-01', 'market'),
('a0000001-0001-4000-8000-000000000041', 'Anacarde', 560, 500, 620, '2025-06-01', 'market'),
('a0000001-0001-4000-8000-000000000042', 'Anacarde', 540, 480, 600, '2025-07-01', 'market'),
('a0000001-0001-4000-8000-000000000043', 'Anacarde', 520, 460, 580, '2025-08-01', 'market'),
('a0000001-0001-4000-8000-000000000044', 'Anacarde', 550, 490, 610, '2025-09-01', 'market'),
('a0000001-0001-4000-8000-000000000045', 'Anacarde', 590, 530, 650, '2025-10-01', 'market'),
('a0000001-0001-4000-8000-000000000046', 'Anacarde', 620, 560, 680, '2025-11-01', 'market'),
('a0000001-0001-4000-8000-000000000047', 'Anacarde', 640, 580, 700, '2025-12-01', 'market'),
('a0000001-0001-4000-8000-000000000048', 'Anacarde', 660, 600, 720, '2026-01-01', 'market'),
('a0000001-0001-4000-8000-000000000049', 'Anacarde', 680, 620, 740, '2026-02-01', 'market'),
('a0000001-0001-4000-8000-000000000050', 'Anacarde', 650, 590, 710, '2026-03-01', 'market'),
('a0000001-0001-4000-8000-000000000051', 'Anacarde', 610, 550, 670, '2026-04-01', 'market'),
-- Riz
('a0000001-0001-4000-8000-000000000060', 'Riz', 450, 400, 500, '2025-05-01', 'market'),
('a0000001-0001-4000-8000-000000000061', 'Riz', 440, 390, 490, '2025-06-01', 'market'),
('a0000001-0001-4000-8000-000000000062', 'Riz', 430, 380, 480, '2025-07-01', 'market'),
('a0000001-0001-4000-8000-000000000063', 'Riz', 425, 375, 475, '2025-08-01', 'market'),
('a0000001-0001-4000-8000-000000000064', 'Riz', 445, 395, 495, '2025-09-01', 'market'),
('a0000001-0001-4000-8000-000000000065', 'Riz', 470, 420, 520, '2025-10-01', 'market'),
('a0000001-0001-4000-8000-000000000066', 'Riz', 490, 440, 540, '2025-11-01', 'market'),
('a0000001-0001-4000-8000-000000000067', 'Riz', 510, 460, 560, '2025-12-01', 'market'),
('a0000001-0001-4000-8000-000000000068', 'Riz', 520, 470, 570, '2026-01-01', 'market'),
('a0000001-0001-4000-8000-000000000069', 'Riz', 500, 450, 550, '2026-02-01', 'market'),
('a0000001-0001-4000-8000-000000000070', 'Riz', 480, 430, 530, '2026-03-01', 'market'),
('a0000001-0001-4000-8000-000000000071', 'Riz', 465, 415, 515, '2026-04-01', 'market'),
-- Soja
('a0000001-0001-4000-8000-000000000080', 'Soja', 350, 310, 390, '2025-05-01', 'market'),
('a0000001-0001-4000-8000-000000000081', 'Soja', 340, 300, 380, '2025-06-01', 'market'),
('a0000001-0001-4000-8000-000000000082', 'Soja', 330, 290, 370, '2025-07-01', 'market'),
('a0000001-0001-4000-8000-000000000083', 'Soja', 325, 285, 365, '2025-08-01', 'market'),
('a0000001-0001-4000-8000-000000000084', 'Soja', 345, 305, 385, '2025-09-01', 'market'),
('a0000001-0001-4000-8000-000000000085', 'Soja', 365, 325, 405, '2025-10-01', 'market'),
('a0000001-0001-4000-8000-000000000086', 'Soja', 380, 340, 420, '2025-11-01', 'market'),
('a0000001-0001-4000-8000-000000000087', 'Soja', 395, 355, 435, '2025-12-01', 'market'),
('a0000001-0001-4000-8000-000000000088', 'Soja', 410, 370, 450, '2026-01-01', 'market'),
('a0000001-0001-4000-8000-000000000089', 'Soja', 400, 360, 440, '2026-02-01', 'market'),
('a0000001-0001-4000-8000-000000000090', 'Soja', 385, 345, 425, '2026-03-01', 'market'),
('a0000001-0001-4000-8000-000000000091', 'Soja', 370, 330, 410, '2026-04-01', 'market');

-- ============================================================
-- ALERTES EXEMPLE
-- ============================================================
INSERT INTO user_alerts (id, user_id, type, crop, region, certification, direction, target_price, active, triggered) VALUES
('b0000001-0001-4000-8000-000000000001', 'b0000000-0001-4000-8000-000000000001', 'price_alert', 'Cacao', NULL, NULL, 'above', 1500, true, false),
('b0000001-0001-4000-8000-000000000002', 'b0000000-0001-4000-8000-000000000001', 'price_alert', 'Maïs', NULL, NULL, 'below', 250, true, false),
('b0000001-0001-4000-8000-000000000003', 'b0000000-0001-4000-8000-000000000001', 'new_lot', NULL, 'Zou', 'Bio', NULL, NULL, true, false);

-- ============================================================
-- FAVORIS EXEMPLE
-- ============================================================
INSERT INTO user_favorites (user_id, lot_id) VALUES
('b0000000-0001-4000-8000-000000000001', 'ATB-2403-001'),
('b0000000-0001-4000-8000-000000000001', 'ATB-2403-003');

-- ============================================================
-- VÉRIFICATION FINALE
-- ============================================================
SELECT 'Insertion terminée !' AS message;
SELECT table_name, (xpath('/row/cnt/text()', xml_count))[1]::text::int AS lignes
FROM (
  SELECT table_name, query_to_xml(format('SELECT count(*) as cnt FROM %I.%I', table_schema, table_name), false, true, '') AS xml_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;
