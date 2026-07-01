// Venue-OS venue-hierarchy — FE API client.
//
// Typed wrapper over the flag-gated /api/v1/venue-spaces surface (Hall → Floor →
// Partition tree + merge groups + the tree-aware booking engine). Dark on the
// backend until ENABLE_VENUE_HIERARCHY is enabled for the pilot business, so these
// calls 404 until then — gate UI on isVenueHierarchyOn().
import api from "@/lib/axiosConfig";

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p;
  return res.data.data;
}

export type BookingMode = "SESSION" | "WHOLE_DAY";
export type SpaceStatus = "AVAILABLE" | "PARTIAL" | "UNAVAILABLE";
export interface Slot {
  start: string; // ISO
  end: string; // ISO
}

export interface SubVenueNode {
  id: number;
  businessId: number;
  name: string;
  kind: string;
  genderMode: string;
  fireRatedCapacity: number | null;
  comfortCapacity: number | null;
  isDefault: boolean;
  displayOrder: number;
  active: boolean;
  parentSubVenueId: number | null;
  path: string;
  depth: number;
  basePricePkr: string | null;
  bookingMode: BookingMode;
  children?: SubVenueNode[];
}
export interface SpaceTree {
  businessId: number;
  tree: SubVenueNode[];
}
export interface CapacityWarning {
  subVenueId: number;
  name: string;
  parentCapacity: number;
  childrenCapacitySum: number;
  overBy: number;
}
export interface MergeGroup {
  id: number;
  businessId: number;
  name: string;
  combinedCapacity: number | null;
  combinedPricePkr: string | null;
  active: boolean;
  members?: { subVenueId: number }[];
}
export interface SpaceAvailability {
  available: boolean;
  conflicts: { subVenueId: number; bookingId: number | null; isMaintenance: boolean; start: string; end: string }[];
  lockNodeCount: number;
  lockedSubVenueIds: number[];
}
export interface DateAvailability {
  businessId: number;
  date: string;
  spaces: { subVenueId: number; name: string; kind: string; depth: number; parentSubVenueId: number | null; basePricePkr: string | null; bookingMode: BookingMode; status: SpaceStatus }[];
}
export interface AvailabilityGrid {
  businessId: number;
  from: string;
  to: string;
  days: string[];
  rows: { subVenueId: number; name: string; kind: string; depth: number; parentSubVenueId: number | null; days: SpaceStatus[] }[];
}
export interface BookResult {
  bookingId: number | null;
  idempotent: boolean;
  spaceIds: number[];
  lockedSubVenueIds: number[];
  requestedSubVenueIds?: number[];
  mergeGroupId: number | null;
}

const BASE = "/api/v1/venue-spaces";

