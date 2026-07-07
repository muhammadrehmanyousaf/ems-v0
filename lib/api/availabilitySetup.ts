import axiosInstance from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";
import type { AvailabilityPrimitive } from "../availability-primitive";

/**
 * Phase-3 — availability setup client. Talks to /api/v1/availability (flag-gated
 * FEAT_PRIMITIVE_ROUTING → 404 when dark, so the UI self-hides).
 */
const v1 = `${BACKEND_URL}api/v1/availability`;

export interface CrewResource { id: number; label: string; kind: string; laneCount: number; travelBufferMin: number; active: boolean }
export interface RentalSku { id: number; name: string; unit: string; totalUnits: number; securityDepositPerUnit: string | number; active: boolean }
export interface ProductionLine { id: number; name: string; unit: string; capacityPerDay: number; active: boolean }
export interface AvailabilitySetup {
  businessId: number;
  primitive: AvailabilityPrimitive | null;
  crewResources: CrewResource[];
  rentalSkus: RentalSku[];
  productionLines: ProductionLine[];
}

export async function getAvailabilitySetup(): Promise<AvailabilitySetup | null> {
  try {
    const { data } = await axiosInstance.get(`${v1}/setup`);
    return (data?.data as AvailabilitySetup) ?? null;
  } catch (e: any) { if (e?.response?.status === 404) return null; throw e; }
}

export async function createCrewResource(body: { label: string; laneCount?: number; travelBufferMin?: number; kind?: string }) {
  const { data } = await axiosInstance.post(`${v1}/crew-resources`, body);
  return data?.data as CrewResource;
}
export async function createRentalSku(body: { name: string; totalUnits?: number; securityDepositPerUnit?: number; unit?: string }) {
  const { data } = await axiosInstance.post(`${v1}/rental-skus`, body);
  return data?.data as RentalSku;
}
export async function createProductionLine(body: { name: string; capacityPerDay?: number; unit?: string }) {
  const { data } = await axiosInstance.post(`${v1}/production-lines`, body);
  return data?.data as ProductionLine;
}
export async function deactivateResource(kind: "crew-resources" | "rental-skus" | "production-lines", id: number) {
  const { data } = await axiosInstance.delete(`${v1}/${kind}/${id}`);
  return data?.data as { id: number };
}

// The cutover endpoints — primitive-aware check + reserve.
export interface AvailabilityVerdict {
  primitive: AvailabilityPrimitive | null;
  status: "AVAILABLE" | "PARTIAL" | "UNAVAILABLE" | "DELEGATE_LEGACY" | "NEEDS_INPUT";
  detail?: Record<string, unknown>;
}
export async function checkAvailability(body: Record<string, unknown>): Promise<AvailabilityVerdict> {
  const { data } = await axiosInstance.post(`${v1}/check`, body);
  return data?.data as AvailabilityVerdict;
}
export async function reserveAvailability(body: Record<string, unknown>): Promise<{ primitive: string; reservation: any; status?: string }> {
  const { data } = await axiosInstance.post(`${v1}/reserve`, body);
  return data?.data as { primitive: string; reservation: any };
}
