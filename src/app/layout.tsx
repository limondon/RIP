import type { Metadata } from "next";
import "./globals.css";
import { CloudDataProvider } from "@/components/cloud-data-provider";

export const metadata: Metadata = {
  title: "ПАМЯТЬ CRM",
  description: "Рабочая CRM для памятников, заказов, производства, склада и финансов",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body><CloudDataProvider>{children}</CloudDataProvider></body>
    </html>
  );
}
