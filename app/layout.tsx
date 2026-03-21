import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";
import DecorativeFrame from "@/components/DecorativeFrame";

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-cormorant'
});

export const metadata: Metadata = {
  title: "Wedding Planner",
  description: "Wedding management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-serif", cormorant.variable)}>
      <body className={`${cormorant.variable} antialiased`}>
        <DecorativeFrame>
          {children}
        </DecorativeFrame>
        <Toaster />
      </body>
    </html>
  );
}
