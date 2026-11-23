import type { Metadata } from "next"
import { Suspense } from "react"
import { notFound } from "next/navigation"

import { Gate } from "@/components/ops/ops-shell"
import { OnboardingView } from "@/components/ops/onboarding-view"

export const metadata: Metadata = { title: "Call sheet" }

export default function OpsOnboardingPage({ params }: { params: { id: string } }) {
  const id = Number(params.id)
  if (!Number.isInteger(id) || id <= 0) notFound()
  return <Suspense fallback={null}><Gate permission={["ops_onboard_direct", "ops_takeover_listing"]}><OnboardingView prospectId={id} /></Gate></Suspense>
}
