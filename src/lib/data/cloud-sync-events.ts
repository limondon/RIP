export const CLOUD_MUTATION_EVENT = "pamyat-crm-cloud-mutation";

export const crmCloudTables = [
  "clients",
  "orders",
  "payments",
  "production_tasks",
  "installation_tasks",
  "crm_events",
  "documents",
  "inventory_items",
  "inventory_reservations",
  "inventory_movements",
] as const;

export type CrmCloudTable = (typeof crmCloudTables)[number];
export type CrmCloudRow = Record<string, unknown> & { id: string };

export interface CrmCloudMutation {
  table: CrmCloudTable;
  upserts: CrmCloudRow[];
  deletes: string[];
}

export function createCloudMutation(
  table: CrmCloudTable,
  previousRows: CrmCloudRow[],
  nextRows: CrmCloudRow[],
): CrmCloudMutation | null {
  const previousById = new Map(previousRows.map((row) => [row.id, row]));
  const nextIds = new Set(nextRows.map((row) => row.id));
  const upserts = nextRows.filter((row) => JSON.stringify(previousById.get(row.id)) !== JSON.stringify(row));
  const deletes = previousRows.filter((row) => !nextIds.has(row.id)).map((row) => row.id);

  return upserts.length || deletes.length ? { table, upserts, deletes } : null;
}
