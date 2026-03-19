"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { MessageCircle, Loader2, Search } from "lucide-react";

export default function MessagesPage() {
  const router = useRouter();
  const supabase = createClient();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth/login?redirect=/messages");
        return;
      }
      setUserId(user.id);

      const { data } = await supabase
        .from("conversations")
        .select(
          `
          *,
          listings(id, title, slug, primary_image_url),
          buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url),
          seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url)
        `,
        )
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      setConversations(data || []);
      setLoading(false);
    }
    load();
  }, []);

  // Subscribe to new conversations
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel("conversations-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `buyer_id=eq.${userId}`,
        },
        () => {
          // Refresh conversations list
          window.location.reload();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
          filter: `seller_id=eq.${userId}`,
        },
        () => {
          window.location.reload();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  function timeAgo(d: string | null) {
    if (!d) return "";
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "now";
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  }

  const filtered = conversations.filter((c) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const otherUser =
      c.buyer_id === userId ? c.seller : c.buyer;
    return (
      otherUser?.display_name?.toLowerCase().includes(q) ||
      c.listings?.title?.toLowerCase().includes(q) ||
      c.last_message_preview?.toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      {conversations.length > 0 && (
        <div className="relative mb-4">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          {filtered.map((conv) => {
            const otherUser =
              conv.buyer_id === userId ? conv.seller : conv.buyer;
            const initials =
              otherUser?.display_name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2) || "?";

            return (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-3.5 p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {otherUser?.avatar_url ? (
                    <img
                      src={otherUser.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    initials
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {otherUser?.display_name || "User"}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {timeAgo(conv.last_message_at)}
                    </span>
                  </div>
                  {conv.listings?.title && (
                    <p className="text-xs text-blue-600 truncate mb-0.5">
                      Re: {conv.listings.title}
                    </p>
                  )}
                  <p className="text-sm text-gray-500 truncate">
                    {conv.last_message_preview || "No messages yet"}
                  </p>
                </div>

                {/* Listing thumbnail */}
                {conv.listings?.primary_image_url && (
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative">
                    <Image
                      src={conv.listings.primary_image_url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="40px"
                    />
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-gray-100">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            No messages yet
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            When you contact a seller or someone messages you, it&apos;ll appear here
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
