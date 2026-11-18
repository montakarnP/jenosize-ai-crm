import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "jenosize CRM",
  description: "AI CRM MVP for the Jenosize commercial team",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} ${prompt.variable} ${inter.variable}`}>{children}</body>
    </html>
  );
}
