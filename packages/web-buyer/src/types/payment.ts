export interface PaymentProvider {
  id: string;
  name: string;
  currencies?: string[];
  processingTime?: string;
  fee?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface PaymentMethod {
  id: string;
  label: string;
  icon: string;
  providers: PaymentProvider[];
  minAmount: number;
  maxAmount: number;
  processingTime: string;
  fee: string;
}

export interface BankDetails {
  bankName: string;
  accountName: string;
  accountNumber: string;
  swift: string;
  rib: string;
}

export interface PaymentResult {
  id: string;
  status: string;
  statusMessage?: string;
  paymentUrl?: string;
  qrCode?: string;
  invoiceNumber?: string;
  bankDetails?: BankDetails;
  walletAddress?: string;
}
