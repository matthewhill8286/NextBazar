"use client";

import { Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Props = {
  listingId: string;
  /** Pass userId from the parent to skip the per-button auth fetch */
  userId?: string | null;
  /** Pass the pre-fetched saved state so the button needs no network call on mount */
  initialSaved?: boolean;
  /** Called after a successful toggle with the new saved state */
  onToggle?: (saved: boolean) => void;
};

export default function FavoriteButton({ listingId, userId: userIdProp, initialSaved, onToggle }: Props) {
  const supabase = createClient();
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [userId, setUserId] = useState<string | null>(userIdProp ?? null);
  const [animating, setAnimating] = useState(false);

  // Only run the self-contained auth + favorites check when the parent hasn't
  // provided userId/initialSaved props (e.g. on listing detail page).
  useEffect(() => {
    if (userIdProp !== undefined) return; // parent already handled this
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
  }, [listingId, userIdProp]);

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

      try { await supabase.rpc("decrement_favorite_count", { lid: listingId }); } catch {}
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: userId, listing_id: listingId });

      try { await supabase.rpc("increment_favorite_count", { lid: listingId }); } catch {}
    }

    const next = !saved;
    setSaved(next);
    onToggle?.(next);
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
