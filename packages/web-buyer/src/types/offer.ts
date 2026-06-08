export type OfferStatus = "pending" | "accepted" | "rejected" | "countered" | "withdrawn" | "expired";

export interface Offer {
  id: string;
  lotId: string;
  buyerId: string;
  sellerId: string;
  buyerName: string;
  sellerName: string;
  quantity: string;
  pricePerKg: number;
  totalFormatted: string;
  message: string;
  status: OfferStatus;
  parentOfferId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OfferRequest {
  lotId: string;
  buyerId?: string;
  sellerId: string;
  quantity: string;
  pricePerKg: number;
  message: string;
}
