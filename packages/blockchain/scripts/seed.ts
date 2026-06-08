import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Seeding data with account:", deployer.address);

  const fs = require("fs");
  const deployment = JSON.parse(fs.readFileSync("deployment.json", "utf8"));

  const lotRegistry = await ethers.getContractAt("LotRegistry", deployment.lotRegistry);
  const certRegistry = await ethers.getContractAt("CertificateRegistry", deployment.certificateRegistry);

  // Create 10 producteurs (simulated as different signers)
  const producteurs = await ethers.getSigners();
  const testProducteurs = producteurs.slice(1, 11);

  // Mint 5 lots
  const cultures = ["Cacao", "Coton", "Anacarde", "Café", "Maïs"];
  for (let i = 0; i < 5; i++) {
    const tx = await lotRegistry.mint(
      testProducteurs[i].address,
      `https://api.agritrace.bj/metadata/lot/${i + 1}`,
      cultures[i],
      Math.floor(Math.random() * 10000) + 100,
      `parcelle_${i + 1}`,
      0
    );
    await tx.wait();
    console.log(`Lot ${i + 1} minted: ${cultures[i]}`);
  }

  // Issue 2 certificates
  for (let i = 0; i < 2; i++) {
    const tx = await certRegistry.issue(
      testProducteurs[i].address,
      i + 1,
      "EUDR",
      365,
      `https://api.agritrace.bj/certificates/${i + 1}`
    );
    await tx.wait();
    console.log(`Certificate ${i + 1} issued for lot ${i + 1}`);
  }

  console.log("Seed data created successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
