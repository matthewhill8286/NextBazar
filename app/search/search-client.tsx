"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X, Sparkles, Loader2 } from "lucide-react";
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
  const [aiSearching, setAiSearching] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState("");

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

    // Apply category/location filters
    if (categorySlug) {
      const cat = categories.find((c) => c.slug === categorySlug);
      if (cat) q = q.eq("category_id", cat.id);
    }
    if (locationSlug) {
      const loc = locations.find((l) => l.slug === locationSlug);
      if (loc) q = q.eq("location_id", loc.id);
    }

    // Sort
    if (sortBy === "price_low") q = q.order("price", { ascending: true });
    else if (sortBy === "price_high")
      q = q.order("price", { ascending: false });
    else if (sortBy === "popular")
      q = q.order("view_count", { ascending: false });
    else q = q.order("created_at", { ascending: false });

    if (query) {
      // Try full-text search first
      const fts = q.textSearch("search_vector", query, {
        type: "websearch",
        config: "english",
      });
      const { data } = await fts.limit(24);

      if (data && data.length > 0) {
        setListings(data);
        setLoading(false);
        return;
      }

      // Fallback: pattern match (handles partial words, acronyms, short queries)
      const fallback = supabase
        .from("listings")
        .select(`*, categories(name, slug, icon), locations(name, slug)`)
        .eq("status", "active")
        .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

      // Re-apply category/location filters on fallback
      if (categorySlug) {
        const cat = categories.find((c) => c.slug === categorySlug);
        if (cat) fallback.eq("category_id", cat.id);
      }
      if (locationSlug) {
        const loc = locations.find((l) => l.slug === locationSlug);
        if (loc) fallback.eq("location_id", loc.id);
      }

      const { data: fallbackData } = await fallback
        .order("created_at", { ascending: false })
        .limit(24);
      setListings(fallbackData || []);
    } else {
      const { data } = await q.limit(24);
      setListings(data || []);
    }
    setLoading(false);
  }, [query, categorySlug, locationSlug, sortBy, categories, locations]);

  // Debounce search — wait 300ms after user stops typing
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (categories.length === 0) return;
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      doSearch();
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [doSearch, categories]);

  async function handleAiSearch() {
    if (!query.trim()) return;
    setAiSearching(true);
    setAiInterpretation("");
    try {
      const res = await fetch("/api/ai/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setListings(data.listings || []);
      setAiInterpretation(data.interpretation || "");
      // Update filter UI to reflect AI's parsed filters
      if (data.filters.category_slug) setCategorySlug(data.filters.category_slug);
      if (data.filters.location_slug) setLocationSlug(data.filters.location_slug);
    } catch {
      // Fall back to regular search
      doSearch();
    }
    setAiSearching(false);
    setLoading(false);
  }

  function handleSearchKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAiSearch();
    }
  }

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
            className="w-full pl-12 pr-28 py-3.5 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"
            placeholder="Try: &quot;cheap car in Limassol under 10k&quot; or &quot;new iPhone&quot;"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setAiInterpretation(""); }}
            onKeyDown={handleSearchKeyDown}
            autoFocus
          />
          <div className="absolute right-2 flex items-center gap-1.5">
            <button
              onClick={handleAiSearch}
              disabled={aiSearching || !query.trim()}
              className="p-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="AI Smart Search"
            >
              {aiSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
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

      {/* AI interpretation */}
      {aiInterpretation && (
        <div className="flex items-center gap-2 bg-indigo-50 text-indigo-800 text-sm px-4 py-2.5 rounded-xl border border-indigo-100 mb-4">
          <Sparkles className="w-4 h-4 text-indigo-500 flex-shrink-0" />
          <span>{aiInterpretation}</span>
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
