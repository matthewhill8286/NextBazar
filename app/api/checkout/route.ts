import { type NextRequest, NextResponse } from "next/server";
import { PROMOTION_PRICES, type PromotionType, stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { listingId, promotionType, origin } = body;

    if (!listingId || !promotionType || !origin) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const promo = PROMOTION_PRICES[promotionType as PromotionType];
    if (!promo) {
      return NextResponse.json(
        { error: "Invalid promotion type" },
        { status: 400 },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price: promo.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        listing_id: listingId,
        promotion_type: promotionType,
        duration_days: promo.duration.toString(),
      },
      success_url: `${origin}/promote/success?session_id={CHECKOUT_SESSION_ID}&listing_id=${listingId}`,
      cancel_url: `${origin}/promote/${listingId}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: any) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create checkout session" },
      { status: 500 },
    );
  }
}
