"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";

function SuccessContent() {
  const searchParams = useSearchParams();
  const listingId = searchParams.get("listing_id");

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Payment Successful!
        </h1>
        <p className="text-gray-500 mb-8">
          Your listing has been promoted and will appear at the top of search
          results. It may take a moment to activate.
        </p>

        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-100 mb-8">
          <div className="flex items-center justify-center gap-2 text-amber-800 font-medium">
            <Sparkles className="w-4 h-4" />
            Your promotion is now active
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {listingId && (
            <Link
              href={`/dashboard/listings`}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              View My Listings <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <Link
            href="/"
            className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PromoteSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
