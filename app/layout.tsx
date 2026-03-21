import type { Metadata } from "next";
import { DM_Serif_Display, Kantumruy_Pro } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-display",
});

const kantumruy = Kantumruy_Pro({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body",
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
    <html lang="en">
      <body className={`${dmSerif.variable} ${kantumruy.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}