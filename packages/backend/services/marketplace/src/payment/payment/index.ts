import axios from "axios";

export class MTNMoMoPayment {
  private apiUrl: string;
  private apiKey: string;
  private subscriptionKey: string;

  constructor() {
    this.apiUrl = process.env.MTN_MOMO_API_URL || "https://sandbox.momodeveloper.mtn.com";
    this.apiKey = process.env.MTN_MOMO_API_KEY || "";
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY || "";
  }

  async requestToPay(phoneNumber: string, amount: number, currency: string = "EUR") {
    try {
      const response = await axios.post(
        `${this.apiUrl}/collection/v1_0/requesttopay`,
        {
          amount: amount.toString(),
          currency,
          externalId: `order_${Date.now()}`,
          payer: { partyIdType: "MSISDN", partyId: phoneNumber },
          payerMessage: "Paiement ATB AgriTrace",
          payeeNote: "Commande intrants agricoles",
        },
        {
          headers: {
            "X-Reference-Id": `ref_${Date.now()}`,
            "X-Target-Environment": "sandbox",
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
            "Authorization": `Bearer ${this.apiKey}`,
          },
        }
      );
      return { success: true, reference: response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getTransactionStatus(referenceId: string) {
    try {
      const response = await axios.get(
        `${this.apiUrl}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            "X-Target-Environment": "sandbox",
            "Ocp-Apim-Subscription-Key": this.subscriptionKey,
          },
        }
      );
      return response.data;
    } catch {
      return { status: "FAILED" };
    }
  }
}
