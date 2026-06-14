import { ContentPillar, buildPillarMetadata } from "@/components/content/content-pillar"
import { data } from "@/lib/content/pillars/what-to-wear-to-a-pakistani-wedding-guest-guide"

export const metadata = buildPillarMetadata(data)

export default function Page() {
  return <ContentPillar data={data} />
}
