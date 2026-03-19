"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Heart, Loader2, Trash2 } from "lucide-react";
import ListingCard from "@/app/components/listing-card";

export default function SavedPage() {
  const router = useRouter();
  const supabase = createClient();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login?redirect=/saved");
        return;
      }

      // Get favorite listing IDs
      const { data: favs } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (!favs || favs.length === 0) {
        setListings([]);
        setLoading(false);
        return;
      }

      const ids = favs.map((f) => f.listing_id);

      // Fetch the actual listings
      const { data } = await supabase
        .from("listings")
        .select(
          `*, categories(name, slug, icon), locations(name, slug)`,
        )
        .in("id", ids)
        .eq("status", "active");

      // Sort them in the same order as favorites (most recently saved first)
      const sorted = ids
        .map((id) => data?.find((l) => l.id === id))
        .filter(Boolean);

      setListings(sorted);
      setLoading(false);
    }
    load();
  }, []);

  async function removeFavorite(listingId: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("listing_id", listingId);

    try { await supabase.rpc("decrement_favorite_count", { lid: listingId }); } catch {}

    setListings((prev) => prev.filter((l) => l.id !== listingId));
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Saved Listings</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {listings.length} {listings.length === 1 ? "item" : "items"} saved
          </p>
        </div>
        {listings.length > 0 && (
          <button
            onClick={async () => {
              if (!confirm("Remove all saved listings?")) return;
              const {
                data: { user },
              } = await supabase.auth.getUser();
              if (!user) return;
              await supabase
                .from("favorites")
                .delete()
                .eq("user_id", user.id);
              setListings([]);
            }}
            className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear all
          </button>
        )}
      </div>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No saved listings
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Tap the heart icon on any listing to save it here
          </p>
          <Link
            href="/"
            className="inline-flex bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Browse Listings
          </Link>
        </div>
      )}
    </div>
  );
}
