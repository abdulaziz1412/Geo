import type { Metadata } from "next";
import { Cairo,  } from "next/font/google";
import "./globals.css";

const display = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "ذِكر — كن أنت الإجابة في محرّكات الذكاء الاصطناعي",
  description:
    "عملاؤك يسألون ChatGPT وPerplexity وGemini بدل البحث في جوجل. ذِكر يقيس ظهور علامتك في إجاباتها بالعربية ويُريك كيف تصبح الإجابة المُوصى بها.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${display.variable} ${body.variable}`}>{children}</body>
    </html>
  );
}
