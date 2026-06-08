-- ============================================================
-- ATB AgriTrace - Seed : 20 utilisateurs + données complètes
-- Mot de passe commun : "demo2024" pour tous les comptes
-- ============================================================

-- Nettoyage des données existantes
DELETE FROM audit_log;
DELETE FROM notifications;
DELETE FROM yield_predictions;
DELETE FROM eudr_compliance;
DELETE FROM weighings;
DELETE FROM transactions;
DELETE FROM certificates;
DELETE FROM marketplace_orders;
DELETE FROM lots;
DELETE FROM parcelles;
DELETE FROM farmer_profiles;
DELETE FROM buyer_profiles;
DELETE FROM admin_users;
DELETE FROM cooperatives;
DELETE FROM marketplace_products;

-- ============================================================
-- 1. COOPÉRATIVES (4 existantes + 2 nouvelles = 6)
-- ============================================================
INSERT INTO cooperatives (id, name, region, member_ids, president_name, contact_phone) VALUES
('c0a80121-0001-4000-8000-000000000001', 'Coopérative Agricole du Zou', 'Zou', '{}', 'Kouassi Amadou', '+229 01 23 45 67'),
('c0a80121-0001-4000-8000-000000000002', 'Coopérative du Mono', 'Mono', '{}', 'Moussa Diallo', '+229 97 88 99 00'),
('c0a80121-0001-4000-8000-000000000003', 'Coopérative du Borgou', 'Borgou', '{}', 'Bakari Toundé', '+229 61 23 45 67'),
('c0a80121-0001-4000-8000-000000000004', 'Coopérative de l''Ouémé', 'Ouémé', '{}', 'Gisèle Hounkpatin', '+229 90 12 34 56'),
('c0a80121-0001-4000-8000-000000000005', 'Coopérative de l''Atlantique', 'Atlantique', '{}', 'Cyprien Zannou', '+229 97 54 32 10'),
('c0a80121-0001-4000-8000-000000000006', 'Coopérative du Plateau', 'Plateau', '{}', 'Ruth Adandé', '+229 61 09 87 65');

-- ============================================================
-- 2. ADMINISTRATEURS (5)
-- ============================================================
INSERT INTO admin_users (id, username, email, full_name, password_hash, role, is_active) VALUES
('a0000000-0001-4000-8000-000000000100', 'superadmin', 'superadmin@atb.bj', 'Admin Super ATB', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'superadmin', true),
('a0000000-0001-4000-8000-000000000101', 'manager', 'manager@atb.bj', 'Gestionnaire ATB', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'manager', true),
('a0000000-0001-4000-8000-000000000102', 'admin.qualite', 'qualite@atb.bj', 'Admin Qualité', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'admin', true),
('a0000000-0001-4000-8000-000000000103', 'admin.logistique', 'logistique@atb.bj', 'Admin Logistique', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'admin', true),
('a0000000-0001-4000-8000-000000000104', 'admin.terrain', 'terrain@atb.bj', 'Admin Terrain', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'admin', true);

-- ============================================================
-- 3. PRODUCTEURS (10)
-- ============================================================
INSERT INTO farmer_profiles (id, name, phone, village, cooperative_id, password_hash, role, anonymous_id, is_anonymous, did_hash, did_verified, display_name, experience) VALUES
-- Producteurs existants (6)
('f0000000-0001-4000-8000-000000000001', 'Koffi Agbozo', '+229 01 98 76 54', 'Zogbodomey', 'c0a80121-0001-4000-8000-000000000001', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'KOF-AGB-001', false, '0x7a9f3c8d2e5b1a4f6c0d8e2f4a6b8c0d1e2f3a4b', true, 'Koffi Agbozo', 12),
('f0000000-0001-4000-8000-000000000002', 'Kouassi Amadou', '+229 97 88 99 00', 'Bohicon', 'c0a80121-0001-4000-8000-000000000001', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'KOU-AMA-002', false, '0x3b8d1e4f7a2c5d0e9f1b3c6d8e0f2a4b6c8d0e1f', true, 'Kouassi Amadou', 8),
('f0000000-0001-4000-8000-000000000003', 'Moussa Diallo', '+229 61 23 45 67', 'Kandi', 'c0a80121-0001-4000-8000-000000000002', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'MOU-DIA-003', false, '0x5c2e7d0a1b3f4c8e9d0f2a5b7c9d1e3f5a7b9c0d', true, 'Moussa Diallo', 6),
('f0000000-0001-4000-8000-000000000004', 'Bakari Toundé', '+229 90 12 34 56', 'Parakou', 'c0a80121-0001-4000-8000-000000000003', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'BAK-TOU-004', false, '0x8d1f3a5b7c9e0d2f4a6b8c0d2e4f6a8b0c2d4e6f', true, 'Bakari Toundé', 15),
('f0000000-0001-4000-8000-000000000005', 'Gisèle Hounkpatin', '+229 97 76 54 32', 'Kétou', 'c0a80121-0001-4000-8000-000000000004', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'GIS-HOU-005', false, '0xa2c4e6f8b0d2f4a6c8e0f2a4b6c8d0e2f4a6b8c0', true, 'Gisèle Hounkpatin', 5),
('f0000000-0001-4000-8000-000000000006', 'Sébastien Ahouansou', '+229 01 23 45 67', 'Grand-Popo', 'c0a80121-0001-4000-8000-000000000002', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'SEB-AHO-006', false, '0x1d3f5a7b9c1e3f5a7b9d1f3a5c7e9b1d3f5a7c9e1', true, 'Sébastien Ahouansou', 3),
-- Nouveaux producteurs (4)
('f0000000-0001-4000-8000-000000000007', 'Adélaïde Kpossou', '+229 97 65 43 21', 'Allada', 'c0a80121-0001-4000-8000-000000000005', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'ADE-KPO-007', false, '0x9e2c4d6f8a0b2d4f6a8c0e2f4a6b8c0d2e4f6a8b', true, 'Adélaïde Kpossou', 10),
('f0000000-0001-4000-8000-000000000008', 'David Hounkpè', '+229 01 87 65 43', 'Sakété', 'c0a80121-0001-4000-8000-000000000006', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'DAV-HOU-008', false, '0x7b1d3f5a7c9e1f3a5b7d9f1c3e5a7b9d1f3a5c7e', true, 'David Hounkpè', 7),
('f0000000-0001-4000-8000-000000000009', 'Fatoumata Sidibé', '+229 90 87 65 43', 'Natitingou', 'c0a80121-0001-4000-8000-000000000003', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'FAT-SID-009', false, '0x4c6e8a0b2d4f6a8c0e2f4a6b8c0d2e4f6a8b0c2d', true, 'Fatoumata Sidibé', 9),
('f0000000-0001-4000-8000-000000000010', 'Emmanuel Dossou', '+229 61 54 32 10', 'Lokossa', 'c0a80121-0001-4000-8000-000000000002', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'farmer', 'EMM-DOS-010', false, '0x3a5c7e9b1d3f5a7c9e1f3a5b7d9f1c3e5a7b9d1f', true, 'Emmanuel Dossou', 11);

