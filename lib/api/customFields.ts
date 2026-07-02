import axios from "../axiosConfig";
import { BACKEND_URL } from "../backend-url";

/**
 * Custom Fields API — vendor-defined fields on host entities (bookings, expenses,
 * …). Definitions describe the field; values ride the host record. All calls are
 * per-business and gated by ENABLE_CUSTOM_FIELDS on the backend.
 */
export type CustomFieldType =
  | "text" | "textarea" | "number" | "money" | "date" | "datetime"
  | "boolean" | "dropdown" | "multiselect" | "phone" | "email" | "url" | "file";

export interface CustomFieldOption { value: string; label: string }

export interface CustomFieldDef {
  id: number;
  businessId: number;
  subVenueId: number | null;
  entityType: string;
  fieldKey: string;
  label: string;
  labelUr?: string | null;
  fieldType: CustomFieldType;
  optionsJson?: CustomFieldOption[] | null;
  required: boolean;
  defaultValue?: string | null;
  helpText?: string | null;
  section?: string | null;
  displayOrder: number;
  showInList: boolean;
  isActive: boolean;
}

export type CustomFieldValues = Record<string, unknown>;

export interface CreateFieldInput {
  businessId: number;
  entityType: string;
  label: string;
  fieldType: CustomFieldType;
  optionsJson?: CustomFieldOption[] | string[] | null;
  required?: boolean;
  helpText?: string | null;
  section?: string | null;
  showInList?: boolean;
  subVenueId?: number | null;
}

const base = `${BACKEND_URL}api/v1/custom-fields`;

export const CustomFieldsAPI = {
  async list(entityType: string, businessId: number, includeInactive = false): Promise<CustomFieldDef[]> {
    const res = await axios.get(`${base}/definitions`, { params: { entityType, businessId, includeInactive } });
    return res.data?.data ?? [];
  },
  async create(body: CreateFieldInput): Promise<CustomFieldDef> {
    const res = await axios.post(`${base}/definitions`, body);
    return res.data?.data;
  },
  async update(id: number, patch: Partial<CustomFieldDef>): Promise<CustomFieldDef> {
    const res = await axios.patch(`${base}/definitions/${id}`, patch);
    return res.data?.data;
  },
  async remove(id: number): Promise<{ id: number }> {
    const res = await axios.delete(`${base}/definitions/${id}`);
    return res.data?.data;
  },
  async reorder(businessId: number, ids: number[]): Promise<{ count: number }> {
    const res = await axios.post(`${base}/definitions/reorder`, { businessId, ids });
    return res.data?.data;
  },
  async getValues(entityType: string, entityId: number, businessId: number): Promise<CustomFieldValues> {
    const res = await axios.get(`${base}/values/${entityType}/${entityId}`, { params: { businessId } });
    return res.data?.data ?? {};
  },
  async putValues(entityType: string, entityId: number, businessId: number, values: CustomFieldValues): Promise<{ written: number }> {
    const res = await axios.put(`${base}/values/${entityType}/${entityId}`, { businessId, values });
    return res.data?.data;
  },
};
