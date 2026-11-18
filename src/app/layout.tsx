import type { Metadata } from "next";
import { Inter, Prompt } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-prompt",
});

export const metadata: Metadata = {
  title: "jenosize CRM",
  description: "AI CRM MVP for the Jenosize commercial team",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={`${inter.className} ${prompt.variable} ${inter.variable}`}>
        {children}
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1" className="nav-goo" aria-hidden="true">
          <defs>
            <filter id="goo-tone">
              <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
              <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 21 -7" result="goo" />
              <feBlend in="SourceGraphic" in2="goo" result="mix" />
            </filter>
          </defs>
        </svg>
      </body>
    </html>
  );
}
