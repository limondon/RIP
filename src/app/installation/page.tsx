import type { Metadata } from "next";
import { InstallationBoard } from "@/components/installation-board";

export const metadata: Metadata = {
  title: "Установка — ПАМЯТЬ CRM",
};

export default function InstallationPage() {
  return <InstallationBoard />;
}
