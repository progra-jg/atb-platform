import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);

  // Deploy LotRegistry
  const LotRegistry = await ethers.getContractFactory("LotRegistry");
  const lotRegistry = await LotRegistry.deploy();
  await lotRegistry.waitForDeployment();
  console.log("LotRegistry deployed to:", await lotRegistry.getAddress());

  // Deploy CertificateRegistry
  const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
  const certRegistry = await CertificateRegistry.deploy();
  await certRegistry.waitForDeployment();
  console.log("CertificateRegistry deployed to:", await certRegistry.getAddress());

  // Deploy ProductorIdentity
  const ProductorIdentity = await ethers.getContractFactory("ProductorIdentity");
  const identity = await ProductorIdentity.deploy();
  await identity.waitForDeployment();
  console.log("ProductorIdentity deployed to:", await identity.getAddress());

  // Grant roles
  const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
  const ISSUER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ISSUER_ROLE"));
  const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));

  await lotRegistry.grantRole(MINTER_ROLE, deployer.address);
  await certRegistry.grantRole(ISSUER_ROLE, deployer.address);
  await identity.grantRole(VERIFIER_ROLE, deployer.address);

  console.log("Roles granted successfully");

  // Save deployment addresses
  const fs = require("fs");
  const deployment = {
    network: (await ethers.provider.getNetwork()).name,
    lotRegistry: await lotRegistry.getAddress(),
    certificateRegistry: await certRegistry.getAddress(),
    productorIdentity: await identity.getAddress(),
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  fs.writeFileSync(
    "deployment.json",
    JSON.stringify(deployment, null, 2)
  );
  console.log("Deployment info saved to deployment.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
