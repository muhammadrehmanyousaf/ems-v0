import Link from "next/link"
import { Facebook, Instagram, Twitter } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">About Us</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/careers">Careers</Link>
              </li>
              <li>
                <Link href="/contact">Contact</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">For Couples</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/planning-tools">Planning Tools</Link>
              </li>
              <li>
                <Link href="/wedding-website">Wedding Website</Link>
              </li>
              <li>
                <Link href="/registry">Registry</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">For Vendors</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/list-business">List Your Business</Link>
              </li>
              <li>
                <Link href="/vendor-success">Success Stories</Link>
              </li>
              <li>
                <Link href="/vendor-guide">Vendor Guide</Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-bold text-lg mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <Link href="#" className="hover:text-white">
                <Facebook className="w-6 h-6" />
              </Link>
              <Link href="#" className="hover:text-white">
                <Instagram className="w-6 h-6" />
              </Link>
              <Link href="#" className="hover:text-white">
                <Twitter className="w-6 h-6" />
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} Wedding Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

