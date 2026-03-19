import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Price IDs from Stripe
export const PROMOTION_PRICES = {
  featured: {
    priceId: "price_1TCjoEI6t3gE5tEXLlAz67ij",
    name: "Featured Listing",
    description: "Top placement + highlighted for 7 days",
    amount: 499,
    duration: 7, // days
  },
  urgent: {
    priceId: "price_1TCjpkI6t3gE5tEXZNLzzSTh",
    name: "Urgent Badge",
    description: "Urgent badge + priority in search for 3 days",
    amount: 299,
    duration: 3, // days
  },
} as const;

export type PromotionType = keyof typeof PROMOTION_PRICES;
