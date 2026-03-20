"use client";

import {
  CheckCircle,
  Eye,
  Heart,
  Loader2,
  MoreVertical,
  Pencil,
  RotateCcw,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Listing = {
  id: string;
  title: string;
  slug: string;
  price: number | null;
  currency: string;
  status: string;
  primary_image_url: string | null;
  view_count: number;
  favorite_count: number;
  is_promoted: boolean;
  is_urgent: boolean;
  created_at: string;
  categories:
    | { name: string; icon: string }[]
    | { name: string; icon: string }
    | null;
  locations: { name: string }[] | { name: string } | null;
};

const TABS = [
  { key: "active", label: "Active" },
  { key: "sold", label: "Sold" },
  { key: "expired", label: "Expired" },
  { key: "draft", label: "Drafts" },
];

export default function ListingsClient({
  initialListings,
}: {
  initialListings: Listing[];
}) {
  const _router = useRouter();
  const supabase = createClient();
  const [listings, setListings] = useState(initialListings);
  const [tab, setTab] = useState("active");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  const filtered = listings.filter((l) => l.status === tab);

  function unwrap<T>(val: T | T[] | null): T | null {
    if (!val) return null;
    if (Array.isArray(val)) return val[0] || null;
    return val;
  }

  function formatPrice(p: number | null, c: string) {
    if (!p) return "Contact";
    return `${c === "EUR" ? "€" : c}${p.toLocaleString()}`;
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return "Just now";
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  async function updateStatus(id: string, status: string) {
    setLoadingAction(id);
    await supabase.from("listings").update({ status }).eq("id", id);
    setListings((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status } : l)),
    );
    setOpenMenu(null);
    setLoadingAction(null);
  }

  async function deleteListing(id: string) {
    setLoadingAction(id);
    await supabase.from("listings").delete().eq("id", id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    setOpenMenu(null);
    setLoadingAction(null);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {TABS.map((t) => {
          const count = listings.filter((l) => l.status === t.key).length;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.key
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
              {count > 0 && (
                <span className="ml-1.5 text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Listings */}
      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50">
          {filtered.map((listing) => (
            <div
              key={listing.id}
              className="flex items-center gap-4 p-4 hover:bg-gray-50/50 transition-colors"
            >
              {/* Thumbnail */}
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                {listing.primary_image_url ? (
                  <Image
                    src={listing.primary_image_url}
                    alt={listing.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                    {unwrap(listing.categories)?.icon || "📦"}
                  </div>
                )}
                {listing.is_promoted && listing.status !== "sold" && (
                  <span className="absolute top-0.5 left-0.5 bg-amber-500 text-white text-[8px] font-bold px-1 py-0.5 rounded">
                    AD
                  </span>
                )}
                {listing.status === "sold" && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="bg-white text-gray-900 text-[9px] font-bold px-2 py-0.5 rounded tracking-wide uppercase">
                      Sold
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/listing/${listing.slug}`}
                  className="font-medium text-gray-900 text-sm hover:text-blue-600 truncate block"
                >
                  {listing.title}
                </Link>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span className="font-semibold text-gray-900">
                    {formatPrice(listing.price, listing.currency)}
                  </span>
                  <span>·</span>
                  <span>{unwrap(listing.locations)?.name || "Cyprus"}</span>
                  <span>·</span>
                  <span>{timeAgo(listing.created_at)}</span>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:flex items-center gap-5 text-xs text-gray-500 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{(listing.view_count || 0).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{listing.favorite_count || 0}</span>
                </div>
              </div>

              {/* Actions Menu */}
              <div className="relative flex-shrink-0">
                {loadingAction === listing.id ? (
                  <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                ) : (
                  <button
                    onClick={() =>
                      setOpenMenu(openMenu === listing.id ? null : listing.id)
                    }
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                )}

                {openMenu === listing.id && (
                  <div className="absolute right-0 top-10 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1.5 z-20">
                    <Link
                      href={`/dashboard/edit/${listing.id}`}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setOpenMenu(null)}
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit Listing
                    </Link>
                    {listing.status === "active" && !listing.is_promoted && (
                      <Link
                        href={`/promote/${listing.id}`}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50"
                        onClick={() => setOpenMenu(null)}
                      >
                        <Star className="w-3.5 h-3.5" /> Promote Listing
                      </Link>
                    )}
                    {listing.status === "active" && (
                      <button
                        onClick={() => updateStatus(listing.id, "sold")}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Mark as Sold
                      </button>
                    )}
                    {listing.status === "sold" && (
                      <button
                        onClick={() => updateStatus(listing.id, "active")}
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Reactivate
                      </button>
                    )}
                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <div className="text-4xl mb-3">
            {tab === "active" ? "📦" : tab === "sold" ? "✅" : "⏳"}
          </div>
          <p className="text-gray-500 text-sm">No {tab} listings</p>
        </div>
      )}
    </div>
  );
}
