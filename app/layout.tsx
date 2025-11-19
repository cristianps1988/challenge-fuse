import type { Metadata } from "next";
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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
