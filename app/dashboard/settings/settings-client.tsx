"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2, Save, User, Mail, Phone, FileText } from "lucide-react";

type ProfileData = {
  id: string;
  display_name: string | null;
  username: string | null;
  phone: string | null;
  bio: string | null;
  email: string;
};

export default function SettingsClient({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    display_name: profile.display_name || "",
    username: profile.username || "",
    phone: profile.phone || "",
    bio: profile.bio || "",
  });

  const update = (key: string, value: string) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    setError("");
    setSuccess(false);
    setLoading(true);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        display_name: formData.display_name || null,
        username: formData.username || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
      })
      .eq("id", profile.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setSuccess(true);
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-xl border border-red-100">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl border border-green-100">
          Profile updated!
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <User className="w-3.5 h-3.5" /> Display Name
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            placeholder="Your name"
            value={formData.display_name}
            onChange={(e) => update("display_name", e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Username
          </label>
          <input
            type="text"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            placeholder="username"
            value={formData.username}
            onChange={(e) =>
              update("username", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))
            }
          />
          <p className="text-xs text-gray-400 mt-1">
            Only lowercase letters, numbers and underscores
          </p>
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Phone className="w-3.5 h-3.5" /> Phone Number
          </label>
          <input
            type="tel"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm"
            placeholder="+357 99 123456"
            value={formData.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <FileText className="w-3.5 h-3.5" /> Bio
          </label>
          <textarea
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none text-sm h-24 resize-none"
            placeholder="Tell buyers about yourself..."
            value={formData.bio}
            onChange={(e) => update("bio", e.target.value)}
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
            <Mail className="w-3.5 h-3.5" /> Email
          </label>
          <input
            type="email"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500 cursor-not-allowed"
            value={profile.email}
            disabled
          />
          <p className="text-xs text-gray-400 mt-1">
            Contact support to change your email
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 shadow-sm shadow-blue-200"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Profile
        </button>
      </div>
    </div>
  );
}
