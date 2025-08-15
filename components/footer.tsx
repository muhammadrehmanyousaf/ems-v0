import Link from "next/link"
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Heart, Star, Users, Calendar, Award } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-neutral-900 via-rose-900 to-pink-900 text-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="relative w-full px-2 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-6 sm:py-8 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Company Info */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold bg-gradient-to-r from-white to-rose-100 bg-clip-text text-transparent">
                  WeddingPlatform
                </h3>
                <p className="text-rose-200 text-sm">Your perfect wedding journey starts here</p>
              </div>
            </div>
            <p className="text-rose-100 leading-relaxed">
              Discover the best wedding vendors and venues. Plan your dream wedding with our comprehensive tools and expert guidance.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-rose-200">
                <Star className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-medium">4.8/5 Rating</span>
              </div>
              <div className="flex items-center gap-2 text-rose-200">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium">10K+ Couples</span>
              </div>
            </div>
          </div>

          {/* For Couples */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-rose-700 pb-3">
              For Couples
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/planning-tools" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Planning Tools</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/wedding-website" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Award className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Wedding Website</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/registry" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Registry</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/deals" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Star className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Special Deals</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/help" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Help & Support</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* For Vendors */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-rose-700 pb-3">
              For Vendors
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/list-business" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Award className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>List Your Business</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/vendor-success" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Star className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Success Stories</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/vendor-guide" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Calendar className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Vendor Guide</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/vendor-success" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Users className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Partner Program</span>
                </Link>
              </li>
              <li>
                <Link 
                  href="/careers" 
                  className="flex items-center gap-3 text-rose-100 hover:text-white hover:bg-white/10 px-3 py-2 rounded-lg transition-all duration-200 group"
                >
                  <Heart className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  <span>Join Our Team</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-white border-b border-rose-700 pb-3">
              Contact Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-rose-100 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-xs">hello@weddingplatform.com</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-rose-100 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-xs">+91 98765 43210</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-rose-100 hover:text-white transition-colors duration-200">
                <div className="w-8 h-8 bg-rose-600/20 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">Address</p>
                  <p className="text-xs">Mumbai, Maharashtra, India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Social Media & Newsletter */}
        <div className="border-t border-rose-800 pt-8 pb-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4">
                <span className="text-rose-200 font-medium">Follow Us:</span>
                <div className="flex gap-3">
                  <Link 
                    href="#" 
                    className="w-10 h-10 bg-rose-600/20 hover:bg-rose-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  >
                    <Facebook className="w-5 h-5 text-rose-200 group-hover:text-white" />
                  </Link>
                  <Link 
                    href="#" 
                    className="w-10 h-10 bg-rose-600/20 hover:bg-rose-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  >
                    <Instagram className="w-5 h-5 text-rose-200 group-hover:text-white" />
                  </Link>
                  <Link 
                    href="#" 
                    className="w-10 h-10 bg-rose-600/20 hover:bg-rose-500 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 group"
                  >
                    <Twitter className="w-5 h-5 text-rose-200 group-hover:text-white" />
                  </Link>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-rose-200">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-400" />
                <span className="text-sm">Made with love for couples</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-rose-800 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-rose-200 text-sm">
              &copy; {new Date().getFullYear()} WeddingPlatform. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="text-rose-200 hover:text-white transition-colors duration-200">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-rose-200 hover:text-white transition-colors duration-200">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-rose-200 hover:text-white transition-colors duration-200">
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

