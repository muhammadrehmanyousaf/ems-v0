// Ops Portal — FE API client for /api/v1/ops (docs/ops-portal/OPS-PORTAL-SPEC.md).
// Wedding Wala's OWN call-center staff: teams, cities, dispositions, settings, staff provisioning.
// Every call needs an ops role server-side; hiding a screen here is a convenience, never the boundary.
import api from "@/lib/axiosConfig"

async function unwrap<T>(p: Promise<{ data: { data: T } }>): Promise<T> {
  const res = await p
  return res.data.data
}

/** The server's message for a failed call (the envelope is { status, message, data: { code } }). */
export function opsErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const e = err as { response?: { data?: { message?: string } }; message?: string }
  return e?.response?.data?.message || e?.message || fallback
}

export type OpsRoleName = "ops_vendor_agent" | "ops_client_agent" | "ops_lead" | "ops_manager"
export type OpsTeamKind = "vendor_outreach" | "client_desk"

export interface OpsMembership {
  teamId: number
  teamName: string
  kind: OpsTeamKind
  memberRole: "agent" | "lead"
  cityIds: number[]
}
export interface OpsMe {
  user: { id: number; fullName: string; email: string }
  isSuperAdmin: boolean
  roles: OpsRoleName[]
  permissions: string[]
  memberships: OpsMembership[]
  scope: { all: boolean; teamIds: number[] }
}
export interface OpsCity {
  id: number
  name: string
  province: string | null
  aliases: string[]
  active: boolean
}
export interface OpsTeamMemberRow {
  id: number
  teamId: number
  userId: number
  memberRole: "agent" | "lead"
  cityIds: number[]
  active: boolean
  user?: { id: number; fullName: string; email: string; active: boolean }
}
export interface OpsTeam {
  id: number
  name: string
  kind: OpsTeamKind
  active: boolean
  members?: OpsTeamMemberRow[]
}
export interface OpsDisposition {
  id: number
  code: string
  label: string
  labelUr: string | null
  isTerminal: boolean
  requiresCallback: boolean
  requiresReason: boolean
  targetStatus: string
  sortOrder: number
  active: boolean
}
export interface OpsSettingEntry<T = unknown> {
  value: T
  overridden: boolean
  updatedAt: string | null
  updatedByUserId: number | null
}
export interface OpsSettingsMap {
  go_live_minimum: OpsSettingEntry<{ required: string[]; venueExtra: string[] }>
  retry_hours: OpsSettingEntry<{ noAnswer: number; switchedOff: number }>
  attempt_cap: OpsSettingEntry<{ attempts: number; minDays: number }>
  qa_percent: OpsSettingEntry<number>
  set_password_ttl_hours: OpsSettingEntry<number>
  consent_chase_hours: OpsSettingEntry<number>
  client_sla: OpsSettingEntry<{ firstResponseMinutes: number; assignmentActionHours: number }>
  lease_minutes: OpsSettingEntry<number>
}
export type OpsSettingKey = keyof OpsSettingsMap

export interface OpsStaffSeat {
  teamId: number
  teamName: string | null
  kind: OpsTeamKind | null
  memberRole: "agent" | "lead"
  cityIds: number[]
  active: boolean
}
export interface OpsStaffRow {
  id: number
  fullName: string
  email: string
  phoneNumber: string | null
  active: boolean
  createdAt: string
  roles: OpsRoleName[]
  seats: OpsStaffSeat[]
}
export interface OpsSetPassword {
  url: string
  expiresAt: string
  ttlHours: number
}
export interface OpsHomeSummary {
  canWorkVendors: boolean
  canManageClients: boolean
  canSeeBookings: boolean
  teamA?: {
    tasksDue: number
    tasksOverdue: number
    tasksNext24h: number
    readyToCall: number
    callsToday: number
    connectedToday: number
    interestedToday: number
    interestedOpen: number
    assignmentsOpen: number
    recentRequests?: {
      id: number
      clientName: string
      cityName: string | null
      guests: number | null
      stage: string
      createdAt: string
      nextEventDate: string | null
      unchecked: number
      venues: number
    }[]
    upcomingVisits?: {
      clientId: number
      clientName: string
      visitAt: string
      visitNote: string | null
      venueName: string
      assignmentId: number | null
    }[]
  }
  teamB?: {
    inbox: number
    needsResponse: number
    overdue: number
    mine: number
    unassigned: number
    waitingOnVendors?: number
    vendorReplied?: number
    visitsPlanned?: number
    recentUnanswered: {
      id: number
      name: string
      cityText: string | null
      source: string
      status: string
      createdAt: string
      firstResponseDueAt: string | null
      overdue: boolean
    }[]
    recentReplies?: {
      id: number
      name: string
      cityName: string | null
      guests: number | null
      availCount: number
      totalChecked: number
      topVenue: string | null
      repliedAt: string | null
    }[]
    upcomingVisits?: {
      id: number
      name: string
      visitAt: string | null
      visitNote: string | null
      venueName: string | null
      cityName: string | null
    }[]
  }
  bookings?: {
    total: number
    needsAction: number
    confirmed: number
    pending: number
    upcoming14d: number
    recent: import("./ops-bookings").OpsBookingRow[]
  }
}

