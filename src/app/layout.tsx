import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "회의록 AI 분석 — 전북특별자치도의회",
  description: "AI 기반 회의록 자동 요약·분석 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: '-apple-system, "Pretendard", "Noto Sans KR", system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
