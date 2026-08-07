// WWL-050 / WWL-100 — which space (hall / lawn / floor / partition) a booking
// occupies, and the ability to set it.
//
// Bookings taken before the assignment existed carry none, and at a multi-space
// venue only the vendor knows which hall a past wedding was in — so this is the
// call behind "Assign hall" on the booking and on the availability grid's
// unassigned row.
import api from "@/lib/axiosConfig";

export interface BookingSpaceOption {
  subVenueId: number;
  name: string;
  kind: string;
  depth: number;
  parentSubVenueId: number | null;
  bookingMode?: "SESSION" | "WHOLE_DAY";
  comfortCapacity?: number | null;
  fireRatedCapacity?: number | null;
}

export interface BookingSpaceState {
  bookingId: number;
  businessId: number;
  bookingDate: string;
  bookingTime: string;
  subVenueId: number | null;
  spaces: BookingSpaceOption[];
  /** The venue's only bookable space, when it has exactly one — nothing to pick. */
  soleBookableId: number | null;
  /** False when the environment has not taken the assignment migration yet. */
  assignable: boolean;
}

export interface SpaceConflict {
  code?: string;
  spaceName?: string;
  conflictingBookingIds?: number[];
}

function unwrap<T>(p: Promise<any>): Promise<T> {
  return p.then((r) => r?.data?.data as T);
}

export const BookingSpaceAPI = {
  get: (bookingId: number, businessId?: number | null): Promise<BookingSpaceState> =>
    unwrap<BookingSpaceState>(
      api.get(`/api/v1/bookings/${bookingId}/space`, {
        params: businessId ? { businessId } : {},
      }),
    ),

  /** `subVenueId: null` clears the assignment. */
  set: (
    bookingId: number,
    subVenueId: number | null,
    businessId?: number | null,
  ): Promise<{ bookingId: number; businessId: number; subVenueId: number | null; spaceName: string | null }> =>
    unwrap(
      api.patch(`/api/v1/bookings/${bookingId}/space`, {
        subVenueId,
        ...(businessId ? { businessId } : {}),
      }),
    ),
};

/** Indent a space by its depth so a Hall → Floor → Partition tree reads as one. */
export function spaceLabel(s: BookingSpaceOption): string {
  return `${"  ".repeat(Math.max(0, s.depth))}${s.name}`;
}

export default BookingSpaceAPI;
