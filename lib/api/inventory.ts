/**
 * Vendor Portal Phase 2 #8.1 — Inventory tracker API.
 *
 * Mirrors backend at /api/v1/inventory. Items hold current stock;
 * movements are the immutable ledger. Stock changes ONLY via movement
 * create — direct item update refuses to touch currentStock.
 */

import axiosInstance from "@/lib/axiosConfig";

export type InventoryCategory =
  | "ingredient"
  | "rental"
  | "equipment"
  | "consumable"
  | "linen"
  | "stationery"
  | "other";

export type InventoryUnit =
  | "piece"
  | "dozen"
  | "pair"
  | "set"
  | "kg"
  | "gram"
  | "litre"
  | "ml"
  | "metre"
  | "bottle"
  | "packet"
  | "tray"
  | "thaal"
  | "tola"
  | "box"
  | "roll"
  | "other";

export type MovementType =
  | "restock"
  | "consumed"
  | "wastage"
  | "transfer_out"
  | "transfer_in"
  | "adjustment";

export interface InventoryBusinessInfo {
  id: number;
  name: string | null;
}

export interface InventoryUserInfo {
  id: number;
  fullName: string | null;
  email: string | null;
}

export interface InventoryBookingInfo {
  id: number;
  bookingDate: string | null;
  status: string | null;
}

export interface InventoryMovement {
  id: number;
  inventoryItemId: number;
  businessId: number;
  createdByUserId: number;
  type: MovementType;
  quantity: number | string;
  stockBefore: number | string;
  stockAfter: number | string;
  bookingId: number | null;
  supplierName: string | null;
  costPerUnit: number | string | null;
  totalCost: number | string | null;
  reason: string | null;
  notes: string | null;
  photoUrl: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  item?: {
    id: number;
    name: string;
    unit: InventoryUnit;
    category: InventoryCategory;
  } | null;
  booking?: InventoryBookingInfo | null;
}

export interface InventoryItem {
  id: number;
  businessId: number;
  createdByUserId: number;
  name: string;
  category: InventoryCategory;
  unit: InventoryUnit;
  sku: string | null;
  notes: string | null;
  photoUrl: string | null;
  currentStock: number | string;
  lowStockThreshold: number | string;
  reorderLeadTimeDays: number | null;
  lastRestockCostPerUnit: number | string | null;
  lastRestockAt: string | null;
  defaultSupplierName: string | null;
  createdAt: string;
  updatedAt: string;
  business?: InventoryBusinessInfo | null;
  createdBy?: InventoryUserInfo | null;
  movements?: InventoryMovement[];
}

export interface InventorySummary {
  byCategory: Partial<Record<InventoryCategory, number>>;
  totalStockValue: number;
  lowStockCount: number;
}

export interface InventoryListResponse {
  items: InventoryItem[];
  summary: InventorySummary;
}

export interface CreateItemInput {
  businessId: number;
  name: string;
  category?: InventoryCategory;
  unit?: InventoryUnit;
  sku?: string;
  notes?: string;
  photoUrl?: string;
  currentStock?: number;
  lowStockThreshold?: number;
  reorderLeadTimeDays?: number;
  lastRestockCostPerUnit?: number;
  defaultSupplierName?: string;
}

export interface UpdateItemInput {
  name?: string;
  category?: InventoryCategory;
  unit?: InventoryUnit;
  sku?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  lowStockThreshold?: number;
  reorderLeadTimeDays?: number | null;
  lastRestockCostPerUnit?: number | null;
  defaultSupplierName?: string | null;
}

export interface CreateMovementInput {
  inventoryItemId: number;
  type: MovementType;
  quantity: number;
  bookingId?: number | null;
  supplierName?: string;
  costPerUnit?: number;
  totalCost?: number;
  reason?: string;
  notes?: string;
  photoUrl?: string;
  occurredAt?: string;
}

