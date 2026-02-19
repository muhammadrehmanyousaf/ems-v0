"use client"

import Link from "next/link"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart, Star, Users, Calendar, Award } from "lucide-react"
import { ScrollReveal, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-purple-950 via-purple-900 to-purple-950 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.3'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 md:py-12 lg:py-16">
        <StaggerContainer staggerDelay={0.1} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <StaggerItem className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg border border-gold-500/20">
                <Heart className="w-7 h-7 text-gold-400" />
              </div>
              <div>
                <h3 className="text-2xl font-heading font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                  WeddingPlatform
                </h3>
                <p className="text-purple-300 text-sm">Your perfect wedding journey</p>
              </div>
            </div>
            <p className="text-purple-200 leading-relaxed">
              Discover the best wedding vendors and venues. Plan your dream wedding with our comprehensive tools and expert guidance.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-purple-200">
                <Star className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 text-purple-200">
                <Users className="w-4 h-4 text-gold-400" />
                <span className="text-sm font-medium">10K+ Couples</span>
              </div>
            </div>
          </StaggerItem>

          {/* For Couples */}
          <StaggerItem className="space-y-6">
            <h3 className="text-xl font-heading font-bold text-white border-b border-gold-500/30 pb-3">
              For Couples
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/planning-tools", icon: Calendar, name: "Planning Tools" },
                { href: "/wedding-website", icon: Award, name: "Wedding Website" },
                { href: "/registry", icon: Heart, name: "Registry" },
                { href: "/deals", icon: Star, name: "Special Deals" },
                { href: "/help", icon: Users, name: "Help & Support" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 text-purple-200 hover:text-gold-300 hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-200 group"
                  >
                    <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* For Vendors */}
          <StaggerItem className="space-y-6">
            <h3 className="text-xl font-heading font-bold text-white border-b border-gold-500/30 pb-3">
              For Vendors
            </h3>
            <ul className="space-y-3">
              {[
                { href: "/list-business", icon: Award, name: "List Your Business" },
                { href: "/vendor-success", icon: Star, name: "Success Stories" },
                { href: "/vendor-guide", icon: Calendar, name: "Vendor Guide" },
                { href: "/vendor-success", icon: Users, name: "Partner Program" },
                { href: "/careers", icon: Heart, name: "Join Our Team" },
              ].map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 text-purple-200 hover:text-gold-300 hover:bg-white/5 px-3 py-2 rounded-lg transition-all duration-200 group"
                  >
                    <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </StaggerItem>

          {/* Contact Info */}
          <StaggerItem className="space-y-6">
            <h3 className="text-xl font-heading font-bold text-white border-b border-gold-500/30 pb-3">
              Contact Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-purple-200 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 bg-purple-800/50 border border-gold-500/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs">hello@weddingplatform.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-purple-200 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 bg-purple-800/50 border border-gold-500/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-xs">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-purple-200 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 bg-purple-800/50 border border-gold-500/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-xs">Mumbai, Maharashtra, India</p>
                </div>
              </div>
            </div>
          </StaggerItem>
        </StaggerContainer>

        {/* Social Media */}
        <div className="border-t border-gold-500/20 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-purple-300 font-medium">Follow Us:</span>
                <div className="flex gap-3">
                  {[Facebook, Instagram, Twitter].map((Icon, i) => (
                    <Link
                      key={i}
                      href="#"
                      className="w-10 h-10 bg-purple-800/50 hover:bg-gold-500 border border-gold-500/20 hover:border-gold-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                    >
                      <Icon className="w-5 h-5 text-purple-300 group-hover:text-white" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-purple-300">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-gold-400" />
                <span className="text-sm">Made with love for couples</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gold-500/20 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-purple-300 text-sm">
              &copy; {new Date().getFullYear()} WeddingPlatform. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-purple-300 hover:text-gold-300 transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-purple-300 hover:text-gold-300 transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-purple-300 hover:text-gold-300 transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