-- ============================================================
-- 4. ACHETEURS (5)
-- ============================================================
INSERT INTO buyer_profiles (id, company, email, country, password_hash, role, accreditations) VALUES
('b0000000-0001-4000-8000-000000000001', 'Cacao Import Europe', 'contact@cacao-import.eu', 'France', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'buyer', ARRAY['EUDR','Bio','Fair Trade']),
('b0000000-0001-4000-8000-000000000002', 'Benin Agro Export', 'info@beninagro.bj', 'Bénin', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'buyer', ARRAY['GlobalGAP']),
('b0000000-0001-4000-8000-000000000003', 'Chocolaterie Suisse SA', 'achats@chocosuisse.ch', 'Suisse', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'buyer', ARRAY['EUDR','Rainforest Alliance']),
('b0000000-0001-4000-8000-000000000004', 'Olive Oil Traders Inc', 'procurement@oliveoil.com', 'Italie', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'buyer', ARRAY['Bio']),
('b0000000-0001-4000-8000-000000000005', 'Sasakawa Africa Assurances', 'claims@sasakawa-africa.org', 'Belgique', '$2b$12$o1r9CNPmHhyHqNkP5ngYFugDHP/fcSZ1WD5C19/ZKdN7VBEZaeCh6', 'buyer', ARRAY['EUDR']);

-- ============================================================
-- 5. PARCELLES (20 parcelles = 2 par producteur)
-- ============================================================
INSERT INTO parcelles (id, owner_id, polygone, centre, superficie, culture, village, is_verified) VALUES
-- Producteur 1 : Koffi Agbozo (2 parcelles existantes + 1)
('a0000000-0001-4000-8000-000000000001', 'f0000000-0001-4000-8000-000000000001',
  '{"type":"Polygon","coordinates":[[[2.606,7.351],[2.612,7.351],[2.612,7.346],[2.606,7.346],[2.606,7.351]]]}',
  '{"type":"Point","coordinates":[2.609,7.3485]}', 1.8, 'Cacao', 'Zogbodomey', true),
('a0000000-0001-4000-8000-000000000002', 'f0000000-0001-4000-8000-000000000001',
  '{"type":"Polygon","coordinates":[[[2.598,7.342],[2.604,7.342],[2.604,7.337],[2.598,7.337],[2.598,7.342]]]}',
  '{"type":"Point","coordinates":[2.601,7.3395]}', 1.4, 'Coton', 'Zogbodomey', true),
-- Producteur 2 : Kouassi Amadou
('a0000000-0001-4000-8000-000000000004', 'f0000000-0001-4000-8000-000000000002',
  '{"type":"Polygon","coordinates":[[[2.620,7.340],[2.626,7.340],[2.626,7.335],[2.620,7.335],[2.620,7.340]]]}',
  '{"type":"Point","coordinates":[2.623,7.3375]}', 2.1, 'Coton', 'Bohicon', true),
('a0000000-0001-4000-8000-000000000005', 'f0000000-0001-4000-8000-000000000002',
  '{"type":"Polygon","coordinates":[[[2.630,7.348],[2.636,7.348],[2.636,7.343],[2.630,7.343],[2.630,7.348]]]}',
  '{"type":"Point","coordinates":[2.633,7.3455]}', 1.2, 'Maïs', 'Bohicon', true),
-- Producteur 3 : Moussa Diallo
('a0000000-0001-4000-8000-000000000006', 'f0000000-0001-4000-8000-000000000003',
  '{"type":"Polygon","coordinates":[[[3.310,11.130],[3.316,11.130],[3.316,11.125],[3.310,11.125],[3.310,11.130]]]}',
  '{"type":"Point","coordinates":[3.313,11.1275]}', 2.5, 'Coton', 'Kandi', true),
('a0000000-0001-4000-8000-000000000007', 'f0000000-0001-4000-8000-000000000003',
  '{"type":"Polygon","coordinates":[[[3.320,11.138],[3.326,11.138],[3.326,11.133],[3.320,11.133],[3.320,11.138]]]}',
  '{"type":"Point","coordinates":[3.323,11.1355]}', 1.6, 'Anacarde', 'Kandi', true),
-- Producteur 4 : Bakari Toundé
('a0000000-0001-4000-8000-000000000003', 'f0000000-0001-4000-8000-000000000004',
  '{"type":"Polygon","coordinates":[[[2.614,7.356],[2.620,7.356],[2.620,7.351],[2.614,7.351],[2.614,7.356]]]}',
  '{"type":"Point","coordinates":[2.617,7.3535]}', 1.0, 'Anacarde', 'Parakou', true),
('a0000000-0001-4000-8000-000000000008', 'f0000000-0001-4000-8000-000000000004',
  '{"type":"Polygon","coordinates":[[[2.636,7.364],[2.642,7.364],[2.642,7.359],[2.636,7.359],[2.636,7.364]]]}',
  '{"type":"Point","coordinates":[2.639,7.3615]}', 1.9, 'Soja', 'Parakou', true),
-- Producteur 5 : Gisèle Hounkpatin
('a0000000-0001-4000-8000-000000000009', 'f0000000-0001-4000-8000-000000000005',
  '{"type":"Polygon","coordinates":[[[2.650,7.370],[2.656,7.370],[2.656,7.365],[2.650,7.365],[2.650,7.370]]]}',
  '{"type":"Point","coordinates":[2.653,7.3675]}', 1.3, 'Café', 'Kétou', true),
('a0000000-0001-4000-8000-000000000010', 'f0000000-0001-4000-8000-000000000005',
  '{"type":"Polygon","coordinates":[[[2.644,7.378],[2.650,7.378],[2.650,7.373],[2.644,7.373],[2.644,7.378]]]}',
  '{"type":"Point","coordinates":[2.647,7.3755]}', 0.9, 'Cacao', 'Kétou', true),
-- Producteur 6 : Sébastien Ahouansou
('a0000000-0001-4000-8000-000000000011', 'f0000000-0001-4000-8000-000000000006',
  '{"type":"Polygon","coordinates":[[[1.840,6.280],[1.846,6.280],[1.846,6.275],[1.840,6.275],[1.840,6.280]]]}',
  '{"type":"Point","coordinates":[1.843,6.2775]}', 2.0, 'Cacao', 'Grand-Popo', true),
('a0000000-0001-4000-8000-000000000012', 'f0000000-0001-4000-8000-000000000006',
  '{"type":"Polygon","coordinates":[[[1.848,6.286],[1.854,6.286],[1.854,6.281],[1.848,6.281],[1.848,6.286]]]}',
  '{"type":"Point","coordinates":[1.851,6.2835]}', 1.1, 'Manioc', 'Grand-Popo', true),