export interface ItemListFilters {
  category?: InventoryCategory;
  businessId?: number;
  search?: string;
  lowStockOnly?: boolean;
}

export class InventoryAPI {
  // ─── Items ────────────────────────────────────────────────────
  static async listItems(
    filters: ItemListFilters = {},
  ): Promise<InventoryListResponse> {
    const params: Record<string, any> = { ...filters };
    if (filters.lowStockOnly) params.lowStockOnly = "true";
    const res = await axiosInstance.get(`/api/v1/inventory/items`, { params });
    return (
      res.data?.data ??
      ({
        items: [],
        summary: { byCategory: {}, totalStockValue: 0, lowStockCount: 0 },
      } as InventoryListResponse)
    );
  }

  static async getItem(id: number): Promise<InventoryItem | null> {
    const res = await axiosInstance.get(`/api/v1/inventory/items/${id}`);
    return res.data?.data?.item ?? null;
  }

  static async createItem(body: CreateItemInput): Promise<InventoryItem> {
    const res = await axiosInstance.post(`/api/v1/inventory/items`, body);
    return res.data?.data?.item;
  }

  static async updateItem(
    id: number,
    body: UpdateItemInput,
  ): Promise<InventoryItem> {
    const res = await axiosInstance.patch(
      `/api/v1/inventory/items/${id}`,
      body,
    );
    return res.data?.data?.item;
  }

  static async removeItem(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/inventory/items/${id}`);
  }

  // ─── Movements ────────────────────────────────────────────────
  static async listMovements(filters: {
    inventoryItemId?: number;
    bookingId?: number;
    type?: MovementType;
  } = {}): Promise<{ movements: InventoryMovement[] }> {
    const res = await axiosInstance.get(`/api/v1/inventory/movements`, {
      params: filters,
    });
    return res.data?.data ?? { movements: [] };
  }

  static async createMovement(
    body: CreateMovementInput,
  ): Promise<{ movement: InventoryMovement; item: InventoryItem }> {
    const res = await axiosInstance.post(
      `/api/v1/inventory/movements`,
      body,
    );
    return res.data?.data;
  }

  static async removeMovement(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/inventory/movements/${id}`);
  }
}

// ─── Display helpers ────────────────────────────────────────────────

export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  ingredient: "Ingredients",
  rental: "Rental fleet",
  equipment: "Equipment",
  consumable: "Consumables",
  linen: "Linen",
  stationery: "Stationery",
  other: "Other",
};

export const INVENTORY_UNIT_LABELS: Record<InventoryUnit, string> = {
  piece: "piece",
  dozen: "dozen",
  pair: "pair",
  set: "set",
  kg: "kg",
  gram: "g",
  litre: "L",
  ml: "ml",
  metre: "m",
  bottle: "bottle",
  packet: "packet",
  tray: "tray",
  thaal: "thaal",
  tola: "tola",
  box: "box",
  roll: "roll",
  other: "unit",
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  restock: "Restock",
  consumed: "Consumed",
  wastage: "Wastage",
  transfer_out: "Transfer out",
  transfer_in: "Transfer in",
  adjustment: "Stock-take",
};

export const MOVEMENT_TYPE_TONES: Record<
  MovementType,
  { bg: string; text: string; border: string }
> = {
  restock: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  consumed: { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" },
  wastage: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" },
  transfer_out: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  transfer_in: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-300",
  },
  adjustment: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-300",
  },
};

export const CATEGORY_TONES: Record<
  InventoryCategory,
  { bg: string; text: string; border: string }
> = {
  ingredient: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  rental: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
  equipment: {
    bg: "bg-sky-50",
    text: "text-sky-800",
    border: "border-sky-300",
  },
  consumable: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-300",
  },
  linen: { bg: "bg-rose-50", text: "text-rose-800", border: "border-rose-300" },
  stationery: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  other: {
    bg: "bg-neutral-100",
    text: "text-neutral-700",
    border: "border-neutral-300",
  },
};
