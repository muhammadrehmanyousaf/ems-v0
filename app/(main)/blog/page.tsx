import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen, Clock, ArrowRight, TrendingUp, Heart, Camera, Utensils, Music } from "lucide-react"
import Link from "next/link"

const posts = [
  {
    title: "Top 10 Wedding Venues in Lahore for 2025",
    excerpt: "From grand banquet halls to intimate garden settings, discover the most sought-after wedding venues in Lahore that will make your big day unforgettable.",
    category: "Venues",
    readTime: "5 min read",
    date: "Feb 10, 2025",
    icon: TrendingUp,
    featured: true,
  },
  {
    title: "How to Choose the Perfect Wedding Photographer",
    excerpt: "Your wedding photos will last a lifetime. Here's what to look for when selecting a photographer who can capture your special moments beautifully.",
    category: "Photography",
    readTime: "4 min read",
    date: "Feb 5, 2025",
    icon: Camera,
  },
  {
    title: "Pakistani Wedding Menu Ideas: Traditional & Modern",
    excerpt: "From classic desi menus to fusion cuisines, explore the best catering options that will delight your wedding guests.",
    category: "Catering",
    readTime: "6 min read",
    date: "Jan 28, 2025",
    icon: Utensils,
  },
  {
    title: "Budget-Friendly Wedding Planning Tips",
    excerpt: "Plan your dream wedding without breaking the bank. Smart strategies to allocate your budget where it matters most.",
    category: "Planning",
    readTime: "7 min read",
    date: "Jan 20, 2025",
    icon: Heart,
  },
  {
    title: "Trending Mehndi Night Ideas for 2025",
    excerpt: "Make your mehndi night memorable with these fresh decoration, entertainment, and activity ideas that your guests will love.",
    category: "Inspiration",
    readTime: "5 min read",
    date: "Jan 15, 2025",
    icon: Music,
  },
  {
    title: "Complete Wedding Checklist: 6 Months Out",
    excerpt: "Stay on track with our comprehensive timeline of everything you need to do in the six months leading up to your wedding day.",
    category: "Planning",
    readTime: "8 min read",
    date: "Jan 8, 2025",
    icon: BookOpen,
  },
]

export default function BlogPage() {
  const featured = posts.find((p) => p.featured)
  const rest = posts.filter((p) => !p.featured)

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-bridal-gold to-bridal-gold-dark text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-bridal-gold/40" />
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Wedding Blog</h1>
          <p className="text-lg text-bridal-cream max-w-xl mx-auto">
            Inspiring stories, expert tips, and the latest trends to help you plan the perfect wedding.
          </p>
        </div>
      </section>

      <section className="py-12 px-4 bg-neutral-50">
        <div className="max-w-5xl mx-auto">
          {featured && (
            <Card className="border-0 shadow-lg mb-10 overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-bridal-cream to-pink-50 p-8 sm:p-10">
                  <Badge className="bg-bridal-gold text-white mb-4">{featured.category}</Badge>
                  <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">{featured.title}</h2>
                  <p className="text-neutral-600 mb-4 max-w-2xl">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-neutral-500">
                    <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{featured.readTime}</span>
                    <span>{featured.date}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Card key={post.title} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="w-10 h-10 bg-bridal-gold/15 rounded-lg flex items-center justify-center mb-4">
                    <post.icon className="w-5 h-5 text-bridal-gold-dark" />
                  </div>
                  <Badge variant="secondary" className="mb-3">{post.category}</Badge>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{post.title}</h3>
                  <p className="text-sm text-neutral-600 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.readTime}</span>
                    <span>{post.date}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-neutral-500 mb-4">More articles coming soon!</p>
            <Link href="/help">
              <Button variant="outline" className="gap-2">
                Browse Help Center <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
