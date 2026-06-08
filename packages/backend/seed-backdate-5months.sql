-- ============================================================
-- Backdate toutes les données sur 5 mois (Nov 2023 - Avr 2024)
-- ============================================================

-- Lots : 20 lots répartis sur ~150 jours
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM lots
)
UPDATE lots SET created_at = '2023-11-01'::date + numbered.rn * interval '7 days'
FROM numbered WHERE lots.id = numbered.id;

-- Certificats
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM certificates
)
UPDATE certificates SET created_at = '2023-11-02'::date + numbered.rn * interval '7 days'
FROM numbered WHERE certificates.id = numbered.id;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM certificates
)
UPDATE certificates SET emis = ('2023-11-02'::date + numbered.rn * interval '7 days')::date
FROM numbered WHERE certificates.id = numbered.id AND emis IS NOT NULL;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM certificates
)
UPDATE certificates SET expire = ('2023-11-02'::date + numbered.rn * interval '7 days' + interval '1 year')::date
FROM numbered WHERE certificates.id = numbered.id AND expire IS NOT NULL;

-- Transactions
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM transactions
)
UPDATE transactions SET created_at = '2023-11-03'::date + numbered.rn * interval '7 days'
FROM numbered WHERE transactions.id = numbered.id;

-- Pesées
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM weighings
)
UPDATE weighings SET date = '2023-11-04T08:00:00Z'::timestamp + numbered.rn * interval '7 days'
FROM numbered WHERE weighings.id = numbered.id;

-- Conformité EUDR
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM eudr_compliance
)
UPDATE eudr_compliance SET created_at = '2023-11-05'::date + numbered.rn * interval '7 days'
FROM numbered WHERE eudr_compliance.id = numbered.id;

WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM eudr_compliance
)
UPDATE eudr_compliance SET last_analysis = ('2023-11-05'::date + numbered.rn * interval '7 days')::date
FROM numbered WHERE eudr_compliance.id = numbered.id AND last_analysis IS NOT NULL;

-- Prédictions IA
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM yield_predictions
)
UPDATE yield_predictions SET last_updated = '2023-11-10'::date + numbered.rn * interval '14 days'
FROM numbered WHERE yield_predictions.id = numbered.id;

-- Notifications
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM notifications
)
UPDATE notifications SET created_at = '2023-11-06'::date + numbered.rn * interval '7 days'
FROM numbered WHERE notifications.id = numbered.id;

-- Quelques notifs récentes (derniers jours)
UPDATE notifications SET created_at = '2024-04-01'::date + (random() * 4)::int * interval '1 day'
WHERE id IN (SELECT id FROM notifications ORDER BY id LIMIT 5);

-- Audit logs
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM audit_log
)
UPDATE audit_log SET created_at = '2023-11-07'::date + numbered.rn * interval '7 days'
FROM numbered WHERE audit_log.id = numbered.id;

-- Commandes marketplace
WITH numbered AS (
  SELECT id, row_number() OVER (ORDER BY id) - 1 AS rn FROM marketplace_orders
)
UPDATE marketplace_orders SET created_at = '2023-11-15'::date + numbered.rn * interval '30 days'
FROM numbered WHERE marketplace_orders.id = numbered.id;

-- Mettre des lots historiques en "Vendu" / "En transit"
UPDATE lots SET statut = 'Vendu' WHERE id IN ('ATB-2403-002', 'ATB-2403-009', 'ATB-2403-011');
UPDATE lots SET statut = 'En transit' WHERE id IN ('ATB-2403-018');

-- Notifications lues (simule l'utilisation)
UPDATE notifications SET is_read = true
WHERE id IN (SELECT id FROM notifications ORDER BY id LIMIT 8);

-- Dernière connexion admins
UPDATE admin_users SET last_login = '2024-04-03'::date + (random() * 2)::int * interval '1 day';

-- ============================================================
-- Vérification
-- ============================================================
SELECT 'Lots par mois' AS source, to_char(created_at, 'YYYY-MM') AS mois, count(*) AS n
FROM lots GROUP BY mois ORDER BY mois;

SELECT 'Certificats par mois' AS source, to_char(created_at, 'YYYY-MM') AS mois, count(*) AS n
FROM certificates GROUP BY mois ORDER BY mois;

SELECT 'Transactions par mois' AS source, to_char(created_at, 'YYYY-MM') AS mois, count(*) AS n
FROM transactions GROUP BY mois ORDER BY mois;

SELECT 'Notifications par mois' AS source, to_char(created_at, 'YYYY-MM') AS mois, count(*) AS n
FROM notifications GROUP BY mois ORDER BY mois;
