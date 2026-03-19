"use client";

import { useState } from "react";
import { Heart, Share2, Flag, Check, Link as LinkIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function FavoriteAction({ listingId }: { listingId: string }) {
  const [saved, setSaved] = useState(false);
  const [animating, setAnimating] = useState(false);
  const supabase = createClient();

  async function toggle() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = `/auth/login?redirect=/listing/${listingId}`;
      return;
    }

    setAnimating(true);
    if (saved) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("listing_id", listingId);
    } else {
      await supabase
        .from("favorites")
        .insert({ user_id: user.id, listing_id: listingId });
    }
    setSaved(!saved);
    setTimeout(() => setAnimating(false), 300);
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
        saved
          ? "bg-red-50 border-red-200 text-red-600"
          : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
      }`}
    >
      <Heart
        className={`w-4 h-4 transition-transform ${animating ? "scale-125" : ""} ${saved ? "fill-red-500 text-red-500" : ""}`}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
}

export function ShareAction({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/listing/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-500" /> Copied!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" /> Share
        </>
      )}
    </button>
  );
}

export function ReportAction({ listingId }: { listingId: string }) {
  const [reported, setReported] = useState(false);

  return (
    <button
      onClick={() => setReported(true)}
      disabled={reported}
      className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition-colors disabled:text-gray-300"
    >
      <Flag className="w-3 h-3" />
      {reported ? "Reported" : "Report"}
    </button>
  );
}

export function ContactButtons({
  listingId,
  sellerId,
}: {
  listingId: string;
  sellerId: string;
}) {
  const [phoneVisible, setPhoneVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleMessage() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/auth/login?redirect=" + window.location.pathname;
      return;
    }

    if (user.id === sellerId) {
      // Can't message yourself
      setLoading(false);
      return;
    }

    // Check if conversation already exists for this listing + buyer
    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("listing_id", listingId)
      .eq("buyer_id", user.id)
      .eq("seller_id", sellerId)
      .maybeSingle();

    if (existing) {
      window.location.href = `/messages/${existing.id}`;
      return;
    }

    // Create new conversation
    const { data: newConv } = await supabase
      .from("conversations")
      .insert({
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
      })
      .select("id")
      .single();

    if (newConv) {
      window.location.href = `/messages/${newConv.id}`;
    }
    setLoading(false);
  }

  return (
    <div className="space-y-2.5">
      <button
        onClick={handleMessage}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-sm shadow-blue-200 disabled:opacity-50"
      >
        {loading ? (
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
        Send Message
      </button>
      <button
        onClick={() => setPhoneVisible(true)}
        className="w-full bg-green-600 text-white py-3.5 rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
        {phoneVisible ? "+357 99 ••• •••" : "Show Phone Number"}
      </button>
    </div>
  );
}
