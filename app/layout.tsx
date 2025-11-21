import type { Metadata } from "next";
import { Navigation } from "@/frontend/components/Navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fuse Finance - Document Processing",
  description: "AI-powered document classification and extraction for loan origination",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-gray-50" suppressHydrationWarning>
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
