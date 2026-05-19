/**
 * Vendor Portal Phase 2 #8.5 — Generator fuel-log API.
 *
 * Mirrors backend at /api/v1/generator-fuel.
 */

import axiosInstance from "@/lib/axiosConfig";

export type EntryType = "delivery" | "consumption" | "tank_reading" | "maintenance";
export type FuelType = "diesel" | "petrol" | "lpg" | "other";

export interface FuelEntry {
  id: number;
  businessId: number;
  createdByUserId: number;
  bookingId: number | null;
  generatorIdentifier: string;
  type: EntryType;
  fuelType: FuelType;
  litres: number | string;
  tankBeforeLitres: number | string;
  tankAfterLitres: number | string;
  costPerLitre: number | string | null;
  totalCost: number | string | null;
  supplierName: string | null;
  deliveryRef: string | null;
  runHours: number | string | null;
  odometerHours: number | string | null;
  loadEstimate: string | null;
  maintenanceNote: string | null;
  notes: string | null;
  photoUrl: string | null;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
  business?: { id: number; name: string | null } | null;
  booking?: { id: number; bookingDate: string | null; status: string | null } | null;
}

export interface FuelSummary {
  byType: Partial<Record<EntryType, number>>;
  totalDeliveredLitres: number;
  totalDeliveryCost: number;
  totalConsumedLitres: number;
}

export interface TankStatusRow {
  identifier: string;
  currentTankLitres: number;
  lastReadingAt: string;
  fuelType: FuelType;
}

export interface BurnRateResult {
  ok: boolean;
  burnLitres?: number;
  ratePerHour?: number;
  reason?: string;
}

export interface CreateEntryInput {
  businessId: number;
  bookingId?: number;
  generatorIdentifier?: string;
  type: EntryType;
  fuelType?: FuelType;
  litres: number;
  costPerLitre?: number;
  totalCost?: number;
  supplierName?: string;
  deliveryRef?: string;
  runHours?: number;
  odometerHours?: number;
  loadEstimate?: string;
  maintenanceNote?: string;
  notes?: string;
  photoUrl?: string;
  occurredAt?: string;
}

export interface UpdateEntryInput {
  costPerLitre?: number | null;
  totalCost?: number | null;
  supplierName?: string | null;
  deliveryRef?: string | null;
  runHours?: number | null;
  odometerHours?: number | null;
  loadEstimate?: string | null;
  maintenanceNote?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  occurredAt?: string;
  bookingId?: number | null;
}

export class GeneratorFuelAPI {
  static async list(filters: {
    businessId?: number;
    generatorIdentifier?: string;
    type?: EntryType;
    bookingId?: number;
    from?: string;
    to?: string;
  } = {}): Promise<{ entries: FuelEntry[]; summary: FuelSummary }> {
    const res = await axiosInstance.get(`/api/v1/generator-fuel`, {
      params: filters,
    });
    return (
      res.data?.data ?? {
        entries: [],
        summary: {
          byType: {},
          totalDeliveredLitres: 0,
          totalDeliveryCost: 0,
          totalConsumedLitres: 0,
        },
      }
    );
  }

  static async tanks(filters: { businessId?: number } = {}): Promise<{ tanks: TankStatusRow[] }> {
    const res = await axiosInstance.get(`/api/v1/generator-fuel/tanks`, {
      params: filters,
    });
    return res.data?.data ?? { tanks: [] };
  }

  static async burnRate(filters: {
    businessId?: number;
    generatorIdentifier: string;
    from: string;
    to: string;
    runHours: number;
  }): Promise<{
    result: BurnRateResult;
    inputs: {
      generatorIdentifier: string;
      startReading: { litres: number; at: string };
      endReading: { litres: number; at: string };
      deliveriesLitres: number;
      runHours: number;
    };
  }> {
    const res = await axiosInstance.get(`/api/v1/generator-fuel/burn-rate`, {
      params: filters,
    });
    return res.data?.data;
  }

  static async create(body: CreateEntryInput): Promise<{
    entry: FuelEntry;
    result: { tankBefore: number; tankAfter: number; delta: number };
  }> {
    const res = await axiosInstance.post(`/api/v1/generator-fuel`, body);
    return res.data?.data;
  }

  static async update(id: number, body: UpdateEntryInput): Promise<FuelEntry> {
    const res = await axiosInstance.patch(`/api/v1/generator-fuel/${id}`, body);
    return res.data?.data?.entry;
  }

  static async remove(id: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/generator-fuel/${id}`);
  }
}

// Display helpers

export const ENTRY_TYPE_LABELS: Record<EntryType, string> = {
  delivery: "Delivery",
  consumption: "Consumption",
  tank_reading: "Tank reading",
  maintenance: "Maintenance",
};

export const FUEL_TYPE_LABELS: Record<FuelType, string> = {
  diesel: "Diesel",
  petrol: "Petrol",
  lpg: "LPG",
  other: "Other",
};

export const ENTRY_TYPE_TONES: Record<
  EntryType,
  { bg: string; text: string; border: string }
> = {
  delivery: {
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-300",
  },
  consumption: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
  },
  tank_reading: {
    bg: "bg-violet-50",
    text: "text-violet-800",
    border: "border-violet-300",
  },
  maintenance: {
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-300",
  },
};
