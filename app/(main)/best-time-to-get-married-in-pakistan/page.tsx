import { ContentPillar, buildPillarMetadata } from "@/components/content/content-pillar"
import { data } from "@/lib/content/pillars/best-time-to-get-married-in-pakistan"

export const metadata = buildPillarMetadata(data)

export default function Page() {
  return <ContentPillar data={data} />
}
