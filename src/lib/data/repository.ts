import {
  addStoredDocumentForOrder,
  addStoredPaymentForOrder,
  cancelStoredInventoryReservation,
  clearCrmStorage,
  generateOrderNumber,
  getStoredClients,
  getStoredDocuments,
  getStoredDocumentsByOrderId,
  getStoredEvents,
  getStoredEventsByOrderId,
  getStoredInstallationTasks,
  getStoredInventoryAvailable,
  getStoredInventoryItems,
  getStoredInventoryMovements,
  getStoredInventoryReservations,
  getStoredOrders,
  getStoredPayments,
  getStoredProductionTasks,
  receiveStoredInventoryItem,
  reserveStoredInventoryForOrder,
  saveStoredClients,
  saveStoredDocuments,
  saveStoredEvents,
  saveStoredInstallationTasks,
  saveStoredInventoryItems,
  saveStoredInventoryMovements,
  saveStoredInventoryReservations,
  saveStoredOrders,
  saveStoredPayments,
  saveStoredProductionTasks,
  updateStoredInstallationTask,
  updateStoredOrderStatus,
  updateStoredProductionStage,
  updateStoredProductionTask,
  writeOffStoredInventoryReservation,
} from "@/lib/storage";
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

export interface CrmDataSnapshot {
  schemaVersion: 1;
  exportedAt: string;
  entities: {
    orders: Order[];
    clients: Client[];
    payments: Payment[];
    productionTasks: ProductionTask[];
    installationTasks: InstallationTask[];
    events: CrmEvent[];
    documents: Document[];
    inventoryItems: InventoryItem[];
    inventoryReservations: InventoryReservation[];
    inventoryMovements: InventoryMovement[];
  };
}

function assertArray(value: unknown, label: string) {
  if (!Array.isArray(value)) throw new Error(`Некорректный импорт: ${label} должен быть массивом`);
}

export function exportCrmData(): CrmDataSnapshot {
  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    entities: {
      orders: getStoredOrders(),
      clients: getStoredClients(),
      payments: getStoredPayments(),
      productionTasks: getStoredProductionTasks(),
      installationTasks: getStoredInstallationTasks(),
      events: getStoredEvents(),
      documents: getStoredDocuments(),
      inventoryItems: getStoredInventoryItems(),
      inventoryReservations: getStoredInventoryReservations(),
      inventoryMovements: getStoredInventoryMovements(),
    },
  };
}

export function importCrmData(snapshot: CrmDataSnapshot) {
  if (!snapshot || snapshot.schemaVersion !== 1 || !snapshot.entities) {
    throw new Error("Некорректный импорт: неподдерживаемый формат файла");
  }

  const { entities } = snapshot;
  assertArray(entities.orders, "orders");
  assertArray(entities.clients, "clients");
  assertArray(entities.payments, "payments");
  assertArray(entities.productionTasks, "productionTasks");
  assertArray(entities.installationTasks, "installationTasks");
  assertArray(entities.events, "events");
  assertArray(entities.documents, "documents");
  assertArray(entities.inventoryItems, "inventoryItems");
  assertArray(entities.inventoryReservations, "inventoryReservations");
  assertArray(entities.inventoryMovements, "inventoryMovements");

  saveStoredOrders(entities.orders);
  saveStoredClients(entities.clients);
  saveStoredPayments(entities.payments);
  saveStoredProductionTasks(entities.productionTasks);
  saveStoredInstallationTasks(entities.installationTasks);
  saveStoredEvents(entities.events);
  saveStoredDocuments(entities.documents);
  saveStoredInventoryItems(entities.inventoryItems);
  saveStoredInventoryReservations(entities.inventoryReservations);
  saveStoredInventoryMovements(entities.inventoryMovements);
}

export const crmRepository = {
  orders: {
    list: getStoredOrders,
    saveAll: saveStoredOrders,
    updateStatus: updateStoredOrderStatus,
    generateNumber: generateOrderNumber,
  },
  clients: {
    list: getStoredClients,
    saveAll: saveStoredClients,
  },
  payments: {
    list: getStoredPayments,
    saveAll: saveStoredPayments,
    addForOrder: addStoredPaymentForOrder,
  },
  production: {
    list: getStoredProductionTasks,
    saveAll: saveStoredProductionTasks,
    updateTask: updateStoredProductionTask,
    updateStage: updateStoredProductionStage,
  },
  installation: {
    list: getStoredInstallationTasks,
    saveAll: saveStoredInstallationTasks,
    updateTask: updateStoredInstallationTask,
  },
  events: {
    list: getStoredEvents,
    saveAll: saveStoredEvents,
    listByOrder: getStoredEventsByOrderId,
  },
  documents: {
    list: getStoredDocuments,
    saveAll: saveStoredDocuments,
    listByOrder: getStoredDocumentsByOrderId,
    addForOrder: addStoredDocumentForOrder,
  },
  inventory: {
    listItems: getStoredInventoryItems,
    saveItems: saveStoredInventoryItems,
    listReservations: getStoredInventoryReservations,
    saveReservations: saveStoredInventoryReservations,
    listMovements: getStoredInventoryMovements,
    saveMovements: saveStoredInventoryMovements,
    available: getStoredInventoryAvailable,
    receive: receiveStoredInventoryItem,
    reserveForOrder: reserveStoredInventoryForOrder,
    writeOffReservation: writeOffStoredInventoryReservation,
    cancelReservation: cancelStoredInventoryReservation,
  },
  system: {
    reset: clearCrmStorage,
    exportData: exportCrmData,
    importData: importCrmData,
  },
} as const;
