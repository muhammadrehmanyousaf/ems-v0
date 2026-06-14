import { ContentPillar, buildPillarMetadata } from "@/components/content/content-pillar"
import { data } from "@/lib/content/pillars/how-to-save-money-on-a-wedding-in-pakistan"

export const metadata = buildPillarMetadata(data)

export default function Page() {
  return <ContentPillar data={data} />
}
