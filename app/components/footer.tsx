import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
              N
            </div>
            <span className="font-bold text-gray-900">NextBazar</span>
            <span className="text-xs text-gray-400">&copy; 2026</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/" className="hover:text-gray-700">
              About
            </Link>
            <Link href="/" className="hover:text-gray-700">
              Safety Tips
            </Link>
            <Link href="/" className="hover:text-gray-700">
              For Dealers
            </Link>
            <Link href="/" className="hover:text-gray-700">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
