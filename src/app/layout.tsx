import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ПАМЯТЬ CRM",
  description: "Рабочая CRM для памятников, заказов, производства, склада и финансов",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
