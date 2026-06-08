import api from "./api";
import type { Review, ReviewSubmission } from "../types";

const delay = (ms = 400) => new Promise((r) => setTimeout(r, ms + Math.random() * 400));

export async function submitReview(data: ReviewSubmission): Promise<Review> {
  try {
    const { data: res } = await api.post("/reviews", data);
    return res;
  } catch (e: any) {
    throw new Error(e.response?.data?.message || "Erreur lors de la soumission de l'avis");
  }
}

export async function getSellerReviews(sellerId: string): Promise<Review[]> {
  try {
    const { data } = await api.get(`/reviews/seller/${sellerId}`);
    return data;
  } catch {
    await delay();
    return [];
  }
}

export async function getBuyerReviewForOrder(orderId: string, buyerId: string): Promise<Review | null> {
  try {
    const { data } = await api.get(`/reviews/order/${orderId}/buyer/${buyerId}`);
    return data;
  } catch {
    return null;
  }
}
