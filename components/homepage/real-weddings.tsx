"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Heart,
  Share2,
  Calendar,
  MapPin,
  Users,
  Award,
  ArrowRight,
  DollarSign,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ScrollReveal } from "@/components/ui/motion-wrapper"
import { BridalButton } from "@/components/bridal/bridal-button"

const px = (id: number, w = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${w}`

const weddings = [
  {
    id: 1,
    couple: "Ayesha & Hamza",
    location: "The Grand Imperial, Lahore",
    image: px(1024993),
    date: "March 15, 2025",
    story: "A beautiful wedding with a perfect blend of traditional and modern elements. The couple chose a stunning venue that perfectly captured their love for elegance and culture.",
    guests: 350,
    budget: "PKR 45,00,000",
    duration: "3 Days",
    theme: "Royal Elegance",
    vendors: ["Spice Route Catering", "Elegant Frames Studio", "Bloom & Blossom Events"],
    highlights: ["Grand baraat", "Traditional nikkah", "Live qawwali night", "Grand valima dinner"],
    gallery: [px(1024993), px(2253870), px(1456613), px(1444442)],
  },
  {
    id: 2,
    couple: "Fatima & Ali",
    location: "Royal Garden Marquee, Islamabad",
    image: px(2253870),
    date: "February 28, 2025",
    story: "An enchanting outdoor celebration with fairy lights and fresh flowers. Their garden-themed mehndi and classic valima created unforgettable memories.",
    guests: 280,
    budget: "PKR 38,00,000",
    duration: "2 Days",
    theme: "Garden Romance",
    vendors: ["Zaika Caterers", "Golden Moments Photography", "Dream Decor Studio"],
    highlights: ["Garden mehndi", "Floral canopy nikkah", "Fairy-light reception", "Live music"],
    gallery: [px(2253870), px(1616113), px(931177), px(169193)],
  },
  {
    id: 3,
    couple: "Sana & Bilal",
    location: "Pearl Continental, Karachi",
    image: px(1456613),
    date: "January 20, 2025",
    story: "A grand five-star celebration that blended classic luxury with contemporary style. Every detail was meticulously planned to perfection.",
    guests: 500,
    budget: "PKR 65,00,000",
    duration: "4 Days",
    theme: "Luxury Grand",
    vendors: ["Dawat-e-Khaas Caterers", "Nikkah Stories Studio", "Royal Sajawat"],
    highlights: ["Grand stage setup", "Royal baraat", "Multi-cuisine feast", "Designer outfits"],
    gallery: [px(1456613), px(260922), px(1128783), px(1267320)],
  },
]

function WeddingDetailModal({ wedding }: { wedding: any }) {
  const [selectedImage, setSelectedImage] = useState(0)
  const { toast } = useToast()

  const handleShare = () => {
    navigator.share?.({
      title: `${wedding.couple}'s Wedding`,
      text: wedding.story,
      url: window.location.href,
    }).catch(() => {
      navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copied",
        description: "Wedding story link copied to clipboard.",
      })
    })
  }

  const handleLike = () => {
    toast({
      title: "Saved to your favourites",
      description: "This wedding story has been saved.",
    })
  }

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-bridal-cream border-bridal-beige">
      <DialogHeader>
        <DialogTitle className="font-display italic text-[28px] sm:text-[32px] text-bridal-charcoal leading-tight">
          {wedding.couple}
        </DialogTitle>
        <DialogDescription className="font-bridal text-[14px] text-bridal-text-soft">
          <span className="text-bridal-gold">{wedding.location}</span> · {wedding.date}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-7">
        {/* Hero image with theme overlay */}
        <div className="relative aspect-[16/9] rounded-md overflow-hidden bridal-card p-0">
          <img
            src={wedding.gallery[selectedImage]}
            alt={wedding.couple}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/85 via-bridal-charcoal/15 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-6 text-bridal-ivory">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-bridal-gold/95 text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.22em]">
              {wedding.theme}
            </span>
            <p className="font-display italic text-[18px] sm:text-[22px] text-bridal-ivory/95 max-w-3xl leading-snug">
              {wedding.story}
            </p>
          </div>
        </div>

        {/* Gallery */}
        <div className="grid grid-cols-4 gap-3">
          {wedding.gallery.map((image: string, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedImage(index)}
              className={`aspect-square rounded-md overflow-hidden border transition-all duration-300 ${
                selectedImage === index
                  ? "border-bridal-gold ring-2 ring-bridal-gold/40 scale-[1.02]"
                  : "border-bridal-beige hover:border-bridal-gold/55"
              }`}
            >
              <img
                src={image}
                alt={`${wedding.couple} ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Details */}
        <div className="grid md:grid-cols-2 gap-7">
          <div className="space-y-4">
            <h4 className="font-display italic text-[22px] text-bridal-charcoal">Wedding Details</h4>
            <div className="space-y-3">
              {[
                { Icon: Calendar, label: "Date",  value: wedding.date },
                { Icon: MapPin,   label: "Venue", value: wedding.location },
                { Icon: Users,    label: "Guests", value: `${wedding.guests} people` },
                { Icon: DollarSign, label: "Budget", value: wedding.budget },
              ].map(({ Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 p-3 bridal-card">
                  <span className="inline-flex w-10 h-10 rounded-full bg-bridal-blush/55 border border-bridal-beige items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-bridal-gold-dark" strokeWidth={1.6} />
                  </span>
                  <div>
                    <p className="font-bridal text-[10.5px] uppercase tracking-[0.22em] text-bridal-text-label font-medium">
                      {label}
                    </p>
                    <p className="font-display italic text-[16px] text-bridal-charcoal leading-tight">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-display italic text-[22px] text-bridal-charcoal">Highlights</h4>
            <div className="grid grid-cols-1 gap-2.5">
              {wedding.highlights.map((highlight: string) => (
                <div
                  key={highlight}
                  className="flex items-center gap-3 p-3 bridal-card hover:border-bridal-gold/55 transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-bridal-gold flex-shrink-0" />
                  <span className="font-bridal text-[14px] text-bridal-charcoal">
                    {highlight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Vendors */}
        <div>
          <h4 className="font-display italic text-[22px] text-bridal-charcoal mb-4">
            Featured Vendors
          </h4>
          <div className="grid md:grid-cols-3 gap-3">
            {wedding.vendors.map((vendor: string) => (
              <div
                key={vendor}
                className="bridal-card p-4 text-center"
              >
                <Award className="w-5 h-5 text-bridal-gold mx-auto mb-2" />
                <span className="font-display italic text-[15px] text-bridal-charcoal block">
                  {vendor}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-5 border-t border-bridal-beige">
          <BridalButton onClick={handleLike} variant="ghost" size="lg" block>
            <Heart className="w-4 h-4" />
            Save Story
          </BridalButton>
          <BridalButton onClick={handleShare} variant="outline" size="lg" block>
            <Share2 className="w-4 h-4" />
            Share Story
          </BridalButton>
        </div>
      </div>
    </DialogContent>
  )
}

export function RealWeddings() {
  return (
    <section className="relative bg-bridal-cream section-padding overflow-hidden">
      <div aria-hidden className="absolute inset-0 bg-bridal-grain opacity-90" />
      <div aria-hidden className="absolute inset-0 bg-mughal-jaal opacity-30" />

      <div className="relative container-responsive">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span className="block w-10 h-px bg-gradient-to-r from-transparent to-bridal-gold" />
              <span className="font-bridal text-[10.5px] uppercase tracking-[0.32em] text-bridal-gold font-medium">
                Love Stories
              </span>
              <span className="block w-10 h-px bg-gradient-to-l from-transparent to-bridal-gold" />
            </div>
            <h2 className="font-display italic text-[28px] sm:text-[34px] md:text-[40px] leading-[1.1] text-bridal-charcoal">
              Real Pakistani{" "}
              <span className="text-bridal-gold">wedding stories</span>
            </h2>
            <p className="font-bridal text-bridal-text-soft text-[14px] sm:text-[15px] mt-3 leading-relaxed">
              Get inspired by these beautiful celebrations. Each story is unique —
              just like yours will be.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {weddings.map((wedding) => (
            <Dialog key={wedding.id}>
              <DialogTrigger asChild>
                <article className="group overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-1 bridal-card p-0">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={wedding.image}
                      alt={wedding.couple}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-bridal-charcoal/90 via-bridal-charcoal/30 to-transparent" />

                    <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-bridal-cream/95 border border-bridal-beige text-bridal-charcoal text-[10px] font-bridal font-medium uppercase tracking-[0.18em] backdrop-blur-sm">
                      <Calendar className="w-3 h-3 text-bridal-gold" />
                      {wedding.date}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-5 text-bridal-ivory">
                      <h3 className="font-display italic text-[24px] leading-tight">
                        {wedding.couple}
                      </h3>
                      <p className="font-bridal text-[12px] text-bridal-rose mt-0.5">
                        {wedding.location}
                      </p>
                      <div className="mt-3 flex items-center gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bridal-ivory/15 backdrop-blur-sm border border-bridal-ivory/20 text-bridal-ivory text-[10.5px] font-bridal">
                          <Users className="w-3 h-3" />
                          {wedding.guests} guests
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-bridal-ivory/15 backdrop-blur-sm border border-bridal-ivory/20 text-bridal-ivory text-[10.5px] font-bridal">
                          <DollarSign className="w-3 h-3" />
                          {wedding.budget}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="font-bridal text-[13px] text-bridal-text-soft line-clamp-2 mb-4 leading-relaxed">
                      {wedding.story}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="font-bridal text-[11px] uppercase tracking-[0.22em] text-bridal-gold font-medium group-hover:text-bridal-gold-dark transition-colors">
                        Read their story →
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex w-8 h-8 items-center justify-center rounded-full text-bridal-text-label hover:bg-bridal-blush/55 hover:text-bridal-mauve transition-colors"
                          aria-label="Save"
                        >
                          <Heart className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex w-8 h-8 items-center justify-center rounded-full text-bridal-text-label hover:bg-bridal-blush/55 hover:text-bridal-mauve transition-colors"
                          aria-label="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              </DialogTrigger>
              <WeddingDetailModal wedding={wedding} />
            </Dialog>
          ))}
        </div>

        <div className="text-center mt-10">
          <BridalButton variant="ghost" size="lg">
            View more stories
            <ArrowRight className="w-4 h-4" />
          </BridalButton>
        </div>
      </div>
    </section>
  )
}
