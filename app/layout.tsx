import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { getLocale, dir } from "@/lib/i18n";

const display = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ذِكر · GEO for AI search",
  description:
    "عملاؤك يسألون ChatGPT وPerplexity وGemini. ذِكر يقيس ظهور علامتك في إجاباتها — بالعربية والإنجليزية. Thikr measures and grows your brand's visibility inside AI answers.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} dir={dir(locale)}>
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