-- Producteur 7 : Adélaïde Kpossou
('a0000000-0001-4000-8000-000000000013', 'f0000000-0001-4000-8000-000000000007',
  '{"type":"Polygon","coordinates":[[[2.150,6.650],[2.156,6.650],[2.156,6.645],[2.150,6.645],[2.150,6.650]]]}',
  '{"type":"Point","coordinates":[2.153,6.6475]}', 2.3, 'Cacao', 'Allada', true),
('a0000000-0001-4000-8000-000000000014', 'f0000000-0001-4000-8000-000000000007',
  '{"type":"Polygon","coordinates":[[[2.158,6.658],[2.164,6.658],[2.164,6.653],[2.158,6.653],[2.158,6.658]]]}',
  '{"type":"Point","coordinates":[2.161,6.6555]}', 1.5, 'Palmier à huile', 'Allada', false),
-- Producteur 8 : David Hounkpè
('a0000000-0001-4000-8000-000000000015', 'f0000000-0001-4000-8000-000000000008',
  '{"type":"Polygon","coordinates":[[[2.660,6.730],[2.666,6.730],[2.666,6.725],[2.660,6.725],[2.660,6.730]]]}',
  '{"type":"Point","coordinates":[2.663,6.7275]}', 1.7, 'Coton', 'Sakété', true),
('a0000000-0001-4000-8000-000000000016', 'f0000000-0001-4000-8000-000000000008',
  '{"type":"Polygon","coordinates":[[[2.668,6.738],[2.674,6.738],[2.674,6.733],[2.668,6.733],[2.668,6.738]]]}',
  '{"type":"Point","coordinates":[2.671,6.7355]}', 1.3, 'Ananas', 'Sakété', false),
-- Producteur 9 : Fatoumata Sidibé
('a0000000-0001-4000-8000-000000000017', 'f0000000-0001-4000-8000-000000000009',
  '{"type":"Polygon","coordinates":[[[1.360,10.300],[1.366,10.300],[1.366,10.295],[1.360,10.295],[1.360,10.300]]]}',
  '{"type":"Point","coordinates":[1.363,10.2975]}', 3.0, 'Coton', 'Natitingou', true),
('a0000000-0001-4000-8000-000000000018', 'f0000000-0001-4000-8000-000000000009',
  '{"type":"Polygon","coordinates":[[[1.368,10.308],[1.374,10.308],[1.374,10.303],[1.368,10.303],[1.368,10.308]]]}',
  '{"type":"Point","coordinates":[1.371,10.3055]}', 2.2, 'Anacarde', 'Natitingou', false),
-- Producteur 10 : Emmanuel Dossou
('a0000000-0001-4000-8000-000000000019', 'f0000000-0001-4000-8000-000000000010',
  '{"type":"Polygon","coordinates":[[[1.780,6.630],[1.786,6.630],[1.786,6.625],[1.780,6.625],[1.780,6.630]]]}',
  '{"type":"Point","coordinates":[1.783,6.6275]}', 1.6, 'Coton', 'Lokossa', true),
('a0000000-0001-4000-8000-000000000020', 'f0000000-0001-4000-8000-000000000010',
  '{"type":"Polygon","coordinates":[[[1.788,6.638],[1.794,6.638],[1.794,6.633],[1.788,6.633],[1.788,6.638]]]}',
  '{"type":"Point","coordinates":[1.791,6.6355]}', 1.0, 'Riz', 'Lokossa', true);

-- ============================================================
-- 6. LOTS (20 lots = 2 par producteur)
-- ============================================================
INSERT INTO lots (id, culture, origine, region, quantite, certification, statut, prix, producteur_id, cooperative, note, date, parcelle_id) VALUES
-- Producteur 1
('ATB-2403-001', 'Cacao', 'Zogbodomey', 'Zou', '5000 kg', 'EUDR', 'Disponible', 2500, 'f0000000-0001-4000-8000-000000000001', 'Coopérative Agricole du Zou', 92, '2024-03-15', 'a0000000-0001-4000-8000-000000000001'),
('ATB-2403-002', 'Coton', 'Zogbodomey', 'Zou', '3200 kg', 'GlobalGAP', 'En transit', 1800, 'f0000000-0001-4000-8000-000000000001', 'Coopérative Agricole du Zou', 88, '2024-03-14', 'a0000000-0001-4000-8000-000000000002'),
-- Producteur 2
('ATB-2403-009', 'Coton', 'Bohicon', 'Zou', '4200 kg', 'GlobalGAP', 'Disponible', 1750, 'f0000000-0001-4000-8000-000000000002', 'Coopérative Agricole du Zou', 85, '2024-03-20', 'a0000000-0001-4000-8000-000000000004'),
('ATB-2403-010', 'Maïs', 'Bohicon', 'Zou', '8000 kg', 'Bio', 'Disponible', 700, 'f0000000-0001-4000-8000-000000000002', 'Coopérative Agricole du Zou', 78, '2024-03-19', 'a0000000-0001-4000-8000-000000000005'),
-- Producteur 3
('ATB-2403-011', 'Coton', 'Kandi', 'Borgou', '5500 kg', 'GlobalGAP', 'Disponible', 1700, 'f0000000-0001-4000-8000-000000000003', 'Coopérative du Borgou', 82, '2024-03-22', 'a0000000-0001-4000-8000-000000000006'),
('ATB-2403-012', 'Anacarde', 'Kandi', 'Borgou', '1800 kg', 'EUDR', 'Disponible', 3100, 'f0000000-0001-4000-8000-000000000003', 'Coopérative du Borgou', 90, '2024-03-21', 'a0000000-0001-4000-8000-000000000007'),
-- Producteur 4
('ATB-2403-003', 'Anacarde', 'Parakou', 'Borgou', '2000 kg', 'EUDR', 'Disponible', 3200, 'f0000000-0001-4000-8000-000000000004', 'Coopérative du Borgou', 95, '2024-03-13', 'a0000000-0001-4000-8000-000000000003'),
('ATB-2403-013', 'Soja', 'Parakou', 'Borgou', '3000 kg', 'Bio', 'Disponible', 1200, 'f0000000-0001-4000-8000-000000000004', 'Coopérative du Borgou', 80, '2024-03-23', 'a0000000-0001-4000-8000-000000000008'),
-- Producteur 5
('ATB-2403-004', 'Café', 'Kétou', 'Ouémé', '800 kg', 'Bio', 'Disponible', 4500, 'f0000000-0001-4000-8000-000000000005', 'Coopérative de l''Ouémé', 90, '2024-03-12', 'a0000000-0001-4000-8000-000000000009'),
('ATB-2403-014', 'Cacao', 'Kétou', 'Ouémé', '1200 kg', 'Fair Trade', 'Disponible', 2700, 'f0000000-0001-4000-8000-000000000005', 'Coopérative de l''Ouémé', 87, '2024-03-24', 'a0000000-0001-4000-8000-000000000010'),
-- Producteur 6
('ATB-2403-006', 'Cacao', 'Grand-Popo', 'Mono', '1500 kg', 'Fair Trade', 'Disponible', 2800, 'f0000000-0001-4000-8000-000000000006', 'Coopérative du Mono', 85, '2024-03-10', 'a0000000-0001-4000-8000-000000000011'),
('ATB-2403-015', 'Manioc', 'Grand-Popo', 'Mono', '6000 kg', 'Bio', 'Disponible', 400, 'f0000000-0001-4000-8000-000000000006', 'Coopérative du Mono', 75, '2024-03-25', 'a0000000-0001-4000-8000-000000000012'),
-- Producteur 7
('ATB-2403-016', 'Cacao', 'Allada', 'Atlantique', '3500 kg', 'EUDR', 'Disponible', 2600, 'f0000000-0001-4000-8000-000000000007', 'Coopérative de l''Atlantique', 91, '2024-03-26', 'a0000000-0001-4000-8000-000000000013'),
('ATB-2403-017', 'Palmier à huile', 'Allada', 'Atlantique', '2000 L', 'Bio', 'Disponible', 1500, 'f0000000-0001-4000-8000-000000000007', 'Coopérative de l''Atlantique', 76, '2024-03-27', 'a0000000-0001-4000-8000-000000000014'),
-- Producteur 8
('ATB-2403-018', 'Coton', 'Sakété', 'Plateau', '3800 kg', 'GlobalGAP', 'En transit', 1720, 'f0000000-0001-4000-8000-000000000008', 'Coopérative du Plateau', 83, '2024-03-28', 'a0000000-0001-4000-8000-000000000015'),
('ATB-2403-019', 'Ananas', 'Sakété', 'Plateau', '2500 pièces', 'Bio', 'Disponible', 900, 'f0000000-0001-4000-8000-000000000008', 'Coopérative du Plateau', 88, '2024-03-29', 'a0000000-0001-4000-8000-000000000016'),
-- Producteur 9
('ATB-2403-020', 'Coton', 'Natitingou', 'Borgou', '6200 kg', 'GlobalGAP', 'Disponible', 1680, 'f0000000-0001-4000-8000-000000000009', 'Coopérative du Borgou', 86, '2024-03-30', 'a0000000-0001-4000-8000-000000000017'),
('ATB-2403-021', 'Anacarde', 'Natitingou', 'Borgou', '2200 kg', 'EUDR', 'Disponible', 3050, 'f0000000-0001-4000-8000-000000000009', 'Coopérative du Borgou', 93, '2024-03-31', 'a0000000-0001-4000-8000-000000000018'),
-- Producteur 10
('ATB-2403-022', 'Coton', 'Lokossa', 'Mono', '4100 kg', 'GlobalGAP', 'Disponible', 1710, 'f0000000-0001-4000-8000-000000000010', 'Coopérative du Mono', 81, '2024-04-01', 'a0000000-0001-4000-8000-000000000019'),
('ATB-2403-023', 'Riz', 'Lokossa', 'Mono', '3500 kg', 'Bio', 'Disponible', 650, 'f0000000-0001-4000-8000-000000000010', 'Coopérative du Mono', 79, '2024-04-02', 'a0000000-0001-4000-8000-000000000020');

