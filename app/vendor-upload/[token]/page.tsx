import "../../globals.css"
import type { Metadata } from "next"

import { VendorUploadPage } from "@/components/vendor-upload/vendor-upload-page"

// A token-addressed page for ONE vendor: never indexed, never cached, no referrer. (middleware.ts keeps its path case-sensitive; robots.ts disallows it.)
export const metadata: Metadata = {
  title: "Add your photos",
  robots: { index: false, follow: false, nocache: true, noarchive: true },
  referrer: "no-referrer",
}
export const dynamic = "force-dynamic"

export default function VendorUploadRoute({ params }: { params: { token: string } }) {
  return <VendorUploadPage token={params.token} />
}
