import type { Metadata } from "next";
import { ProductionBoard } from "@/components/production-board";

export const metadata: Metadata = {
  title: "Производство — ПАМЯТЬ CRM",
};

export default function ProductionPage() {
  return <ProductionBoard />;
}