-- ============================================================
-- 7. CERTIFICATS (20 certificats)
-- ============================================================
INSERT INTO certificates (id, type, lot_id, culture, statut, emis, expire, emetteur, format, blockchain) VALUES
('EUDR-2024-0241', 'EUDR Due Diligence', 'ATB-2403-001', 'Cacao', 'Valide', '2024-03-15', '2024-12-31', 'SGS Bénin', 'PDF+XML', true),
('GG-2024-0892', 'GlobalGAP', 'ATB-2403-002', 'Coton', 'Valide', '2024-03-14', '2025-03-14', 'Control Union', 'PDF', true),
('LAB-2024-331', 'Analyse Labo', 'ATB-2403-001', 'Cacao', 'Valide', '2024-03-18', '2024-06-18', 'Labo National', 'PDF', false),
('GG-2024-0893', 'GlobalGAP', 'ATB-2403-009', 'Coton', 'Valide', '2024-03-20', '2025-03-20', 'SGS Bénin', 'PDF+XML', true),
('BIO-2024-001', 'Certification Bio', 'ATB-2403-010', 'Maïs', 'Valide', '2024-03-19', '2025-03-19', 'Ecocert', 'PDF', false),
('EUDR-2024-0242', 'EUDR Due Diligence', 'ATB-2403-012', 'Anacarde', 'Valide', '2024-03-21', '2024-12-31', 'Bureau Veritas', 'PDF', true),
('GG-2024-0894', 'GlobalGAP', 'ATB-2403-011', 'Coton', 'Expiré', '2023-03-22', '2024-03-22', 'Control Union', 'PDF', false),
('EUDR-2024-0243', 'EUDR Due Diligence', 'ATB-2403-003', 'Anacarde', 'Valide', '2024-03-13', '2024-12-31', 'SGS Bénin', 'PDF+XML', true),
('BIO-2024-002', 'Certification Bio', 'ATB-2403-013', 'Soja', 'En attente', '2024-03-23', '2025-03-23', 'Ecocert', 'Numérique', false),
('BIO-2024-003', 'Certification Bio', 'ATB-2403-004', 'Café', 'Valide', '2024-03-12', '2025-03-12', 'Ecocert', 'PDF', true),
('FT-2024-001', 'Fair Trade', 'ATB-2403-014', 'Cacao', 'Valide', '2024-03-24', '2025-03-24', 'FLOCERT', 'PDF+XML', true),
('FT-2024-002', 'Fair Trade', 'ATB-2403-006', 'Cacao', 'Valide', '2024-03-10', '2025-03-10', 'FLOCERT', 'PDF', false),
('BIO-2024-004', 'Certification Bio', 'ATB-2403-015', 'Manioc', 'Valide', '2024-03-25', '2025-03-25', 'Ecocert', 'Numérique', true),
('EUDR-2024-0244', 'EUDR Due Diligence', 'ATB-2403-016', 'Cacao', 'Valide', '2024-03-26', '2024-12-31', 'Bureau Veritas', 'PDF', true),
('BIO-2024-005', 'Certification Bio', 'ATB-2403-017', 'Palmier', 'En attente', '2024-03-27', '2025-03-27', 'Ecocert', 'Numérique', false),
('GG-2024-0895', 'GlobalGAP', 'ATB-2403-018', 'Coton', 'Valide', '2024-03-28', '2025-03-28', 'SGS Bénin', 'PDF', true),
('BIO-2024-006', 'Certification Bio', 'ATB-2403-019', 'Ananas', 'Valide', '2024-03-29', '2025-03-29', 'Ecocert', 'PDF', false),
('GG-2024-0896', 'GlobalGAP', 'ATB-2403-020', 'Coton', 'Valide', '2024-03-30', '2025-03-30', 'Control Union', 'PDF+XML', true),
('EUDR-2024-0245', 'EUDR Due Diligence', 'ATB-2403-021', 'Anacarde', 'Valide', '2024-03-31', '2024-12-31', 'SGS Bénin', 'PDF', false),
('GG-2024-0897', 'GlobalGAP', 'ATB-2403-022', 'Coton', 'Expiré', '2023-04-01', '2024-04-01', 'Bureau Veritas', 'PDF', false);

