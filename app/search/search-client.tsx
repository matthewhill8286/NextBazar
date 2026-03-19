"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ListingCard from "@/app/components/listing-card";

type Category = { id: string; name: string; slug: string; icon: string };
type Location = { id: string; name: string; slug: string };

export default function SearchClient() {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category") || "";
  const initialQuery = searchParams.get("q") || "";

  const supabase = createClient();

  const [query, setQuery] = useState(initialQuery);
  const [categorySlug, setCategorySlug] = useState(initialCategory);
  const [locationSlug, setLocationSlug] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  // Load categories & locations once
  useEffect(() => {
    async function loadMeta() {
      const [{ data: cats }, { data: locs }] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug, icon")
          .order("sort_order"),
        supabase.from("locations").select("id, name, slug").order("sort_order"),
      ]);
      if (cats) setCategories(cats);
      if (locs) setLocations(locs);
    }
    loadMeta();
  }, []);

  const doSearch = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("listings")
      .select(
        `*, categories(name, slug, icon), locations(name, slug)`,
      )
      .eq("status", "active");

    if (query) {
      q = q.textSearch("search_vector", query, {
        type: "websearch",
        config: "english",
      });
    }

    if (categorySlug) {
      // Get category ID from slug
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) {
        q = q.eq("category_id", cat.id);
      }
    }

    if (locationSlug) {
      const loc = locations.find((l) => l.slug === locationSlug);
      if (loc) {
        q = q.eq("location_id", loc.id);
      }
    }

    if (sortBy === "price_low") q = q.order("price", { ascending: true });
    else if (sortBy === "price_high")
      q = q.order("price", { ascending: false });
    else if (sortBy === "popular")
      q = q.order("view_count", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    const { data } = await q.limit(24);
    setListings(data || []);
    setLoading(false);
  }, [query, categorySlug, locationSlug, sortBy, categories, locations]);

  useEffect(() => {
    if (categories.length > 0) {
      doSearch();
    }
  }, [doSearch, categories]);

  const activeCategory = categories.find((c) => c.slug === categorySlug);
  const hasFilters = query || categorySlug || locationSlug;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative flex items-center">
          <Search className="absolute left-4 text-gray-400 w-5 h-5" />
          <input
            type="text"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            placeholder="Search listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="absolute right-2 p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Category
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400"
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.slug}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Location
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400"
              value={locationSlug}
              onChange={(e) => setLocationSlug(e.target.value)}
            >
              <option value="">All Locations</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.slug}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Sort By
            </label>
            <select
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm bg-white outline-none focus:border-blue-400"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="price_low">Price: Low → High</option>
              <option value="price_high">Price: High → Low</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      )}

      {hasFilters && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {activeCategory && (
            <button
              onClick={() => setCategorySlug("")}
              className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {activeCategory.icon} {activeCategory.name}
              <X className="w-3 h-3" />
            </button>
          )}
          {query && (
            <button
              onClick={() => setQuery("")}
              className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              &ldquo;{query}&rdquo;
              <X className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => {
              setQuery("");
              setCategorySlug("");
              setLocationSlug("");
            }}
            className="text-sm text-gray-400 hover:text-gray-600 ml-1"
          >
            Clear all
          </button>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{listings.length}</span>{" "}
          listings found
        </p>
        {!showFilters && (
          <select
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 outline-none focus:border-blue-400 bg-white"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="price_low">Price: Low → High</option>
            <option value="price_high">Price: High → Low</option>
            <option value="popular">Most Popular</option>
          </select>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
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
      ) : listings.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {listings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No listings found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setQuery("");
              setCategorySlug("");
              setLocationSlug("");
            }}
            className="text-blue-600 font-medium hover:underline"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
