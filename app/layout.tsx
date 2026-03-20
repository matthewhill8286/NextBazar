import type { Metadata } from "next";
import "./globals.css";
import Navbar from "./components/navbar";
import Footer from "./components/footer";
import { SavedProvider } from "@/lib/saved-context";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "NextBazar — Buy & Sell Anything in Cyprus",
  description:
    "The smarter marketplace. AI-powered search, instant messaging, and trusted sellers. Buy and sell vehicles, property, electronics, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-gray-50">
        <SavedProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SavedProvider>
      </body>
    </html>
  );
}
