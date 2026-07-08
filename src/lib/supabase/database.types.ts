import type {
  Client,
  CrmEvent,
  Document,
  InstallationTask,
  InventoryItem,
  InventoryMovement,
  InventoryReservation,
  Order,
  Payment,
  ProductionTask,
} from "@/types/crm";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      staff_profiles: {
        Row: { id: string; email: string; full_name: string; short_name: string; phone: string; active: boolean; created_at: string };
        Insert: { id: string; email: string; full_name: string; short_name: string; phone?: string; active?: boolean; created_at?: string };
        Update: Partial<{ email: string; full_name: string; short_name: string; phone: string; active: boolean; created_at: string }>;
        Relationships: [];
      };
      clients: {
        Row: Client & { created_at: string; updated_at: string };
        Insert: Client & { created_at?: string; updated_at?: string };
        Update: Partial<Client & { created_at: string; updated_at: string }>;
        Relationships: [];
      };
      orders: {
        Row: Order & { created_at: string; updated_at: string };
        Insert: Order & { created_at?: string; updated_at?: string };
        Update: Partial<Order & { created_at: string; updated_at: string }>;
        Relationships: [];
      };
      payments: {
        Row: Payment & { created_at: string };
        Insert: Payment & { created_at?: string };
        Update: Partial<Payment & { created_at: string }>;
        Relationships: [];
      };
      crm_events: {
        Row: CrmEvent;
        Insert: CrmEvent;
        Update: Partial<CrmEvent>;
        Relationships: [];
      };
      production_tasks: {
        Row: ProductionTask;
        Insert: ProductionTask;
        Update: Partial<ProductionTask>;
        Relationships: [];
      };
      installation_tasks: {
        Row: InstallationTask;
        Insert: InstallationTask;
        Update: Partial<InstallationTask>;
        Relationships: [];
      };
      documents: {
        Row: Document & { created_at: string };
        Insert: Document & { created_at?: string };
        Update: Partial<Document & { created_at: string }>;
        Relationships: [];
      };
      inventory_items: {
        Row: InventoryItem & { created_at: string; updated_at: string };
        Insert: InventoryItem & { created_at?: string; updated_at?: string };
        Update: Partial<InventoryItem & { created_at: string; updated_at: string }>;
        Relationships: [];
      };
      inventory_reservations: {
        Row: InventoryReservation;
        Insert: InventoryReservation;
        Update: Partial<InventoryReservation>;
        Relationships: [];
      };
      inventory_movements: {
        Row: InventoryMovement;
        Insert: InventoryMovement;
        Update: Partial<InventoryMovement>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
