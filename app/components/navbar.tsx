"use client";

import { Heart, MessageCircle, Plus, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import UserMenu from "./user-menu";

export default function Navbar() {
  const _pathname = usePathname();
  const supabase = createClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    async function loadCounts() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Count unread messages aren't sent by me
      const { count: msgCount } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .neq("sender_id", user.id)
        .is("read_at", null);

      setUnreadCount(msgCount || 0);

      // Count saved/favorited listings (PK is user_id+listing_id, no id column)
      const { count: favCount } = await supabase
        .from("favorites")
        .select("user_id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setSavedCount(favCount || 0);
    }
    loadCounts();

    // Listen for new messages
    const channel = supabase
      .channel("nav-unread")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => loadCounts(),
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => loadCounts(),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "favorites" },
        () => loadCounts(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "favorites" },
        () => loadCounts(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    supabase.from,
    supabase.channel,
    supabase.auth.getUser,
    supabase.removeChannel,
  ]);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-200">
            N
          </div>
          <span className="font-bold text-xl text-gray-900 hidden sm:block tracking-tight">
            NextBazar
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <Link href="/search" className="block">
            <div className="relative flex items-center">
              <Search className="absolute left-3.5 text-gray-400 w-4 h-4" />
              <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-400 hover:border-gray-300 hover:bg-white transition-colors cursor-pointer">
                Search thousands of listings...
              </div>
            </div>
          </Link>
        </div>

        {/* Desktop Nav */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link
            href="/search"
            className="md:hidden p-2.5 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
          >
            <Search className="w-5 h-5" />
          </Link>

          <Link
            href="/saved"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <Heart className="w-4 h-4" />
            <span className="hidden lg:inline">Saved</span>
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                {savedCount > 99 ? "99+" : savedCount}
              </span>
            )}
          </Link>

          <Link
            href="/messages"
            className="hidden sm:flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors relative"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden lg:inline">Messages</span>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] flex items-center justify-center rounded-full">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/post"
            className="bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center gap-1.5 shadow-sm shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Post Ad</span>
          </Link>

          <UserMenu />
        </div>
      </div>
    </nav>
  );
}
