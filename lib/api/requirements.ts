/**
 * WW-REQUIREMENTS — "tell the venue anything else, in your own words".
 *
 * The booking flow had no free-text field at all — not one textarea — so
 * everything a Pakistani family actually needs to say went to WhatsApp, and the
 * WhatsApp thread became the system of record instead of the booking.
 */

import axiosInstance from "@/lib/axiosConfig";

/**
 * Quick picks. Each is here because it changes what the venue must DO, not
 * because it rounds out a taxonomy.
 */
export const REQUIREMENT_TAGS = [
  "parda",
  "female_staff_only",
  "wheelchair",
  "nikah_onsite",
  "baraat_dhol",
  "own_mithai",
  "own_cake",
  "dietary",
  "guests_from_abroad",
  "stage_requirement",
  "timing_concern",
  "photography_limits",
] as const;

export type RequirementTag = (typeof REQUIREMENT_TAGS)[number];

export const REQUIREMENT_TAG_LABELS: Record<RequirementTag, string> = {
  parda: "Separate / parda ladies section",
  female_staff_only: "Female service staff only",
  wheelchair: "Wheelchair or elderly access",
  nikah_onsite: "Nikah at the venue",
  baraat_dhol: "Baraat entry with dhol",
  own_mithai: "Bringing our own mithai",
  own_cake: "Bringing our own cake",
  dietary: "Dietary requirements",
  guests_from_abroad: "Guests arriving from abroad",
  stage_requirement: "Special stage requirement",
  timing_concern: "Timing concern",
  photography_limits: "Photography restrictions",
};

export interface RequirementDietary {
  vegetarianCount?: number;
  kidsUnder5?: number;
  kids5to12?: number;
  staffMeals?: number;
  noBeef?: boolean;
  allergies?: string[];
}

export type RequirementStatus = "open" | "acknowledged" | "agreed" | "declined" | "quoted";

export interface BookingRequirement {
  id: number;
  bookingId: number;
  source: "inquiry" | "booking_flow" | "post_booking";
  tags: string[] | null;
  dietaryJson: RequirementDietary | null;
  freeText: string | null;
  language: string | null;
  status: RequirementStatus;
  vendorResponse: string | null;
  priceImpactPkr: number | string | null;
  respondedAt: string | null;
  createdAt: string;
}

export class RequirementsAPI {
  /**
   * The customer states what they need. Free text is stored verbatim — never
   * parsed, never translated. Urdu is first-class.
   */
  static async create(
    bookingId: number | string,
    body: {
      tags?: string[];
      dietary?: RequirementDietary;
      freeText?: string;
      source?: "inquiry" | "booking_flow" | "post_booking";
      language?: string;
    },
  ): Promise<BookingRequirement> {
    const res = await axiosInstance.post(
      `/api/v1/bookings/${bookingId}/requirements`,
      body,
    );
    return res.data?.data?.requirement;
  }

  /**
   * The shared thread. `openCount` is what the vendor's accept surface reads to
   * show how many still need an answer.
   */
  static async list(
    bookingId: number | string,
  ): Promise<{ requirements: BookingRequirement[]; openCount: number }> {
    const res = await axiosInstance.get(`/api/v1/bookings/${bookingId}/requirements`);
    return {
      requirements: res.data?.data?.requirements ?? [],
      openCount: res.data?.data?.openCount ?? 0,
    };
  }

  /**
   * The vendor responds. Acknowledging takes one tap and no typing — demanding
   * a paragraph would only teach vendors to paste "ok".
   *
   * Declining requires a reason; quoting requires an amount.
   */
  static async respond(
    requirementId: number,
    body: {
      status: Exclude<RequirementStatus, "open">;
      vendorResponse?: string;
      priceImpactPkr?: number;
    },
  ): Promise<BookingRequirement> {
    const res = await axiosInstance.patch(`/api/v1/requirements/${requirementId}`, body);
    return res.data?.data?.requirement;
  }

  /** The customer withdraws one, while it is still unanswered. */
  static async withdraw(requirementId: number): Promise<void> {
    await axiosInstance.delete(`/api/v1/requirements/${requirementId}`);
  }
}
