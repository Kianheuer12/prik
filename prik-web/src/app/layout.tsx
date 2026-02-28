import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { ConvexClientProvider } from "./convex-provider";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Prik",
  description: "Track your glucose, your way.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prik",
  },
};

export const viewport: Viewport = {
  themeColor: "#2E86AB",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className="bg-slate-50 text-slate-900 antialiased">
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
