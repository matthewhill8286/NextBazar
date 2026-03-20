import { Eye, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "./favorite-button";

type CatLike = { name: string; slug?: string; icon?: string };
type LocLike = { name: string; slug?: string };

type ListingCardProps = {
  listing: {
    id: string;
    slug: string;
    title: string;
    price: number | null;
    currency: string;
    primary_image_url: string | null;
    is_promoted: boolean;
    is_urgent: boolean;
    condition: string | null;
    view_count: number;
    created_at: string;
    status?: string | null;
    // Accept both aliased and non-aliased shapes from Supabase
    category?: CatLike | null;
    categories?: CatLike | null;
    location?: LocLike | null;
    locations?: LocLike | null;
  };
  /** Authenticated user id — passed from parent to avoid per-card auth fetch */
  userId?: string | null;
  /** Whether this listing is already saved — passed from parent to avoid per-card DB fetch */
  isSaved?: boolean;
  /** Called when the user un-saves this listing (useful for removing it from a saved list) */
  onUnsave?: () => void;
};

function unwrap<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  if (Array.isArray(v)) return v[0] || null;
  return v;
}

function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Contact";
  const sym = currency === "EUR" ? "€" : currency;
  return `${sym}${price.toLocaleString()}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ListingCard({
  listing,
  userId,
  isSaved,
  onUnsave,
}: ListingCardProps) {
  const _cat = unwrap(listing.categories) || unwrap(listing.category);
  const loc = unwrap(listing.locations) || unwrap(listing.location);

  const imageSrc =
    listing.primary_image_url ||
    "https://images.unsplash.com/photo-1560472355-536de3962603?w=400&h=300&fit=crop";

  return (
    <Link
      href={`/listing/${listing.slug}`}
      className="group bg-white rounded-xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-gray-200 hover:-translate-y-0.5 block"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
        <Image
          src={imageSrc}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {listing.is_promoted && (
          <span className="absolute top-2.5 left-2.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Featured
          </span>
        )}
        {listing.is_urgent && !listing.is_promoted && (
          <span className="absolute top-2.5 left-2.5 bg-red-500 text-white text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm">
            Urgent
          </span>
        )}

        {listing.status === "sold" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-sm font-bold px-4 py-1.5 rounded-full shadow-md tracking-wide uppercase">
              Sold
            </span>
          </div>
        )}

        <FavoriteButton
          listingId={listing.id}
          userId={userId}
          initialSaved={isSaved}
          onToggle={
            onUnsave
              ? (saved) => {
                  if (!saved) onUnsave();
                }
              : undefined
          }
        />

        <div className="absolute bottom-2 right-2 flex gap-1.5">
          <span className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            <Eye className="w-3 h-3" />
            {(listing.view_count || 0).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="p-3.5">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1 mb-1">
          {listing.title}
        </h3>
        <div className="flex items-center gap-1.5 text-gray-500 text-xs mb-2.5">
          <MapPin className="w-3 h-3 shrink-0" />
          <span>{loc?.name || "Cyprus"}</span>
          {listing.condition && (
            <>
              <span className="text-gray-300">·</span>
              <span className="capitalize">
                {listing.condition.replace("_", " ")}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(listing.price, listing.currency)}
          </span>
          <span className="text-xs text-gray-400">
            {timeAgo(listing.created_at)}
          </span>
        </div>
      </div>
    </Link>
  );
}
