import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Image Atelier — AI Image Studio",
  description: "A private-first AI image generation studio.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
