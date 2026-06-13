/**
 * Phase 0 #6.7 — Team Members API client (VR-050.15).
 *
 * Pakistani wedding vendors typically operate as a small studio:
 * one lead artist (the brand) + 2-5 associates + a casual labour
 * pool that fluctuates per event. The backend has had full team-
 * member CRUD live for months; the dashboard simply lacked a UI
 * to manage it. This client + the matching tab close that gap.
 *
 * Routes mirror `event-planner-api/src/routes/teamMemberRouter.js`.
 * All routes are mounted at
 *   /api/v1/businesses/:businessId/team-members
 * The GET list is public; writes require `auth()` middleware and
 * an owner-or-admin check inside the controller (max 50 members
 * per business — defensive cap on the backend).
 */

import axiosInstance from "@/lib/axiosConfig";

export interface BusinessTeamMember {
  id: number;
  businessId: number;
  name: string;
  role: string;
  bio: string | null;
  profileImageUrl: string | null;
  isLeadArtist: boolean;
  isActive: boolean;
  sortOrder: number;
  specialties: string[] | null;
  yearsExperience: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertTeamMemberInput {
  name?: string;
  role?: string;
  bio?: string | null;
  profileImageUrl?: string | null;
  isLeadArtist?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  specialties?: string[] | null;
  yearsExperience?: number | null;
}

export class TeamMembersAPI {
  static async list(
    businessId: number,
    opts: { includeInactive?: boolean } = {},
  ): Promise<BusinessTeamMember[]> {
    const res = await axiosInstance.get(
      `/api/v1/businesses/${businessId}/team-members`,
      { params: opts.includeInactive ? { includeInactive: 'true' } : undefined },
    );
    return res.data?.data?.members ?? [];
  }

  static async create(
    businessId: number,
    body: UpsertTeamMemberInput,
  ): Promise<BusinessTeamMember> {
    const res = await axiosInstance.post(
      `/api/v1/businesses/${businessId}/team-members`,
      body,
    );
    return res.data?.data?.member ?? res.data?.data?.template;
  }

  static async update(
    businessId: number,
    memberId: number,
    body: UpsertTeamMemberInput,
  ): Promise<BusinessTeamMember> {
    const res = await axiosInstance.patch(
      `/api/v1/businesses/${businessId}/team-members/${memberId}`,
      body,
    );
    return res.data?.data?.member;
  }

  static async remove(businessId: number, memberId: number): Promise<void> {
    await axiosInstance.delete(
      `/api/v1/businesses/${businessId}/team-members/${memberId}`,
    );
  }

  /**
   * Bulk reorder. Caller supplies the desired final sortOrder per id.
   * Useful for drag-to-reorder UIs that capture the new ordering
   * client-side and POST once instead of N PATCHes.
   */
  static async reorder(
    businessId: number,
    order: Array<{ id: number; sortOrder: number }>,
  ): Promise<BusinessTeamMember[]> {
    const res = await axiosInstance.post(
      `/api/v1/businesses/${businessId}/team-members/reorder`,
      { order },
    );
    return res.data?.data?.members ?? [];
  }
}
