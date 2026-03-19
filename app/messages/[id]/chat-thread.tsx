"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Send,
  Loader2,
  Shield,
  ExternalLink,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
};

export default function ChatThread({
  conversationId,
}: {
  conversationId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load conversation & messages
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

      // Fetch conversation with participants and listing
      const { data: conv } = await supabase
        .from("conversations")
        .select(
          `
          *,
          listings(id, title, slug, primary_image_url, price, currency),
          buyer:profiles!conversations_buyer_id_fkey(id, display_name, avatar_url, verified),
          seller:profiles!conversations_seller_id_fkey(id, display_name, avatar_url, verified)
        `,
        )
        .eq("id", conversationId)
        .single();

      if (!conv) {
        router.push("/messages");
        return;
      }
      setConversation(conv);

      // Fetch messages
      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      setMessages(msgs || []);

      // Mark unread messages as read
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("conversation_id", conversationId)
        .neq("sender_id", user.id)
        .is("read_at", null);

      setLoading(false);
    }
    load();
  }, [conversationId]);

  // Subscribe to new messages in real-time
  useEffect(() => {
    if (!conversationId || !userId) return;

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if it's not from us
          if (newMsg.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, userId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !userId || sending) return;
    setSending(true);

    const content = newMessage.trim();
    setNewMessage("");

    // Optimistic insert
    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    // Insert into DB
    const { data: inserted } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        content,
      })
      .select()
      .single();

    // Replace optimistic message with real one
    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? inserted : m)),
      );
    }

    // Update conversation preview
    await supabase
      .from("conversations")
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.slice(0, 100),
      })
      .eq("id", conversationId);

    setSending(false);
    inputRef.current?.focus();
  }, [newMessage, userId, sending, conversationId]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function formatDate(d: string) {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!conversation) return null;

  const otherUser =
    conversation.buyer_id === userId
      ? conversation.seller
      : conversation.buyer;
  const listing = conversation.listings;

  const initials =
    otherUser?.display_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  // Group messages by date
  let lastDate = "";

  return (
    <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
        <Link
          href="/messages"
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center text-white font-semibold text-xs flex-shrink-0">
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
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {otherUser?.display_name || "User"}
            </span>
            {otherUser?.verified && (
              <Shield className="w-3.5 h-3.5 text-blue-500" />
            )}
          </div>
          {listing?.title && (
            <Link
              href={`/listing/${listing.slug}`}
              className="text-xs text-blue-600 hover:underline truncate block"
            >
              {listing.title}
            </Link>
          )}
        </div>

        {/* Listing thumbnail */}
        {listing?.primary_image_url && (
          <Link
            href={`/listing/${listing.slug}`}
            className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative hover:opacity-80 transition-opacity"
          >
            <Image
              src={listing.primary_image_url}
              alt=""
              fill
              className="object-cover"
              sizes="40px"
            />
          </Link>
        )}
      </div>

      {/* Listing info bar */}
      {listing && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-800 font-medium truncate">
              {listing.title}
            </p>
            <p className="text-xs text-blue-600">
              {listing.price
                ? `${listing.currency === "EUR" ? "€" : listing.currency}${listing.price.toLocaleString()}`
                : "Contact for price"}
            </p>
          </div>
          <Link
            href={`/listing/${listing.slug}`}
            className="text-xs text-blue-600 font-medium hover:underline flex items-center gap-1 flex-shrink-0"
          >
            View <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Start the conversation by sending a message
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === userId;
          const msgDate = formatDate(msg.created_at);
          let showDate = false;
          if (msgDate !== lastDate) {
            showDate = true;
            lastDate = msgDate;
          }

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex justify-center my-4">
                  <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {msgDate}
                  </span>
                </div>
              )}
              <div
                className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-md"
                      : "bg-white border border-gray-100 text-gray-900 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  <p
                    className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm resize-none max-h-32"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
