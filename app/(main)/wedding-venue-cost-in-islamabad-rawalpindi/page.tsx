import { ContentPillar, buildPillarMetadata } from "@/components/content/content-pillar";
import { data } from "@/lib/content/pillars/wedding-venue-cost-in-islamabad-rawalpindi";

export const metadata = buildPillarMetadata(data);

export default function Page() {
  return <ContentPillar data={data} />;
}
