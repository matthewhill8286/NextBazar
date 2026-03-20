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
  Pin,
  PinOff,
  Trash2,
  MoreHorizontal,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Message = {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at: string | null;
  is_pinned: boolean;
  deleted_at: string | null;
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
  const [activeMenu, setActiveMenu] = useState<string | null>(null); // message id with open menu
  const [pinnedExpanded, setPinnedExpanded] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [deletingConv, setDeletingConv] = useState(false);

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

      const { data: msgs } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at, read_at, is_pinned, deleted_at")
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

  // Subscribe to new messages and updates in real-time
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
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id !== userId) {
            supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", newMsg.id)
              .then();
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)),
          );
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

  // Close context menu on outside click
  useEffect(() => {
    function close() { setActiveMenu(null); }
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !userId || sending) return;
    setSending(true);

    const content = newMessage.trim();
    setNewMessage("");

    const optimistic: Message = {
      id: `temp-${Date.now()}`,
      sender_id: userId,
      content,
      created_at: new Date().toISOString(),
      read_at: null,
      is_pinned: false,
      deleted_at: null,
    };
    setMessages((prev) => [...prev, optimistic]);

    setSendError(false);
    const { data: inserted, error: insertErr } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: userId, content })
      .select("id, sender_id, content, created_at, read_at, is_pinned, deleted_at")
      .single();

    if (inserted) {
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? inserted : m)),
      );
      // Update conversation preview
      await supabase
        .from("conversations")
        .update({
          last_message_at: new Date().toISOString(),
          last_message_preview: content.slice(0, 100),
        })
        .eq("id", conversationId);
    } else {
      // Insert failed — remove optimistic message and surface the error
      console.error("Message send failed:", insertErr);
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setNewMessage(content); // restore text
      setSendError(true);
    }

    setSending(false);
    inputRef.current?.focus();
  }, [newMessage, userId, sending, conversationId]);

  async function handlePin(msg: Message) {
    setActiveMenu(null);
    const next = !msg.is_pinned;
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, is_pinned: next } : m)),
    );
    await supabase
      .from("messages")
      .update({ is_pinned: next })
      .eq("id", msg.id);
  }

  async function handleDeleteConversation() {
    if (!confirm("Delete this entire conversation? This cannot be undone.")) return;
    setDeletingConv(true);
    await supabase.from("conversations").delete().eq("id", conversationId);
    router.push("/messages");
  }

  async function handleDelete(msg: Message) {
    setActiveMenu(null);
    if (!confirm("Delete this message? It will be removed for everyone.")) return;
    const now = new Date().toISOString();
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => (m.id === msg.id ? { ...m, deleted_at: now } : m)),
    );
    await supabase
      .from("messages")
      .update({ deleted_at: now })
      .eq("id", msg.id);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }

  function formatDate(d: string) {
    const date = new Date(d);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Today";
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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
    conversation.buyer_id === userId ? conversation.seller : conversation.buyer;
  const listing = conversation.listings;

  const initials =
    otherUser?.display_name
      ?.split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?";

  const pinnedMessages = messages.filter((m) => m.is_pinned && !m.deleted_at);

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
            <img src={otherUser.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-gray-900 text-sm truncate">
              {otherUser?.display_name || "User"}
            </span>
            {otherUser?.verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
          </div>
          {listing?.title && (
            <Link href={`/listing/${listing.slug}`} className="text-xs text-blue-600 hover:underline truncate block">
              {listing.title}
            </Link>
          )}
        </div>
        {listing?.primary_image_url && (
          <Link
            href={`/listing/${listing.slug}`}
            className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 relative hover:opacity-80 transition-opacity"
          >
            <Image src={listing.primary_image_url} alt="" fill className="object-cover" sizes="40px" />
          </Link>
        )}
        <button
          onClick={handleDeleteConversation}
          disabled={deletingConv}
          title="Delete conversation"
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Listing info bar */}
      {listing && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2.5 flex items-center gap-3 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-800 font-medium truncate">{listing.title}</p>
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

      {/* Pinned messages banner */}
      {pinnedMessages.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-100 px-4 py-2 flex-shrink-0">
          <button
            onClick={() => setPinnedExpanded((v) => !v)}
            className="w-full text-left"
          >
            <div className="flex items-center gap-2">
              <Pin className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span className="text-xs font-semibold text-amber-800">
                {pinnedMessages.length} pinned {pinnedMessages.length === 1 ? "message" : "messages"}
              </span>
              <span className="text-xs text-amber-600 ml-auto">
                {pinnedExpanded ? "Hide" : "Show"}
              </span>
            </div>
            {pinnedExpanded && (
              <div className="mt-2 space-y-1.5">
                {pinnedMessages.map((pm) => (
                  <div key={pm.id} className="bg-white rounded-lg px-3 py-2 border border-amber-100 text-xs text-gray-700 line-clamp-2">
                    {pm.content}
                  </div>
                ))}
              </div>
            )}
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 && (
          <div className="text-center py-12 text-gray-400 text-sm">
            Start the conversation by sending a message
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userId;
          const isDeleted = !!msg.deleted_at;
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

              {/* Pinned indicator */}
              {msg.is_pinned && !isDeleted && (
                <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-0.5`}>
                  <span className="flex items-center gap-1 text-[10px] text-amber-600 font-medium">
                    <Pin className="w-2.5 h-2.5" /> Pinned
                  </span>
                </div>
              )}

              <div className={`flex ${isMe ? "justify-end" : "justify-start"} mb-1 group`}>
                {/* Actions menu — appears on hover */}
                {!isDeleted && (
                  <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? "order-first mr-1.5" : "order-last ml-1.5"}`}>
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu(activeMenu === msg.id ? null : msg.id);
                        }}
                        className="p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>

                      {activeMenu === msg.id && (
                        <div
                          className={`absolute bottom-full mb-1 z-20 bg-white border border-gray-100 rounded-xl shadow-lg py-1 min-w-[140px] ${isMe ? "right-0" : "left-0"}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handlePin(msg)}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {msg.is_pinned ? (
                              <><PinOff className="w-3.5 h-3.5 text-amber-500" /> Unpin</>
                            ) : (
                              <><Pin className="w-3.5 h-3.5 text-amber-500" /> Pin message</>
                            )}
                          </button>
                          {isMe && (
                            <button
                              onClick={() => handleDelete(msg)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isDeleted
                      ? "bg-gray-100 text-gray-400 italic border border-gray-200"
                      : isMe
                        ? `bg-blue-600 text-white rounded-br-md ${msg.is_pinned ? "ring-2 ring-amber-400 ring-offset-1" : ""}`
                        : `bg-white border border-gray-100 text-gray-900 rounded-bl-md ${msg.is_pinned ? "ring-2 ring-amber-400 ring-offset-1" : ""}`
                  }`}
                >
                  {isDeleted ? (
                    <p className="flex items-center gap-1.5">
                      <X className="w-3 h-3" /> Message deleted
                    </p>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                  {!isDeleted && (
                    <p className={`text-[10px] mt-1 ${isMe ? "text-blue-200" : "text-gray-400"}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Send error banner */}
      {sendError && (
        <div className="bg-red-50 border-t border-red-100 px-4 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-xs text-red-600">Message failed to send. Please try again.</span>
          <button onClick={() => setSendError(false)} className="text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

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
            {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
