"use client"

import { useQuery } from "@tanstack/react-query"

import { useOps } from "@/components/ops/ops-shell"
import { Card, Empty, PageHeader, Pill } from "@/components/ops/ops-ui"
import { opsApi, OPS_ROLE_LABEL, OPS_TEAM_KIND_LABEL } from "@/lib/api/ops"

const PERMISSION_LABEL: Record<string, string> = {
  ops_access: "Open the Ops Portal",
  ops_prospect_import: "Import vendor prospect sheets",
  ops_prospect_call: "Work a prospect queue and log calls",
  ops_prospect_view_team: "See the whole team's prospects",
  ops_prospect_view_all: "See every team's prospects",
  ops_prospect_reassign: "Reassign prospects between agents",
  ops_onboard_direct: "Onboard a vendor directly",
  ops_takeover_listing: "Take over an unclaimed listing",
  ops_media_upload: "Upload photos and videos for a vendor",
  ops_listing_edit_on_behalf: "Edit a listing on a vendor's behalf",
  ops_client_manage: "Create and work client records",
  ops_client_assign: "Assign a client to a vendor manager",
  ops_vendor_search: "Search vendors with internal filters",
  ops_reports_team: "See team reports",
  ops_reports_all: "See all reports",
  ops_export: "Export contact data",
  ops_settings: "Manage teams, cities, settings and staff",
}

export function HomeView() {
  const { me } = useOps()
  const cities = useQuery({ queryKey: ["ops", "cities"], queryFn: opsApi.cities })
  const cityName = (id: number) => cities.data?.cities.find((c) => c.id === id)?.name ?? `City ${id}`

  return (
    <>
      <PageHeader
        title={`Assalam o Alaikum, ${me.user.fullName.split(" ")[0]}`}
        subtitle="This is your access in the Ops Portal. Everything here is checked again by the server on every request."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Your role">
            <div className="flex flex-wrap gap-2">
              {me.isSuperAdmin && <Pill tone="info">Super admin</Pill>}
              {me.roles.map((r) => (
                <Pill key={r} tone="success">{OPS_ROLE_LABEL[r] ?? r}</Pill>
              ))}
              {!me.isSuperAdmin && me.roles.length === 0 && <Pill tone="warning">No ops role</Pill>}
            </div>
          </Card>

          <Card title="What you can do" description={`${me.permissions.length} permission${me.permissions.length === 1 ? "" : "s"}`}>
            {me.permissions.length === 0 ? (
              <Empty>No permissions yet. Ask your manager.</Empty>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {me.permissions.map((p) => (
                  <li key={p} className="flex items-start gap-2 text-sm leading-relaxed text-bridal-text">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-status-success-solid" aria-hidden />
                    {PERMISSION_LABEL[p] ?? p}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Your teams" description={me.scope.all ? "You can see every team and city." : undefined}>
            {me.memberships.length === 0 ? (
              <Empty>{me.scope.all ? "You are not seated on a team; you see all of them." : "You are not on a team yet. Ask your manager to add you."}</Empty>
            ) : (
              <ul className="space-y-3">
                {me.memberships.map((m) => (
                  <li key={m.teamId} className="rounded-lg border border-bridal-beige/70 bg-bridal-cream/50 p-3">
                    <p className="text-sm font-medium text-bridal-charcoal">{m.teamName}</p>
                    <p className="text-xs text-bridal-text-soft">{OPS_TEAM_KIND_LABEL[m.kind]} · {m.memberRole === "lead" ? "Lead" : "Agent"}</p>
                    <p className="mt-2 text-xs text-bridal-text-soft">
                      {m.cityIds.length === 0 ? "All cities" : m.cityIds.map(cityName).join(", ")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Coming next">
            <ul className="space-y-2 text-sm leading-relaxed text-bridal-text-soft">
              <li>Vendor prospect import and the call queue (Team A)</li>
              <li>Guided onboarding with per-category call sheets</li>
              <li>Client desk, vendor search and assignment (Team B)</li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}
