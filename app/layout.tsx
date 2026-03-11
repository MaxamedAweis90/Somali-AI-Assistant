import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Garas",
  description: "Somali AI Assistant",
  icons: {
    icon: "/images/GARAS.png",
    shortcut: "/images/GARAS.png",
    apple: "/images/GARAS.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="so" className={cn("dark", "font-sans", geist.variable)}>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
