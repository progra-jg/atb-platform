import { Injectable, Logger } from "@nestjs/common";

export interface DeployContractResult {
  contractAddress: string;
  txHash: string;
  blockNumber: number;
}

export interface TransactionResult {
  txHash: string;
  blockNumber: number;
  success: boolean;
}

@Injectable()
export class MockBlockchainProvider {
  private readonly logger = new Logger(MockBlockchainProvider.name);
  private readonly contracts = new Map<string, { balance: number }>();

  async deployContract(
    orderId: string,
    amount: number,
    buyer: string,
    seller: string,
  ): Promise<DeployContractResult> {
    const contractAddress = this.generateAddress("0x");
    const txHash = this.generateHash();
    const blockNumber = Math.floor(Math.random() * 1000000) + 10000000;

    this.contracts.set(contractAddress, { balance: 0 });

    this.logger.log(`Deployed mock escrow contract ${contractAddress} for order ${orderId}`);

    return { contractAddress, txHash, blockNumber };
  }

  async simulateDeposit(contractAddress: string, amount: number): Promise<TransactionResult> {
    const balance = this.contracts.get(contractAddress);
    if (!balance) throw new Error(`Contract ${contractAddress} not found`);

    balance.balance += amount;
    const txHash = this.generateHash();
    const blockNumber = Math.floor(Math.random() * 1000000) + 10000000;

    this.logger.log(`Deposited ${amount} to contract ${contractAddress}, tx: ${txHash}`);

    return { txHash, blockNumber, success: true };
  }

  async simulateRelease(contractAddress: string): Promise<TransactionResult> {
    const balance = this.contracts.get(contractAddress);
    if (!balance) throw new Error(`Contract ${contractAddress} not found`);

    const releasedAmount = balance.balance;
    balance.balance = 0;
    const txHash = this.generateHash();
    const blockNumber = Math.floor(Math.random() * 1000000) + 10000000;

    this.logger.log(`Released ${releasedAmount} from contract ${contractAddress}, tx: ${txHash}`);

    return { txHash, blockNumber, success: true };
  }

  async simulateRefund(contractAddress: string): Promise<TransactionResult> {
    const balance = this.contracts.get(contractAddress);
    if (!balance) throw new Error(`Contract ${contractAddress} not found`);

    balance.balance = 0;
    const txHash = this.generateHash();
    const blockNumber = Math.floor(Math.random() * 1000000) + 10000000;

    this.logger.log(`Refunded from contract ${contractAddress}, tx: ${txHash}`);

    return { txHash, blockNumber, success: true };
  }

  async getContractBalance(contractAddress: string): Promise<number> {
    const balance = this.contracts.get(contractAddress);
    if (!balance) throw new Error(`Contract ${contractAddress} not found`);
    return balance.balance;
  }

  private generateAddress(prefix: string): string {
    const hex = "0123456789abcdef";
    let addr = prefix;
    for (let i = 0; i < 40; i++) addr += hex[Math.floor(Math.random() * 16)];
    return addr;
  }

  private generateHash(): string {
    const hex = "0123456789abcdef";
    let hash = "0x";
    for (let i = 0; i < 64; i++) hash += hex[Math.floor(Math.random() * 16)];
    return hash;
  }
}
