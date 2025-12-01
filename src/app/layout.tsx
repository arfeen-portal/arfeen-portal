import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { LanguageProvider } from "@/context/LanguageContext";

export const metadata: Metadata = {
  title: "Arfeen Travel Portal",
  description: "B2B/B2C Umrah & Tourism Portal",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
