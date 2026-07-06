import type { Metadata } from "next";
import { SettingsDashboard } from "@/components/settings-dashboard";

export const metadata: Metadata = {
  title: "Настройки — ПАМЯТЬ CRM",
  description: "Пользователи, справочники и параметры CRM",
};

export default function SettingsPage() {
  return <SettingsDashboard />;
}
