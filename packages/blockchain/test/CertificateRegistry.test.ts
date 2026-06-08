import { expect } from "chai";
import { ethers } from "hardhat";

describe("CertificateRegistry", function () {
  let certRegistry: any;
  let owner: any;
  let holder: any;

  beforeEach(async function () {
    [owner, holder] = await ethers.getSigners();
    const CertificateRegistry = await ethers.getContractFactory("CertificateRegistry");
    certRegistry = await CertificateRegistry.deploy();
    await certRegistry.waitForDeployment();
  });

  it("Should issue a certificate", async function () {
    const tx = await certRegistry.issue(holder.address, 1, "EUDR", 365, "https://api.agritrace.bj/cert/1");
    await tx.wait();

    const [valid, cert] = await certRegistry.verify(1);
    expect(valid).to.be.true;
    expect(cert.certType).to.equal("EUDR");
    expect(cert.holder).to.equal(holder.address);
  });

  it("Should revoke a certificate", async function () {
    await certRegistry.issue(holder.address, 1, "GlobalGAP", 365, "uri");
    await certRegistry.revoke(1);
    const [valid] = await certRegistry.verify(1);
    expect(valid).to.be.false;
  });

  it("Should detect expired certificate", async function () {
    await certRegistry.issue(holder.address, 1, "EUDR", 0, "uri");
    const [valid] = await certRegistry.verify(1);
    expect(valid).to.be.false;
  });

  it("Should track holder certificates", async function () {
    await certRegistry.issue(holder.address, 1, "EUDR", 365, "uri");
    await certRegistry.issue(holder.address, 2, "GlobalGAP", 365, "uri");
    const certs = await certRegistry.getHolderCertificates(holder.address);
    expect(certs.length).to.equal(2);
  });
});