export const venueSpacesApi = {
  // public (customer-facing) read-only
  publicTree: (businessId: number): Promise<SpaceTree> => unwrap<SpaceTree>(api.get(`${BASE}/public/business/${businessId}/tree`)),
  publicAvailability: (businessId: number, date: string): Promise<DateAvailability> => unwrap<DateAvailability>(api.get(`${BASE}/public/business/${businessId}/availability`, { params: { date } })),

  // tree
  getTree: (businessId: number): Promise<SpaceTree> => unwrap<SpaceTree>(api.get(`${BASE}/business/${businessId}/tree`)),
  capacityWarnings: (businessId: number): Promise<{ businessId: number; warnings: CapacityWarning[] }> =>
    unwrap(api.get(`${BASE}/business/${businessId}/capacity-warnings`)),
  createSubVenue: (
    businessId: number,
    body: { name: string; kind?: string; genderMode?: string; parentSubVenueId?: number | null; fireRatedCapacity?: number; comfortCapacity?: number; basePricePkr?: number; bookingMode?: BookingMode; displayOrder?: number },
  ): Promise<SubVenueNode> => unwrap<SubVenueNode>(api.post(`${BASE}/business/${businessId}/sub-venues`, body)),
  updateSubVenue: (id: number, patch: Partial<{ name: string; kind: string; genderMode: string; fireRatedCapacity: number; comfortCapacity: number; basePricePkr: number; bookingMode: BookingMode; displayOrder: number; active: boolean }>): Promise<SubVenueNode> =>
    unwrap<SubVenueNode>(api.patch(`${BASE}/sub-venues/${id}`, patch)),
  moveSubVenue: (id: number, newParentSubVenueId: number | null): Promise<SubVenueNode> => unwrap<SubVenueNode>(api.post(`${BASE}/sub-venues/${id}/move`, { newParentSubVenueId })),
  deleteSubVenue: (id: number): Promise<{ deleted: number; ids: number[] }> => unwrap(api.delete(`${BASE}/sub-venues/${id}`)),

  // merge groups
  listMergeGroups: (businessId: number): Promise<{ businessId: number; groups: MergeGroup[] }> => unwrap(api.get(`${BASE}/business/${businessId}/merge-groups`)),
  createMergeGroup: (businessId: number, body: { name: string; subVenueIds: number[]; combinedCapacity?: number; combinedPricePkr?: number }): Promise<MergeGroup> =>
    unwrap<MergeGroup>(api.post(`${BASE}/business/${businessId}/merge-groups`, body)),
  deleteMergeGroup: (id: number): Promise<{ deleted: number }> => unwrap(api.delete(`${BASE}/merge-groups/${id}`)),

  // booking engine
  availabilityForDate: (businessId: number, date: string): Promise<DateAvailability> => unwrap<DateAvailability>(api.get(`${BASE}/business/${businessId}/availability`, { params: { date } })),
  availabilityRange: (businessId: number, from: string, to: string): Promise<AvailabilityGrid> => unwrap<AvailabilityGrid>(api.get(`${BASE}/business/${businessId}/availability-range`, { params: { from, to } })),
  checkAvailability: (businessId: number, body: { subVenueIds?: number[]; mergeGroupId?: number; slot: Slot; turnaroundMin?: number }): Promise<SpaceAvailability> =>
    unwrap<SpaceAvailability>(api.post(`${BASE}/business/${businessId}/check-availability`, body)),
  book: (businessId: number, body: { bookingId?: number; subVenueIds?: number[]; mergeGroupId?: number; slot: Slot; state?: string; role?: string; sessionLabel?: string; pricePkr?: number }): Promise<BookResult> =>
    unwrap<BookResult>(api.post(`${BASE}/business/${businessId}/book`, body)),
  cancelSpaces: (businessId: number, bookingId: number): Promise<{ bookingId: number; released: number }> => unwrap(api.post(`${BASE}/business/${businessId}/bookings/${bookingId}/cancel-spaces`, {})),
  maintenance: (businessId: number, body: { subVenueId: number; slot: Slot; note?: string }): Promise<BookResult> => unwrap<BookResult>(api.post(`${BASE}/business/${businessId}/maintenance`, body)),

  // per-space slots (onboarding + portal)
  listSlots: (businessId: number, subVenueId?: number): Promise<{ businessId: number; subVenueId: number | null; scope: string; slots: SlotTemplate[] }> =>
    unwrap(api.get(`${BASE}/business/${businessId}/slots`, { params: subVenueId ? { subVenueId } : {} })),
  createSlot: (businessId: number, body: Partial<SlotTemplate>): Promise<SlotTemplate> => unwrap<SlotTemplate>(api.post(`${BASE}/business/${businessId}/slots`, body)),
  bulkSetSlots: (businessId: number, body: { subVenueId?: number | null; slots: Partial<SlotTemplate>[] }): Promise<{ count: number; slots: SlotTemplate[] }> =>
    unwrap(api.put(`${BASE}/business/${businessId}/slots`, body)),
  updateSlot: (id: number, patch: Partial<SlotTemplate>): Promise<SlotTemplate> => unwrap<SlotTemplate>(api.patch(`${BASE}/slots/${id}`, patch)),
  deleteSlot: (id: number): Promise<{ deleted: number }> => unwrap(api.delete(`${BASE}/slots/${id}`)),
};

export interface SlotTemplate {
  id: number;
  businessId: number;
  subVenueId: number | null;
  label: string;
  startTime: string;
  endTime: string;
  capacity: number;
  weekdayMask: number;
  bufferAfterMinutes: number;
  unitGuestCapacity: number | null;
  sortOrder: number;
  isActive: boolean;
}
