"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Shield, Bot, MessageCircle, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "./components/listing-card";

const LISTING_SELECT = `
  *,
  categories(name, slug, icon),
  locations(name, slug),
  profiles!listings_user_id_fkey(display_name, avatar_url, verified, rating, total_reviews)
`;

export default function HomeClient() {
  const supabase = createClient();
  const [categories, setCategories] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [
        { data: cats },
        { data: feat },
        { data: rec },
        { count },
      ] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase
          .from("listings")
          .select(LISTING_SELECT)
          .eq("status", "active")
          .eq("is_promoted", true)
          .order("created_at", { ascending: false })
          .limit(4),
        supabase
          .from("listings")
          .select(LISTING_SELECT)
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(8),
        supabase
          .from("listings")
          .select("id", { count: "exact", head: true })
          .eq("status", "active"),
      ]);

      setCategories(cats || []);
      setFeatured(feat || []);
      setRecent(rec || []);
      setTotalCount(count || 0);
      setLoading(false);
    }
    load();
  }, []);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            Buy &amp; Sell Anything in Cyprus
          </h1>
          <p className="text-blue-100 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            The smarter marketplace. AI-powered search, instant messaging, and
            trusted sellers.
          </p>

          <Link href="/search" className="block max-w-2xl mx-auto mb-8">
            <div className="relative flex items-center">
              <Search className="absolute left-4 text-gray-400 w-5 h-5" />
              <div className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white text-gray-400 text-left text-base shadow-xl shadow-blue-900/20 hover:shadow-2xl transition-shadow cursor-pointer">
                What are you looking for?
              </div>
            </div>
          </Link>

          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <Search className="w-3.5 h-3.5" />
              {totalCount.toLocaleString()}+ Active Listings
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              Verified Sellers
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <Bot className="w-3.5 h-3.5" />
              AI-Powered
            </div>
            <div className="bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
              <MessageCircle className="w-3.5 h-3.5" />
              Real-time Chat
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Browse Categories
          </h2>
          {loading ? (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl p-3 border border-gray-100 h-20 animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/search?category=${cat.slug}`}
                  className="bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all text-center group"
                >
                  <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                    {cat.icon}
                  </div>
                  <div className="text-xs font-medium text-gray-700">
                    {cat.name}
                  </div>
                  <div className="text-xs text-gray-400">
                    {(cat.listing_count || 0).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Featured */}
        {!loading && featured.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                Featured Listings
              </h2>
              <Link
                href="/search"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {featured.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          </section>
        )}

        {/* Recent */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {!loading && recent.length === 0 ? "No listings yet" : "Recently Added"}
            </h2>
            {recent.length > 0 && (
              <Link
                href="/search"
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                View all →
              </Link>
            )}
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-xl border border-gray-100 overflow-hidden"
                >
                  <div className="aspect-[4/3] bg-gray-100 animate-pulse" />
                  <div className="p-3.5 space-y-2">
                    <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
                    <div className="h-5 bg-gray-100 rounded animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recent.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-5xl mb-4">🏪</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Be the first to post!
              </h3>
              <p className="text-gray-500 mb-4">
                The marketplace is waiting for listings
              </p>
              <Link
                href="/post"
                className="inline-flex bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
              >
                Post Your First Ad
              </Link>
            </div>
          )}
        </section>

        {/* Why NextBazar */}
        <section className="bg-white rounded-2xl border border-gray-100 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Why NextBazar?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                AI-Powered Listings
              </h3>
              <p className="text-sm text-gray-500">
                Upload photos and let AI auto-fill your listing details. Get
                smart pricing suggestions based on market data.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Trust &amp; Safety
              </h3>
              <p className="text-sm text-gray-500">
                Verified sellers, user reviews, and AI-powered spam detection
                keep the marketplace safe and trustworthy.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">
                Instant Communication
              </h3>
              <p className="text-sm text-gray-500">
                Real-time messaging, instant notifications, and secure in-app
                communication between buyers and sellers.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
