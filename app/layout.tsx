import type { Metadata } from "next";
import { DM_Serif_Display, Kantumruy_Pro, Geist } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${dmSerif.variable} ${kantumruy.variable} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