-- ============================================================
-- 8. PESÉES IoT (20 pesées)
-- ============================================================
INSERT INTO weighings (lot_id, producteur_id, weight_kg, culture, date, device_id, battery_level) VALUES
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 1245, 'Cacao', '2024-03-15T08:30:00Z', 'ATB-BAL-017', 85),
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 980, 'Cacao', '2024-03-15T10:15:00Z', 'ATB-BAL-017', 82),
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 1500, 'Cacao', '2024-03-16T09:00:00Z', 'ATB-BAL-009', 91),
('ATB-2403-002', 'f0000000-0001-4000-8000-000000000001', 1150, 'Coton', '2024-03-14T08:00:00Z', 'ATB-BAL-009', 76),
('ATB-2403-009', 'f0000000-0001-4000-8000-000000000002', 2100, 'Coton', '2024-03-20T09:30:00Z', 'ATB-BAL-012', 88),
('ATB-2403-009', 'f0000000-0001-4000-8000-000000000002', 1100, 'Coton', '2024-03-21T10:00:00Z', 'ATB-BAL-012', 85),
('ATB-2403-011', 'f0000000-0001-4000-8000-000000000003', 2800, 'Coton', '2024-03-22T07:45:00Z', 'ATB-BAL-015', 73),
('ATB-2403-012', 'f0000000-0001-4000-8000-000000000003', 900, 'Anacarde', '2024-03-21T11:30:00Z', 'ATB-BAL-015', 71),
('ATB-2403-003', 'f0000000-0001-4000-8000-000000000004', 1000, 'Anacarde', '2024-03-13T14:20:00Z', 'ATB-BAL-009', 78),
('ATB-2403-013', 'f0000000-0001-4000-8000-000000000004', 1500, 'Soja', '2024-03-23T08:15:00Z', 'ATB-BAL-018', 92),
('ATB-2403-004', 'f0000000-0001-4000-8000-000000000005', 400, 'Café', '2024-03-12T09:00:00Z', 'ATB-BAL-022', 81),
('ATB-2403-014', 'f0000000-0001-4000-8000-000000000005', 600, 'Cacao', '2024-03-24T10:30:00Z', 'ATB-BAL-022', 79),
('ATB-2403-006', 'f0000000-0001-4000-8000-000000000006', 750, 'Cacao', '2024-03-10T11:45:00Z', 'ATB-BAL-017', 73),
('ATB-2403-015', 'f0000000-0001-4000-8000-000000000006', 3100, 'Manioc', '2024-03-25T08:30:00Z', 'ATB-BAL-025', 88),
('ATB-2403-016', 'f0000000-0001-4000-8000-000000000007', 1800, 'Cacao', '2024-03-26T09:15:00Z', 'ATB-BAL-019', 84),
('ATB-2403-018', 'f0000000-0001-4000-8000-000000000008', 1920, 'Coton', '2024-03-28T07:30:00Z', 'ATB-BAL-020', 77),
('ATB-2403-020', 'f0000000-0001-4000-8000-000000000009', 3100, 'Coton', '2024-03-30T08:45:00Z', 'ATB-BAL-021', 90),
('ATB-2403-021', 'f0000000-0001-4000-8000-000000000009', 1100, 'Anacarde', '2024-03-31T10:00:00Z', 'ATB-BAL-021', 86),
('ATB-2403-022', 'f0000000-0001-4000-8000-000000000010', 2050, 'Coton', '2024-04-01T09:30:00Z', 'ATB-BAL-023', 83),
('ATB-2403-023', 'f0000000-0001-4000-8000-000000000010', 1750, 'Riz', '2024-04-02T08:15:00Z', 'ATB-BAL-023', 80);

-- ============================================================
-- 9. TRANSACTIONS (20 transactions)
-- ============================================================
INSERT INTO transactions (lot_id, producteur_id, type, montant, statut, on_chain) VALUES
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 'Vente', '12500000', 'Confirmée', true),
('ATB-2403-001', 'f0000000-0001-4000-8000-000000000001', 'Livraison', '—', 'En transit', true),
('ATB-2403-002', 'f0000000-0001-4000-8000-000000000001', 'Vente', '5760000', 'Confirmée', true),
('ATB-2403-009', 'f0000000-0001-4000-8000-000000000002', 'Vente', '7350000', 'En attente', false),
('ATB-2403-010', 'f0000000-0001-4000-8000-000000000002', 'Avance', '1500000', 'Confirmée', true),
('ATB-2403-011', 'f0000000-0001-4000-8000-000000000003', 'Vente', '9350000', 'Confirmée', true),
('ATB-2403-012', 'f0000000-0001-4000-8000-000000000003', 'Livraison', '—', 'En transit', false),
('ATB-2403-003', 'f0000000-0001-4000-8000-000000000004', 'Vente', '6400000', 'Confirmée', true),
('ATB-2403-013', 'f0000000-0001-4000-8000-000000000004', 'Vente', '3600000', 'En attente', false),
('ATB-2403-004', 'f0000000-0001-4000-8000-000000000005', 'Vente', '3600000', 'Confirmée', true),
('ATB-2403-014', 'f0000000-0001-4000-8000-000000000005', 'Vente', '3240000', 'Confirmée', true),
('ATB-2403-006', 'f0000000-0001-4000-8000-000000000006', 'Vente', '4200000', 'En attente', false),
('ATB-2403-015', 'f0000000-0001-4000-8000-000000000006', 'Vente', '2400000', 'Confirmée', true),
('ATB-2403-016', 'f0000000-0001-4000-8000-000000000007', 'Vente', '9100000', 'En attente', false),
('ATB-2403-017', 'f0000000-0001-4000-8000-000000000007', 'Avance', '800000', 'Confirmée', true),
('ATB-2403-018', 'f0000000-0001-4000-8000-000000000008', 'Vente', '6536000', 'Confirmée', true),
('ATB-2403-020', 'f0000000-0001-4000-8000-000000000009', 'Vente', '10416000', 'Confirmée', true),
('ATB-2403-021', 'f0000000-0001-4000-8000-000000000009', 'Vente', '6710000', 'En attente', false),
('ATB-2403-022', 'f0000000-0001-4000-8000-000000000010', 'Vente', '7011000', 'Confirmée', true),
('ATB-2403-023', 'f0000000-0001-4000-8000-000000000010', 'Vente', '2275000', 'En attente', false);

