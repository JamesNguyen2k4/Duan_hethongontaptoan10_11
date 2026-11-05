import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"] });

export const metadata: Metadata = {
  title: {
    default: "Hệ thống ôn tập Toán 10–11",
    template: "%s | Hệ thống ôn tập Toán 10–11",
  },
  description:
    "Nền tảng học và ôn tập Toán lớp 10, 11 theo vòng học khép kín: lý thuyết, bài tập, phân tích điểm yếu và ôn tập ngắt quãng.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className={inter.className}>{children}</body>
    </html>
  );
}

