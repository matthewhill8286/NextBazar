import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CategoryGrid() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order");

  if (!categories || categories.length === 0) return null;

  return (
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
          <div className="text-xs font-medium text-gray-700">{cat.name}</div>
          <div className="text-xs text-gray-400">
            {(cat.listing_count || 0).toLocaleString()}
          </div>
        </Link>
      ))}
    </div>
  );
}