-- ============================================================
-- 10. CONFORMITÉ EUDR (20 enregistrements)
-- ============================================================
INSERT INTO eudr_compliance (parcelle_id, lot_id, compliant, deforestation_detected, last_analysis, satellite_source, ndvi_score, details, alert_generated) VALUES
('a0000000-0001-4000-8000-000000000001', 'ATB-2403-001', true, false, '2024-03-20', 'Sentinel-2 L2A', 0.87, 'Aucun changement de couvert forestier détecté. NDVI 0.87 : végétation dense.', false),
('a0000000-0001-4000-8000-000000000002', 'ATB-2403-002', true, false, '2024-03-18', 'Sentinel-2 L2A', 0.82, 'Parcelle conforme. Aucune alerte déforestation.', false),
('a0000000-0001-4000-8000-000000000004', 'ATB-2403-009', true, false, '2024-03-22', 'Sentinel-2 L2A', 0.79, 'Végétation stable, culture de coton en phase de croissance.', false),
('a0000000-0001-4000-8000-000000000005', 'ATB-2403-010', true, false, '2024-03-21', 'Sentinel-2 L2A', 0.74, 'Parcelle de maïs conforme.', false),
('a0000000-0001-4000-8000-000000000006', 'ATB-2403-011', false, true, '2024-03-24', 'Sentinel-2 L2A', 0.45, 'ALERTE : Réduction de 30% du couvert végétal détectée entre janv et mars 2024.', true),
('a0000000-0001-4000-8000-000000000007', 'ATB-2403-012', true, false, '2024-03-23', 'Sentinel-2 L2A', 0.85, 'Parcelle d anacarde en bonne santé.', false),
('a0000000-0001-4000-8000-000000000003', 'ATB-2403-003', true, false, '2024-03-19', 'Sentinel-2 L2A', 0.79, 'Parcelle conforme. Végétation stable.', false),
('a0000000-0001-4000-8000-000000000008', 'ATB-2403-013', true, false, '2024-03-25', 'Sentinel-2 L2A', 0.71, 'Culture de soja conforme.', false),
('a0000000-0001-4000-8000-000000000009', 'ATB-2403-004', true, false, '2024-03-14', 'Sentinel-2 L2A', 0.83, 'Café sous ombrage, couvert forestier préservé.', false),
('a0000000-0001-4000-8000-000000000010', 'ATB-2403-014', false, true, '2024-03-26', 'Sentinel-2 L2A', 0.52, 'ALERTE : Déforestation suspectée en bordure de parcelle. Perte de 0.15 ha.', true),
('a0000000-0001-4000-8000-000000000011', 'ATB-2403-006', true, false, '2024-03-12', 'Sentinel-2 L2A', 0.88, 'Cacao sous ombrage, excellent état sanitaire.', false),
('a0000000-0001-4000-8000-000000000012', 'ATB-2403-015', true, false, '2024-03-27', 'Sentinel-2 L2A', 0.69, 'Manioc en phase de croissance.', false),
('a0000000-0001-4000-8000-000000000013', 'ATB-2403-016', true, false, '2024-03-28', 'Sentinel-2 L2A', 0.86, 'Nouvelle parcelle de cacao certifiée EUDR.', false),
('a0000000-0001-4000-8000-000000000014', 'ATB-2403-017', true, false, '2024-03-29', 'Sentinel-2 L2A', 0.77, 'Palmier à huile conforme.', false),
('a0000000-0001-4000-8000-000000000015', 'ATB-2403-018', true, false, '2024-03-30', 'Sentinel-2 L2A', 0.76, 'Coton en phase de développement.', false),
('a0000000-0001-4000-8000-000000000016', 'ATB-2403-019', true, false, '2024-03-31', 'Sentinel-2 L2A', 0.73, 'Ananas en culture.', false),
('a0000000-0001-4000-8000-000000000017', 'ATB-2403-020', true, false, '2024-04-01', 'Sentinel-2 L2A', 0.78, 'Coton en pleine croissance.', false),
('a0000000-0001-4000-8000-000000000018', 'ATB-2403-021', true, false, '2024-04-02', 'Sentinel-2 L2A', 0.84, 'Anacarde en bonne santé.', false),
('a0000000-0001-4000-8000-000000000019', 'ATB-2403-022', true, false, '2024-04-03', 'Sentinel-2 L2A', 0.75, 'Coton conforme.', false),
('a0000000-0001-4000-8000-000000000020', 'ATB-2403-023', false, true, '2024-04-04', 'Sentinel-2 L2A', 0.48, 'ALERTE : Conversion de forêt en rizière détectée. Non conforme EUDR.', true);

-- ============================================================
-- 11. PRÉDICTIONS IA (10 prédictions)
-- ============================================================
INSERT INTO yield_predictions (parcelle_id, producteur_id, predicted, unit, confidence, model_version, history, last_updated) VALUES
('a0000000-0001-4000-8000-000000000001', 'f0000000-0001-4000-8000-000000000001', 6.8, 'T', 92, 'lstm-v2.4', '[{"year":"2023-2024","value":6.2},{"year":"2022-2023","value":5.8},{"year":"2021-2022","value":6.5},{"year":"2020-2021","value":5.4}]', '2024-03-20'),
('a0000000-0001-4000-8000-000000000004', 'f0000000-0001-4000-8000-000000000002', 4.2, 'T', 85, 'lstm-v2.4', '[{"year":"2023-2024","value":3.9},{"year":"2022-2023","value":4.1}]', '2024-03-22'),
('a0000000-0001-4000-8000-000000000006', 'f0000000-0001-4000-8000-000000000003', 5.1, 'T', 78, 'lstm-v2.4', '[{"year":"2023-2024","value":4.8},{"year":"2022-2023","value":5.0}]', '2024-03-24'),
('a0000000-0001-4000-8000-000000000003', 'f0000000-0001-4000-8000-000000000004', 3.5, 'T', 90, 'lstm-v2.4', '[{"year":"2023-2024","value":3.2},{"year":"2022-2023","value":3.0},{"year":"2021-2022","value":3.4}]', '2024-03-19'),
('a0000000-0001-4000-8000-000000000009', 'f0000000-0001-4000-8000-000000000005', 2.1, 'T', 88, 'lstm-v2.4', '[{"year":"2023-2024","value":1.9}]', '2024-03-14'),
('a0000000-0001-4000-8000-000000000011', 'f0000000-0001-4000-8000-000000000006', 5.5, 'T', 82, 'lstm-v2.4', '[{"year":"2023-2024","value":5.0},{"year":"2022-2023","value":5.2}]', '2024-03-12'),
('a0000000-0001-4000-8000-000000000013', 'f0000000-0001-4000-8000-000000000007', 7.2, 'T', 94, 'lstm-v2.4', '[{"year":"2023-2024","value":6.8}]', '2024-03-28'),
('a0000000-0001-4000-8000-000000000015', 'f0000000-0001-4000-8000-000000000008', 4.8, 'T', 80, 'lstm-v2.4', '[{"year":"2023-2024","value":4.5}]', '2024-03-30'),
('a0000000-0001-4000-8000-000000000017', 'f0000000-0001-4000-8000-000000000009', 6.1, 'T', 86, 'lstm-v2.4', '[{"year":"2023-2024","value":5.7},{"year":"2022-2023","value":5.9}]', '2024-04-01'),
('a0000000-0001-4000-8000-000000000019', 'f0000000-0001-4000-8000-000000000010', 4.5, 'T', 83, 'lstm-v2.4', '[{"year":"2023-2024","value":4.2}]', '2024-04-03');

