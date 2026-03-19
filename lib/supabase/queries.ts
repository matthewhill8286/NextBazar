import { createClient } from "./server";

export async function getCategories() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getLocations() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("locations")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data;
}

export async function getFeaturedListings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(display_name, avatar_url, verified, rating, total_reviews)
    `,
    )
    .eq("status", "active")
    .eq("is_promoted", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data;
}

export async function getRecentListings(limit = 8) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(display_name, avatar_url, verified, rating, total_reviews)
    `,
    )
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function getListingBySlug(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(id, display_name, avatar_url, verified, rating, total_reviews, is_dealer, created_at),
      images:listing_images(id, url, thumbnail_url, sort_order)
    `,
    )
    .eq("slug", slug)
    .single();
  if (error) throw error;
  return data;
}

export async function searchListings({
  query,
  category,
  location,
  sort = "newest",
  limit = 24,
}: {
  query?: string;
  category?: string;
  location?: string;
  sort?: string;
  limit?: number;
}) {
  const supabase = await createClient();
  let q = supabase
    .from("listings")
    .select(
      `
      *,
      category:categories(name, slug, icon),
      location:locations(name, slug),
      profile:profiles(display_name, avatar_url, verified)
    `,
    )
    .eq("status", "active");

  if (query) {
    q = q.textSearch("search_vector", query, {
      type: "websearch",
      config: "english",
    });
  }

  if (category) {
    q = q.eq("category.slug", category);
  }

  if (location) {
    q = q.eq("location.slug", location);
  }

  if (sort === "price_low") q = q.order("price", { ascending: true });
  else if (sort === "price_high") q = q.order("price", { ascending: false });
  else if (sort === "popular") q = q.order("view_count", { ascending: false });
  else q = q.order("created_at", { ascending: false });

  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return data;
}

export async function incrementViewCount(listingId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_view_count", { listing_id: listingId });
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return { ...user, profile };
}
