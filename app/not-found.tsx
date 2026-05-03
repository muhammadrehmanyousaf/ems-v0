'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-bridal-cream via-white to-bridal-cream/30 flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center">
        <div className="relative mb-8">
          <span className="text-[150px] sm:text-[200px] font-bold text-bridal-cream leading-none select-none">
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-bridal-gold/15 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 sm:w-12 sm:h-12 text-bridal-gold/70" />
            </div>
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mb-3">
          Page Not Found
        </h1>
        <p className="text-neutral-600 mb-8 text-sm sm:text-base max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={() => window.history.back()}
            variant="outline"
            className="w-full sm:w-auto border-bridal-gold/45 text-bridal-gold-dark hover:bg-bridal-cream min-h-[44px]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
          <Link href="/">
            <Button className="w-full sm:w-auto bg-gradient-to-r from-bridal-gold to-bridal-gold-dark hover:from-bridal-gold-dark hover:to-bridal-gold-dark text-white min-h-[44px]">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
