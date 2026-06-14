import { ContentPillar, buildPillarMetadata } from "@/components/content/content-pillar"
import { data } from "@/lib/content/pillars/pakistani-wedding-events-order"

export const metadata = buildPillarMetadata(data)

export default function Page() {
  return <ContentPillar data={data} />
}