-- ============================================================
-- 12. NOTIFICATIONS (20 notifications)
-- ============================================================
INSERT INTO notifications (user_id, user_type, title, description, is_read, created_at) VALUES
('f0000000-0001-4000-8000-000000000001', 'farmer', 'Lot certifié', 'Votre lot ATB-2403-001 a été certifié EUDR.', false, '2024-03-15T10:00:00Z'),
('f0000000-0001-4000-8000-000000000001', 'farmer', 'Paiement reçu', 'Paiement de 12 500 000 FCFA confirmé pour le lot ATB-2403-001.', false, '2024-03-20T14:30:00Z'),
('f0000000-0001-4000-8000-000000000002', 'farmer', 'Nouveau certificat', 'Certification GlobalGAP obtenue pour le lot ATB-2403-009.', true, '2024-03-20T11:00:00Z'),
('f0000000-0001-4000-8000-000000000003', 'farmer', 'Alerte environnementale', 'Variation de couvert détectée sur la parcelle Kandi-1. Vérification requise.', false, '2024-03-24T08:00:00Z'),
('f0000000-0001-4000-8000-000000000003', 'farmer', 'Vente confirmée', 'Votre lot ATB-2403-011 a été vendu pour 9 350 000 FCFA.', true, '2024-03-25T09:00:00Z'),
('f0000000-0001-4000-8000-000000000004', 'farmer', 'Prédiction disponible', 'La prévision de rendement pour votre parcelle est disponible : 3.5 T.', true, '2024-03-19T16:00:00Z'),
('f0000000-0001-4000-8000-000000000005', 'farmer', 'Paiement reçu', 'Paiement de 3 600 000 FCFA pour le café certifié Bio.', false, '2024-03-15T13:00:00Z'),
('f0000000-0001-4000-8000-000000000005', 'farmer', 'Alerte conformité', 'Parcelle Kétou-2 : risque de déforestation détecté. Action requise.', false, '2024-03-26T07:30:00Z'),
('f0000000-0001-4000-8000-000000000006', 'farmer', 'Certificat Fair Trade', 'Votre cacao est désormais certifié Fair Trade.', true, '2024-03-10T15:00:00Z'),
('f0000000-0001-4000-8000-000000000007', 'farmer', 'Bienvenue', 'Bienvenue sur ATB AgriTrace ! Votre compte producteur est actif.', true, '2024-03-26T09:00:00Z'),
('f0000000-0001-4000-8000-000000000007', 'farmer', 'EUDR conforme', 'Votre parcelle de cacao est conforme EUDR.', false, '2024-03-28T12:00:00Z'),
('f0000000-0001-4000-8000-000000000008', 'farmer', 'Lot en transit', 'Votre lot ATB-2403-018 est en transit.', false, '2024-03-28T10:00:00Z'),
('f0000000-0001-4000-8000-000000000009', 'farmer', 'Vente confirmée', 'Vente de 10 416 000 FCFA pour le lot ATB-2403-020.', false, '2024-04-01T14:00:00Z'),
('f0000000-0001-4000-8000-000000000010', 'farmer', 'Alerte rizière', 'Conversion forestière détectée. Non conforme EUDR.', false, '2024-04-04T08:00:00Z'),
('b0000000-0001-4000-8000-000000000001', 'buyer', 'Nouveau lot disponible', 'Un lot de cacao EUDR est disponible : ATB-2403-016 (3 500 kg).', false, '2024-03-26T10:00:00Z'),
('b0000000-0001-4000-8000-000000000003', 'buyer', 'Cacao Fair Trade', ' Lot ATB-2403-006 certifié Fair Trade disponible (1 500 kg).', true, '2024-03-10T16:00:00Z'),
('b0000000-0001-4000-8000-000000000004', 'buyer', 'Huile de palme bio', 'Nouveau lot d''huile de palme bio certifié disponible.', false, '2024-03-27T11:00:00Z'),
('a0000000-0001-4000-8000-000000000100', 'admin', 'Rapport hebdomadaire', '20 nouveaux lots enregistrés cette semaine. Taux de conformité : 85%.', true, '2024-04-04T06:00:00Z'),
('a0000000-0001-4000-8000-000000000102', 'admin', 'Alerte déforestation', '3 alertes de déforestation en attente de traitement.', false, '2024-04-04T07:00:00Z'),
('a0000000-0001-4000-8000-000000000103', 'admin', 'Livraison en retard', 'Le lot ATB-2403-018 n''a pas atteint sa destination.', false, '2024-04-03T18:00:00Z');

