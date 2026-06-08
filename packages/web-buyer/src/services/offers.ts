import api from "./api";
import type { Offer, OfferRequest } from "../types/offer";
import { formatNumber } from "../utils/format";

const MOCK_OFFERS: Offer[] = [];

let mockIdCounter = 0;
const nextId = () => `OFF-${String(++mockIdCounter).padStart(4, "0")}`;

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * ms));

export async function fetchOffersByLot(lotId: string): Promise<Offer[]> {
  try {
    const { data } = await api.get("/offers", { params: { lotId } });
    return data ?? [];
  } catch {
    await delay(200);
    return MOCK_OFFERS.filter((o) => o.lotId === lotId);
  }
}

export async function createOffer(body: OfferRequest): Promise<Offer> {
  const payload = { ...body, buyerId: "b0000000-0001-4000-8000-000000000001" };
  try {
    const { data } = await api.post("/offers", payload);
    return data;
  } catch {
    await delay(300);
    const offer: Offer = {
      id: nextId(),
      lotId: body.lotId,
      buyerId: "b0000000-0001-4000-8000-000000000001",
      sellerId: body.sellerId,
      buyerName: "Vous",
      sellerName: "Producteur",
      quantity: body.quantity,
      pricePerKg: body.pricePerKg,
      totalFormatted: `${formatNumber(parseInt(body.quantity.replace(/\s/g, "").replace("kg", "")) * body.pricePerKg)} FCFA`,
      message: body.message,
      status: "pending",
      parentOfferId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_OFFERS.push(offer);
    return offer;
  }
}

export async function respondToOffer(
  offerId: string,
  action: "accept" | "reject",
): Promise<Offer> {
  try {
    const { data } = await api.post(`/offers/${offerId}/${action}`);
    return data;
  } catch {
    await delay(300);
    const idx = MOCK_OFFERS.findIndex((o) => o.id === offerId);
    if (idx === -1) throw new Error("Offer not found");
    MOCK_OFFERS[idx] = {
      ...MOCK_OFFERS[idx],
      status: action === "accept" ? "accepted" : "rejected",
      updatedAt: new Date().toISOString(),
    };
    return MOCK_OFFERS[idx];
  }
}

export async function counterOffer(
  parentId: string,
  body: OfferRequest,
): Promise<Offer> {
  const payload = { ...body, buyerId: "b0000000-0001-4000-8000-000000000001" };
  try {
    const { data } = await api.post(`/offers/${parentId}/counter`, payload);
    return data;
  } catch {
    await delay(300);
    const parent = MOCK_OFFERS.find((o) => o.id === parentId);
    if (!parent) throw new Error("Parent offer not found");
    parent.status = "countered";
    parent.updatedAt = new Date().toISOString();
    const counter: Offer = {
      id: nextId(),
      lotId: body.lotId,
      buyerId: "b0000000-0001-4000-8000-000000000001",
      sellerId: body.sellerId,
      buyerName: "Vous",
      sellerName: parent.sellerName,
      quantity: body.quantity,
      pricePerKg: body.pricePerKg,
      totalFormatted: `${formatNumber(parseInt(body.quantity.replace(/\s/g, "").replace("kg", "")) * body.pricePerKg)} FCFA`,
      message: body.message,
      status: "pending",
      parentOfferId: parentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    MOCK_OFFERS.push(counter);
    return counter;
  }
}

export async function withdrawOffer(offerId: string): Promise<void> {
  try {
    await api.post(`/offers/${offerId}/withdraw`);
  } catch {
    await delay(200);
    const idx = MOCK_OFFERS.findIndex((o) => o.id === offerId);
    if (idx !== -1) {
      MOCK_OFFERS[idx] = {
        ...MOCK_OFFERS[idx],
        status: "withdrawn",
        updatedAt: new Date().toISOString(),
      };
    }
  }
}

export function simulateSellerResponse(offerId: string): Promise<Offer> {
  const idx = MOCK_OFFERS.findIndex((o) => o.id === offerId);
  if (idx === -1) return Promise.reject(new Error("Offer not found"));
  const offer = MOCK_OFFERS[idx];
  const qtyNum = parseInt(offer.quantity.replace(/\s/g, "").replace("kg", ""));
  const counterPrice = Math.round(offer.pricePerKg * (1 + (Math.random() > 0.5 ? 0.05 : -0.03)));
  const counter: Offer = {
    id: nextId(),
    lotId: offer.lotId,
    buyerId: offer.buyerId,
    sellerId: offer.sellerId,
    buyerName: "Vous",
    sellerName: offer.sellerName,
    quantity: offer.quantity,
    pricePerKg: counterPrice,
    totalFormatted: `${formatNumber(qtyNum * counterPrice)} FCFA`,
    message: `Contre-proposition: ${formatNumber(counterPrice)} FCFA/kg`,
    status: "pending",
    parentOfferId: offer.id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  MOCK_OFFERS[idx] = { ...MOCK_OFFERS[idx], status: "countered", updatedAt: new Date().toISOString() };
  MOCK_OFFERS.push(counter);
  return Promise.resolve(counter);
}
