"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { X } from "lucide-react";
import { useCallback } from "react";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

type Props = {
  listingId: string;
  promotionType: "featured" | "urgent";
  /** Called when the user closes the modal without paying */
  onClose: () => void;
};

export default function StripeCheckoutModal({ listingId, promotionType, onClose }: Props) {
  const fetchClientSecret = useCallback(async () => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        listingId,
        promotionType,
        origin: window.location.origin,
        embedded: true,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.clientSecret) {
      throw new Error(data.error || "Failed to create checkout session");
    }
    return data.clientSecret;
  }, [listingId, promotionType]);

  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="font-semibold text-gray-900 text-sm">
              {promotionType === "featured" ? "✨ Featured Listing — €4.99" : "⚡ Urgent Badge — €2.99"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">Secure payment powered by Stripe</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stripe Embedded Checkout */}
        <div className="overflow-y-auto flex-1 p-1">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ fetchClientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}
