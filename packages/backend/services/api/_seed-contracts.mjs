const BASE = "http://localhost:4000/api/framework-contracts";
const BUYER = "b0000000-0001-4000-8000-000000000001";

async function post(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) { console.error("ERROR", r.status, data); return null; }
  return data;
}

async function patch(url, body) {
  const r = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json();
  if (!r.ok) { console.error("ERROR", r.status, data); return null; }
  return data;
}

const contracts = [
  // 1. Brouillon
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000001", culture: "Cacao", volumeKg: 3000, prixKg: 2500, dateDebut: "2026-06-01", dateFin: "2026-12-31", conditions: "Cacao certifié EUDR. Paiement à 30 jours fin de mois.", renouvelable: true, lotId: "ATB-2403-001" },
  // 2. Envoyé
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000005", culture: "Café", volumeKg: 500, prixKg: 4500, dateDebut: "2026-05-20", dateFin: "2026-11-20", conditions: "Café Bio. Livraison franco producteur.", renouvelable: false },
  // 3. Négociation
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000004", culture: "Anacarde", volumeKg: 2000, prixKg: 3100, dateDebut: "2026-07-01", dateFin: "2026-12-31", conditions: "Anacarde premium EUDR.", renouvelable: false },
  // 4. Actif
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000002", culture: "Maïs", volumeKg: 5000, prixKg: 700, dateDebut: "2026-01-01", dateFin: "2026-06-30", conditions: "Maïs bio Coopérative du Zou.", renouvelable: true, lotId: "ATB-2403-010" },
  // 5. Partiellement signé
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000003", culture: "Coton", volumeKg: 4000, prixKg: 1700, dateDebut: "2026-03-01", dateFin: "2026-09-30", conditions: "Coton GlobalGAP.", renouvelable: false },
  // 6. Terminé
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000004", culture: "Soja", volumeKg: 1500, prixKg: 1200, dateDebut: "2025-01-01", dateFin: "2025-06-30", conditions: "Soja bio. Contrat terminé.", renouvelable: false },
  // 7-12: Extra contracts
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000005", culture: "Huile de palme", volumeKg: 8000, prixKg: 900, dateDebut: "2026-04-01", dateFin: "2026-10-31", conditions: "Huile de palme durable RSPO.", renouvelable: true },
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000001", culture: "Cacao", volumeKg: 1500, prixKg: 2700, dateDebut: "2026-08-01", dateFin: "2027-01-31", conditions: "Cacao bio. Prime qualité +5%.", renouvelable: false },
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000002", culture: "Manioc", volumeKg: 10000, prixKg: 350, dateDebut: "2026-06-15", dateFin: "2026-12-15", conditions: "Manioc transformation industrielle.", renouvelable: false },
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000003", culture: "Coton", volumeKg: 2500, prixKg: 1800, dateDebut: "2026-09-01", dateFin: "2027-03-31", conditions: "Coton bio équitable.", renouvelable: true },
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000004", culture: "Anacarde", volumeKg: 1200, prixKg: 3300, dateDebut: "2026-10-01", dateFin: "2027-03-31", conditions: "Anacarde bio.", renouvelable: false },
  { buyerId: BUYER, producteurId: "f0000000-0001-4000-8000-000000000005", culture: "Café", volumeKg: 800, prixKg: 4200, dateDebut: "2026-11-01", dateFin: "2027-04-30", conditions: "Café Arabica haut de gamme.", renouvelable: true },
];

const created = [];
for (const c of contracts) {
  console.log(`Creating ${c.culture}...`);
  const result = await post(BASE, c);
  if (result) {
    created.push(result);
    console.log(`  -> ${result.id} (${result.statut})`);
  }
}

// Status transitions
if (created.length >= 2) {
  console.log(`\nUpdating ${created[1].culture} -> envoyé...`);
  await patch(`${BASE}/${created[1].id}`, { statut: "envoye" });
}
if (created.length >= 3) {
  console.log(`\nUpdating ${created[2].culture} -> en_negociation...`);
  await patch(`${BASE}/${created[2].id}`, { statut: "envoye" });
  await post(`${BASE}/${created[2].id}/negotiate`, { role: "producteur", prixKg: 3200, volumeKg: 1800, message: "Le prix du marché a augmenté. Proposons 3200 FCFA/kg et 1.8t." });
}
if (created.length >= 4) {
  console.log(`\nSigning ${created[3].culture}...`);
  await post(`${BASE}/${created[3].id}/sign`, { role: "buyer" });
  await post(`${BASE}/${created[3].id}/sign`, { role: "producteur" });
}
if (created.length >= 5) {
  console.log(`\nPartially signing ${created[4].culture}...`);
  await post(`${BASE}/${created[4].id}/sign`, { role: "buyer" });
}
if (created.length >= 6) {
  console.log(`\nFinishing ${created[5].culture}...`);
  await post(`${BASE}/${created[5].id}/sign`, { role: "buyer" });
  await post(`${BASE}/${created[5].id}/sign`, { role: "producteur" });
  await patch(`${BASE}/${created[5].id}`, { statut: "termine" });
}
// Extra: make one résilié
if (created.length >= 7) {
  console.log(`\nResiliating ${created[6].culture}...`);
  await post(`${BASE}/${created[6].id}/sign`, { role: "buyer" });
  await post(`${BASE}/${created[6].id}/sign`, { role: "producteur" });
  await patch(`${BASE}/${created[6].id}`, { statut: "resilie" });
}
// Extra: make one actif with deliveries + payments
if (created.length >= 8) {
  console.log(`\nSigning ${created[7].culture}...`);
  await post(`${BASE}/${created[7].id}/sign`, { role: "buyer" });
  await post(`${BASE}/${created[7].id}/sign`, { role: "producteur" });
}

console.log("\n✅ Done! Created contracts:");
for (const c of created) {
  console.log(`  ${c.culture} - ${c.id.slice(0, 8)} - ${c.statut}`);
}
