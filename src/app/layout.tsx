import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Новый заказ — ПАМЯТЬ CRM",
  description: "Создание заказа в ритуальной мастерской",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
