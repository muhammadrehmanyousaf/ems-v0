import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Briefcase, MapPin, Clock, Rocket, Users, Heart, Zap, ArrowRight } from "lucide-react"
import Link from "next/link"
import { SITE_NAME, SITE_URL } from "@/lib/seo"

export const metadata: Metadata = {
  title: `Careers — Join the ${SITE_NAME} team`,
  description: `Help us build Pakistan's wedding marketplace. Open roles in engineering, design, marketing, and vendor relations at ${SITE_NAME}.`,
  alternates: { canonical: `${SITE_URL}/careers` },
  openGraph: {
    title: `Careers at ${SITE_NAME}`,
    description: `Join the ${SITE_NAME} team and help reshape how Pakistan plans weddings.`,
    url: `${SITE_URL}/careers`,
    siteName: SITE_NAME,
    type: "website",
  },
}

const perks = [
  { icon: Rocket, title: "Growth Focused", desc: "Fast-paced startup environment where you learn and grow every day." },
  { icon: Users, title: "Great Team", desc: "Work alongside talented, passionate people who love what they do." },
  { icon: Heart, title: "Meaningful Work", desc: "Help couples create the most memorable day of their lives." },
  { icon: Zap, title: "Flexible Culture", desc: "Remote-friendly, flexible hours, and a results-driven culture." },
]

const openings = [
  { title: "Full-Stack Developer", type: "Full-time", location: "Lahore / Remote", department: "Engineering" },
  { title: "UI/UX Designer", type: "Full-time", location: "Lahore", department: "Design" },
  { title: "Digital Marketing Specialist", type: "Full-time", location: "Lahore / Remote", department: "Marketing" },
  { title: "Vendor Relations Manager", type: "Full-time", location: "Lahore", department: "Operations" },
  { title: "Customer Support Executive", type: "Part-time", location: "Remote", department: "Support" },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Briefcase className="w-12 h-12 mx-auto mb-4 text-bridal-gold/40" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Join Our Team</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
            Help us revolutionize the wedding industry in Pakistan. We&apos;re building the future of event planning.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">Why Work With Us?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {perks.map((perk) => (
              <Card key={perk.title} className="border-0 shadow-sm text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-bridal-gold/15 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <perk.icon className="w-6 h-6 text-bridal-gold-dark" />
                  </div>
                  <h3 className="font-semibold text-neutral-900 mb-2">{perk.title}</h3>
                  <p className="text-sm text-neutral-600">{perk.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-neutral-900 text-center mb-8">Open Positions</h2>
          <div className="space-y-4 max-w-3xl mx-auto">
            {openings.map((job) => (
              <Card key={job.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-neutral-900 mb-2">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{job.department}</Badge>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <Clock className="w-3 h-3" />{job.type}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-neutral-500">
                        <MapPin className="w-3 h-3" />{job.location}
                      </span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button size="sm" className="bg-bridal-gold hover:bg-bridal-gold-dark text-white gap-1">
                      Apply <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-neutral-600 mb-4">Don&apos;t see a role that fits? We&apos;re always looking for talented people.</p>
            <Link href="/contact">
              <Button variant="outline">Send Us Your Resume</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