const BASE = "/api/v1/ops"

export const opsApi = {
  me: (): Promise<OpsMe> => unwrap(api.get(`${BASE}/me`)),
  homeSummary: (): Promise<OpsHomeSummary> => unwrap(api.get(`${BASE}/home-summary`)),

  cities: (): Promise<{ cities: OpsCity[] }> => unwrap(api.get(`${BASE}/cities`)),
  createCity: (body: { name: string; province?: string; aliases?: string[] }): Promise<{ city: OpsCity }> =>
    unwrap(api.post(`${BASE}/cities`, body)),
  updateCity: (id: number, body: Partial<Pick<OpsCity, "name" | "province" | "aliases" | "active">>): Promise<{ city: OpsCity }> =>
    unwrap(api.patch(`${BASE}/cities/${id}`, body)),

  teams: (): Promise<{ teams: OpsTeam[] }> => unwrap(api.get(`${BASE}/teams`)),
  createTeam: (body: { name: string; kind: OpsTeamKind }): Promise<{ team: OpsTeam }> =>
    unwrap(api.post(`${BASE}/teams`, body)),
  updateTeam: (id: number, body: { name?: string; active?: boolean }): Promise<{ team: OpsTeam }> =>
    unwrap(api.patch(`${BASE}/teams/${id}`, body)),
  putMember: (teamId: number, body: { userId: number; cityIds?: number[] }): Promise<{ member: OpsTeamMemberRow }> =>
    unwrap(api.put(`${BASE}/teams/${teamId}/members`, body)),
  removeMember: (teamId: number, userId: number): Promise<{ member: OpsTeamMemberRow }> =>
    unwrap(api.delete(`${BASE}/teams/${teamId}/members/${userId}`)),

  dispositions: (): Promise<{ dispositions: OpsDisposition[] }> => unwrap(api.get(`${BASE}/dispositions`)),
  updateDisposition: (
    id: number,
    body: Partial<Pick<OpsDisposition, "label" | "labelUr" | "requiresCallback" | "requiresReason" | "active" | "sortOrder">>,
  ): Promise<{ disposition: OpsDisposition }> => unwrap(api.patch(`${BASE}/dispositions/${id}`, body)),

  settings: (): Promise<{ settings: OpsSettingsMap; keys: OpsSettingKey[] }> => unwrap(api.get(`${BASE}/settings`)),
  putSetting: (key: OpsSettingKey, value: unknown): Promise<{ key: string; value: unknown }> =>
    unwrap(api.put(`${BASE}/settings/${key}`, { value })),

  staff: (params?: { search?: string; active?: boolean }): Promise<{ staff: OpsStaffRow[]; roles: OpsRoleName[] }> =>
    unwrap(api.get(`${BASE}/staff`, { params })),
  createStaff: (body: {
    fullName: string
    email: string
    phoneNumber?: string
    opsRole: OpsRoleName
    teamId?: number
    cityIds?: number[]
  }): Promise<{ user: { id: number; fullName: string; email: string }; opsRole: OpsRoleName; setPassword: OpsSetPassword }> =>
    unwrap(api.post(`${BASE}/staff`, body)),
  updateStaff: (
    id: number,
    body: { fullName?: string; phoneNumber?: string | null; active?: boolean; opsRole?: OpsRoleName },
  ): Promise<{ user: { id: number; fullName: string; email: string; active: boolean } }> =>
    unwrap(api.patch(`${BASE}/staff/${id}`, body)),
  staffSetPasswordLink: (id: number): Promise<{ user: { id: number; fullName: string }; setPassword: OpsSetPassword }> =>
    unwrap(api.post(`${BASE}/staff/${id}/set-password-link`, {})),
}

export const OPS_ROLE_LABEL: Record<OpsRoleName, string> = {
  ops_vendor_agent: "Vendor agent (Team A)",
  ops_client_agent: "Client agent (Team B)",
  ops_lead: "Team lead",
  ops_manager: "Manager",
}

export const OPS_TEAM_KIND_LABEL: Record<OpsTeamKind, string> = {
  vendor_outreach: "Vendor outreach (Team A)",
  client_desk: "Client desk (Team B)",
}

/** Which team kinds a role may sit on (mirrors ROLE_TEAM_KINDS in the backend; the server is the authority). */
export const OPS_ROLE_TEAM_KINDS: Record<OpsRoleName, OpsTeamKind[]> = {
  ops_vendor_agent: ["vendor_outreach"],
  ops_client_agent: ["client_desk"],
  ops_lead: ["vendor_outreach", "client_desk"],
  ops_manager: ["vendor_outreach", "client_desk"],
}
