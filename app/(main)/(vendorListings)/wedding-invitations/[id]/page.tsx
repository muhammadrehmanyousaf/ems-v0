import VendorDetailPage from "@/components/VendorDetailPage"

// Wedding Invitations & Stationery vendor detail by numeric id. Lives under
// the `wedding-invitations` slug (not `wedding-stationery`) because the SEO
// listing route app/(main)/wedding-stationery/[city] already owns
// `/wedding-stationery/*`; a second dynamic segment there (`[id]` vs
// `[city]`) is a Next.js route collision. VendorCard's typeMap routes
// "Wedding Invitations and Stationery" here.
export default function Page() {
  return <VendorDetailPage categoryLabel="wedding stationery" />
}
