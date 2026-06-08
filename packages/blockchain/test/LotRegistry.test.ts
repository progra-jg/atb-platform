import { expect } from "chai";
import { ethers } from "hardhat";
import { LotRegistry } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("LotRegistry", function () {
  let lotRegistry: LotRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const LotRegistry = await ethers.getContractFactory("LotRegistry");
    lotRegistry = await LotRegistry.deploy();
    await lotRegistry.waitForDeployment();
  });

  it("Should mint a new lot", async function () {
    const tx = await lotRegistry.mint(
      user1.address,
      "https://api.agritrace.bj/metadata/lot/1",
      "Cacao",
      1000,
      "parcelle_1",
      0
    );
    await tx.wait();

    const [, lot] = await lotRegistry.verifyLot(1);
    expect(lot.culture).to.equal("Cacao");
    expect(lot.quantite).to.equal(1000);
    expect(await lotRegistry.ownerOf(1)).to.equal(user1.address);
  });

  it("Should transfer a lot", async function () {
    await lotRegistry.mint(user1.address, "uri", "Coton", 500, "parcelle_2", 0);

    await lotRegistry.connect(user1).transferLot(user2.address, 1);
    expect(await lotRegistry.ownerOf(1)).to.equal(user2.address);
  });

  it("Should revert transfer if not authorized", async function () {
    await lotRegistry.mint(user1.address, "uri", "Maïs", 300, "parcelle_3", 0);

    await expect(
      lotRegistry.connect(user2).transferLot(user1.address, 1)
    ).to.be.reverted;
  });

  it("Should verify a lot exists", async function () {
    await lotRegistry.mint(user1.address, "uri", "Anacarde", 200, "parcelle_4", 0);
    const [exists, info] = await lotRegistry.verifyLot(1);
    expect(exists).to.be.true;
    expect(info.culture).to.equal("Anacarde");
  });

  it("Should revert for non-existent lot", async function () {
    await expect(lotRegistry.verifyLot(999)).to.be.reverted;
  });

  it("Should burn a lot", async function () {
    await lotRegistry.mint(user1.address, "uri", "Café", 150, "parcelle_5", 0);
    const VERIFIER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("VERIFIER_ROLE"));
    await lotRegistry.grantRole(VERIFIER_ROLE, owner.address);
    await lotRegistry.burn(1);
    await expect(lotRegistry.verifyLot(1)).to.be.reverted;
  });

  it("Should not allow non-verifier to burn", async function () {
    await lotRegistry.mint(user1.address, "uri", "Cacao", 100, "parcelle_6", 0);
    await expect(lotRegistry.connect(user1).burn(1)).to.be.reverted;
  });

  it("Should track transfer history", async function () {
    await lotRegistry.mint(user1.address, "uri", "Coton", 800, "parcelle_7", 0);
    await lotRegistry.connect(user1).transferLot(user2.address, 1);
    const history = await lotRegistry.getTransferHistory(1);
    expect(history.length).to.equal(2);
  });
});