-- ============================================================
-- 13. JOURNAUX D'AUDIT (20 entrées)
-- ============================================================
INSERT INTO audit_log (user_id, action, entity_type, entity_id, details, ip_address, created_at) VALUES
('a0000000-0001-4000-8000-000000000100', 'Connexion', 'Session', NULL, '{"method": "local", "browser": "Chrome 124"}', '192.168.1.100', '2024-04-04T06:30:00Z'),
('a0000000-0001-4000-8000-000000000100', 'Validation certificat', 'Certificate', 'EUDR-2024-0244', '{"action": "validated", "certificate_type": "EUDR"}', '192.168.1.100', '2024-03-26T11:00:00Z'),
('a0000000-0001-4000-8000-000000000101', 'Modification utilisateur', 'AdminUser', 'a0000000-0001-4000-8000-000000000104', '{"field": "role", "old": "admin", "new": "admin"}', '192.168.1.101', '2024-04-01T09:00:00Z'),
('a0000000-0001-4000-8000-000000000102', 'Analyse satellite', 'Parcelle', 'a0000000-0001-4000-8000-000000000006', '{"ndvi": 0.45, "alert": true, "source": "Sentinel-2"}', '192.168.1.102', '2024-03-24T08:15:00Z'),
('a0000000-0001-4000-8000-000000000102', 'Rapport conformité', 'Compliance', NULL, '{"period": "2024-Q1", "total_lots": 20, "conformes": 17}', '192.168.1.102', '2024-04-02T10:00:00Z'),
('a0000000-0001-4000-8000-000000000103', 'Validation livraison', 'Order', 'ATB-2403-018', '{"status": "confirmed", "destination": "Cotonou"}', '192.168.1.103', '2024-03-30T14:00:00Z'),
('a0000000-0001-4000-8000-000000000100', 'Création utilisateur', 'FarmerProfile', 'f0000000-0001-4000-8000-000000000010', '{"name": "Emmanuel Dossou", "village": "Lokossa"}', '192.168.1.100', '2024-04-01T08:00:00Z'),
('a0000000-0001-4000-8000-000000000104', 'Visite terrain', 'Parcelle', 'a0000000-0001-4000-8000-000000000005', '{"verification": true, "notes": "Culture en bon état"}', '192.168.1.104', '2024-03-28T09:30:00Z'),
('a0000000-0001-4000-8000-000000000100', 'Export rapport', 'Report', NULL, '{"format": "PDF", "type": "conformite_eudr"}', '192.168.1.100', '2024-04-03T16:00:00Z'),
('a0000000-0001-4000-8000-000000000102', 'Traitement alerte', 'Alert', NULL, '{"alert_ids": ["a0000000-0001-4000-8000-000000000006"], "action": "investigation"}', '192.168.1.102', '2024-03-25T08:00:00Z'),
('a0000000-0001-4000-8000-000000000101', 'Modification lot', 'Lot', 'ATB-2403-009', '{"field": "prix", "old": "1700", "new": "1750"}', '192.168.1.101', '2024-03-21T11:30:00Z'),
('a0000000-0001-4000-8000-000000000103', 'Réception stock', 'Product', NULL, '{"product": "Semence Cacao hybride", "qty": 200}', '192.168.1.103', '2024-03-20T09:00:00Z'),
('a0000000-0001-4000-8000-000000000104', 'Inscription producteur', 'FarmerProfile', 'f0000000-0001-4000-8000-000000000007', '{"name": "Adélaïde Kpossou", "cooperative": "Atlantique"}', '192.168.1.104', '2024-03-26T08:00:00Z'),
('a0000000-0001-4000-8000-000000000100', 'Synchronisation', 'Blockchain', NULL, '{"tx_count": 8, "status": "completed"}', '192.168.1.100', '2024-04-04T05:00:00Z'),
('a0000000-0001-4000-8000-000000000102', 'Vérification parcelle', 'Parcelle', 'a0000000-0001-4000-8000-000000000014', '{"is_verified": false, "pending_docs": ["cadastre"]}', '192.168.1.102', '2024-03-27T15:00:00Z'),
('a0000000-0001-4000-8000-000000000101', 'Rapport financier', 'Transaction', NULL, '{"period": "2024-03", "total_ventes": 78918000}', '192.168.1.101', '2024-04-01T07:00:00Z'),
('a0000000-0001-4000-8000-000000000103', 'Expédition', 'Order', NULL, '{"lot": "ATB-2403-018", "transport": "Camion 4x4", "chauffeur": "Idrissou B."}', '192.168.1.103', '2024-03-29T06:00:00Z'),
('a0000000-0001-4000-8000-000000000100', 'Mise à jour IA', 'Model', NULL, '{"model": "lstm-v2.4", "new_predictions": 10}', '192.168.1.100', '2024-04-04T12:00:00Z'),
('a0000000-0001-4000-8000-000000000104', 'Photo parcelle', 'Parcelle', 'a0000000-0001-4000-8000-000000000019', '{"photos_added": 3, "type": "terrain"}', '192.168.1.104', '2024-04-01T10:30:00Z'),
('a0000000-0001-4000-8000-000000000102', 'Alerte traité', 'Alert', NULL, '{"alert": "Parcelle Kétou-2", "resolution": "Fausse alerte - ombre portée"}', '192.168.1.102', '2024-03-27T09:00:00Z');

-- ============================================================
-- 14. COMMANDES MARKETPLACE (5 commandes pour les buyers)
-- ============================================================
INSERT INTO marketplace_orders (producteur_id, items, total, status, created_at) VALUES
('f0000000-0001-4000-8000-000000000001', '[{"product":"Semence Cacao hybride","qty":50,"price":2500}]', 125000, 'pending', '2024-03-20T10:00:00Z'),
('f0000000-0001-4000-8000-000000000003', '[{"product":"Engrais NPK 15-15-15","qty":10,"price":12000}]', 120000, 'confirmed', '2024-03-22T14:30:00Z'),
('f0000000-0001-4000-8000-000000000005', '[{"product":"Pulvérisateur dorsal 16L","qty":5,"price":35000},{"product":"Insecticide biologique","qty":20,"price":8500}]', 345000, 'shipped', '2024-03-25T09:00:00Z'),
('f0000000-0001-4000-8000-000000000007', '[{"product":"Machette professionnelle","qty":30,"price":4500}]', 135000, 'delivered', '2024-03-15T11:00:00Z'),
('f0000000-0001-4000-8000-000000000009', '[{"product":"Semence Cacao hybride","qty":100,"price":2500},{"product":"Engrais NPK 15-15-15","qty":25,"price":12000}]', 550000, 'pending', '2024-04-01T08:00:00Z');

-- ============================================================
-- 15. PRODUITS MARKETPLACE (si table vide, ajouter 5)
-- ============================================================
INSERT INTO marketplace_products (name, category, description, price, stock, is_available)
SELECT 'Semence Cacao hybride', 'semence', 'Semences certifiées de cacao hybride résistant à la pourriture brune', 2500, 500, true
WHERE NOT EXISTS (SELECT 1 FROM marketplace_products WHERE name = 'Semence Cacao hybride');

INSERT INTO marketplace_products (name, category, description, price, stock, is_available)
SELECT 'Engrais NPK 15-15-15', 'engrais', 'Engrais complet pour cacao et cultures vivrières', 12000, 200, true
WHERE NOT EXISTS (SELECT 1 FROM marketplace_products WHERE name = 'Engrais NPK 15-15-15');

INSERT INTO marketplace_products (name, category, description, price, stock, is_available)
SELECT 'Pulvérisateur dorsal 16L', 'outillage', 'Pulvérisateur à pression préalable 16 litres', 35000, 50, true
WHERE NOT EXISTS (SELECT 1 FROM marketplace_products WHERE name = 'Pulvérisateur dorsal 16L');

INSERT INTO marketplace_products (name, category, description, price, stock, is_available)
SELECT 'Insecticide biologique', 'phyto', 'Insecticide à base de neem, certifié bio', 8500, 150, true
WHERE NOT EXISTS (SELECT 1 FROM marketplace_products WHERE name = 'Insecticide biologique');

INSERT INTO marketplace_products (name, category, description, price, stock, is_available)
SELECT 'Machette professionnelle', 'outillage', 'Machette en acier carbone 22 pouces', 4500, 80, true
WHERE NOT EXISTS (SELECT 1 FROM marketplace_products WHERE name = 'Machette professionnelle');

-- ============================================================
-- VÉRIFICATION
-- ============================================================
SELECT 'Seed 20 utilisateurs terminé !' AS message;
