import VendorDetailPage from "@/components/VendorDetailPage"

// Bridal-wear vendor detail by numeric id. Lives under the `bridal-wearing`
// slug (not `bridal-wear`) because the SEO listing route
// app/(main)/bridal-wear/[city] already owns `/bridal-wear/*`; a second
// dynamic segment there (`[id]` vs `[city]`) is a Next.js route collision.
// VendorCard's typeMap routes "Bridal wearing" here.
export default function Page() {
  return <VendorDetailPage categoryLabel="bridal wear" />
}
