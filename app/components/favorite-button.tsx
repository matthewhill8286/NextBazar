"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FavoriteButton({ listingId }: { listingId: string }) {
  const supabase = createClient();
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    async function check() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data } = await supabase
        .from("favorites")
        .select("listing_id")
        .eq("user_id", user.id)
        .eq("listing_id", listingId)
        .maybeSingle();

      if (data) setSaved(true);
    }
    check();
  }, [listingId]);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      window.location.href = "/auth/login";
      return;
    }

    setAnimating(true);

    if (saved) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("listing_id", listingId);

      // Decrement favorite_count
      try { await supabase.rpc("decrement_favorite_count", { lid: listingId }); } catch {}
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: userId, listing_id: listingId });

      // Increment favorite_count
      try { await supabase.rpc("increment_favorite_count", { lid: listingId }); } catch {}
    }

    setSaved(!saved);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <button
      className="absolute top-2.5 right-2.5 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-colors z-10"
      onClick={toggle}
    >
      <Heart
        className={`w-4 h-4 transition-transform ${animating ? "scale-125" : ""} ${
          saved ? "text-red-500 fill-red-500" : "text-gray-600"
        }`}
      />
    </button>
  );
}
