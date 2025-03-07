"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, Calendar, MapPin, PartyPopper, Sparkles, Music, Cake } from "lucide-react"

export default function NotFound() {
  const [confetti, setConfetti] = useState<
    Array<{ id: number; x: number; y: number; size: number; color: string; rotation: number }>
  >([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Create initial confetti pieces
    const initialConfetti = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * -50,
      size: Math.random() * 15 + 5,
      color: ["#FF5757", "#FFD166", "#06D6A0", "#118AB2", "#073B4C"][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
    }))

    setConfetti(initialConfetti)

    // Animate confetti falling
    const interval = setInterval(() => {
      setConfetti((prev) =>
        prev.map((piece) => ({
          ...piece,
          y: piece.y + 1 > 120 ? Math.random() * -20 - 10 : piece.y + 1,
          x: piece.x + (Math.random() - 0.5) * 2,
          rotation: (piece.rotation + 5) % 360,
        })),
      )
    }, 50)

    return () => clearInterval(interval)
  }, [])

  // Party character SVG
  const PartyCharacter = () => (
    <div className="relative w-64 h-64 md:w-80 md:h-80">
      {/* Character base */}
      <div className="absolute top-1/4 left-1/2 transform -translate-x-1/2 w-40 h-40 md:w-48 md:h-48">
        {/* Head */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-teal-500 rounded-full">
          {/* Face */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-16 h-10 bg-[#ffb6a3] rounded-full">
            {/* Eyes */}
            <div className="absolute top-2 left-3 w-2 h-2 bg-gray-800 rounded-full"></div>
            <div className="absolute top-2 right-3 w-2 h-2 bg-gray-800 rounded-full"></div>
            {/* Mouth */}
            <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-2 bg-gray-800 rounded-full"></div>
            {/* Cheeks */}
            <div className="absolute top-3 left-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
            <div className="absolute top-3 right-1 w-1.5 h-1.5 bg-red-400 rounded-full"></div>
          </div>
          {/* Hair accessory */}
          <div className="absolute top-1 right-4 w-4 h-6 bg-yellow-400 rotate-45 clip-path-triangle"></div>
        </div>

        {/* Body */}
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 w-20 h-28 bg-teal-400">
          {/* Buttons */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-purple-700 rounded-full"></div>
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-purple-700 rounded-full"></div>

          {/* Stripes */}
          <div className="absolute top-16 left-0 w-full h-4 bg-purple-700"></div>
          <div className="absolute top-22 left-0 w-full h-4 bg-purple-700"></div>
        </div>

        {/* Arms */}
        <div className="absolute top-24 left-0 w-4 h-12 bg-[#ffb6a3]"></div>
        <div className="absolute top-24 right-0 w-4 h-12 bg-[#ffb6a3]"></div>

        {/* Legs */}
        <div className="absolute bottom-0 left-4 w-4 h-12 bg-[#ffb6a3]"></div>
        <div className="absolute bottom-0 right-4 w-4 h-12 bg-[#ffb6a3]"></div>

        {/* Megaphone */}
        <div className="absolute top-28 right-0 w-12 h-8 bg-yellow-400 transform rotate-12"></div>
      </div>

      {/* Puddle */}
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-red-200 rounded-full"></div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-8 overflow-hidden">
      {/* Animated background elements */}
      {mounted && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {confetti.map((piece) => (
            <div
              key={piece.id}
              className="absolute"
              style={{
                left: `${piece.x}%`,
                top: `${piece.y}%`,
                width: `${piece.size}px`,
                height: `${piece.size}px`,
                backgroundColor: piece.color,
                borderRadius: "50%",
                transform: `rotate(${piece.rotation}deg)`,
                opacity: 0.7,
                transition: "top 0.5s linear, left 0.5s ease-in-out, transform 0.5s linear",
              }}
            />
          ))}

          {/* Floating icons */}
          <div className="absolute top-1/4 left-1/4 animate-float opacity-20">
            <PartyPopper className="h-12 w-12 text-primary" />
          </div>
          <div className="absolute top-1/3 right-1/4 animate-float-delayed opacity-20">
            <Cake className="h-10 w-10 text-pink-500" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 animate-float-slow opacity-20">
            <Music className="h-8 w-8 text-purple-500" />
          </div>
          <div className="absolute top-2/3 right-1/3 animate-float-slower opacity-20">
            <Calendar className="h-14 w-14 text-blue-500" />
          </div>
        </div>
      )}

      <div className="max-w-2xl w-full space-y-8 relative z-10">
        <div className="space-y-4 text-center">
          <h1 className="text-[80px] md:text-[120px] font-bold text-gray-800 leading-none animate-bounce-slow">
            Oops!
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 max-w-md mx-auto">
            We can't seem to find the page you're looking for.
          </p>

          <p className="text-sm text-muted-foreground">Error code: 404</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div className="space-y-6 order-2 md:order-1">
            <div className="space-y-4">
              <p className="text-base text-gray-600 font-medium">Here are some helpful links instead:</p>

              <div className="space-y-3">
                <Link href="/" className="flex items-center text-primary hover:underline gap-2 transition-colors group">
                  <span className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Home className="h-4 w-4" />
                  </span>
                  <span>Home</span>
                </Link>

                <Link
                  href="/search"
                  className="flex items-center text-primary hover:underline gap-2 transition-colors group"
                >
                  <span className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Search className="h-4 w-4" />
                  </span>
                  <span>Search Events</span>
                </Link>

                <Link
                  href="/events"
                  className="flex items-center text-primary hover:underline gap-2 transition-colors group"
                >
                  <span className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                    <Calendar className="h-4 w-4" />
                  </span>
                  <span>Browse All Events</span>
                </Link>

                <Link
                  href="/venues"
                  className="flex items-center text-primary hover:underline gap-2 transition-colors group"
                >
                  <span className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <span>Explore Venues</span>
                </Link>
              </div>
            </div>

            <div className="pt-4">
              <Button asChild size="lg" className="gap-2 group">
                <Link href="/">
                  <Home className="h-4 w-4 group-hover:animate-bounce" />
                  <span>Back to Homepage</span>
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative flex justify-center items-center order-1 md:order-2">
            {mounted && (
              <>
                {/* Character illustration */}
                <div className="relative">
                  <PartyCharacter />

                  {/* Animated sparkles around character */}
                  <div className="absolute -top-4 -right-4 animate-ping-slow">
                    <Sparkles className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div className="absolute top-1/4 -left-4 animate-ping-delayed">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="absolute bottom-1/4 -right-6 animate-ping-slower">
                    <Sparkles className="h-7 w-7 text-blue-400" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

