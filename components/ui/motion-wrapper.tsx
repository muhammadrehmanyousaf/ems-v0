"use client"

import { ReactNode, useEffect, useRef, useState } from "react"
import {
  motion,
  useScroll,
  useTransform,
  useInView,
  type Variant,
} from "framer-motion"

// ─── ScrollReveal ──────────────────────────────────────────────
// Wraps any content with scroll-triggered entrance animation

type RevealVariant = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "blur"

const revealVariants: Record<RevealVariant, { hidden: Variant; visible: Variant }> = {
  "fade-up": {
    hidden: { opacity: 0, y: 40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-down": {
    hidden: { opacity: 0, y: -40 },
    visible: { opacity: 1, y: 0 },
  },
  "fade-left": {
    hidden: { opacity: 0, x: -40 },
    visible: { opacity: 1, x: 0 },
  },
  "fade-right": {
    hidden: { opacity: 0, x: 40 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  blur: {
    hidden: { opacity: 0, filter: "blur(10px)" },
    visible: { opacity: 1, filter: "blur(0px)" },
  },
}

interface ScrollRevealProps {
  children: ReactNode
  variant?: RevealVariant
  delay?: number
  duration?: number
  className?: string
  once?: boolean
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 0.6,
  className,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: "0px 0px -80px 0px" })
  const v = revealVariants[variant]

  /**
   * WW-PERF — content is rendered VISIBLE on the server, and only becomes
   * animatable once the component has mounted in the browser.
   *
   * `initial="hidden"` is applied during server rendering too, so everything
   * wrapped in a ScrollReveal shipped as `opacity: 0` and stayed invisible
   * until framer-motion had downloaded, hydrated, and an IntersectionObserver
   * had fired. For anything above the fold that is the largest paint, so the
   * page could not complete its LCP until JavaScript ran.
   *
   * Measured across 22 public templates: Render Delay of 4,000-6,800ms on 19 of
   * them, including static pages like /about and /help which fetch nothing at
   * all and had no other reason to be slow.
   *
   * After mount the behaviour is unchanged: anything already on screen is
   * simply left visible (no flash, no pointless animation for something the
   * visitor is already looking at), and anything off screen animates in on
   * scroll exactly as before. Without JavaScript the content is now readable
   * rather than invisible, which is also the accessible outcome.
   */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  /**
   * The observer needs an ELEMENT on the very first render.
   *
   * `useInView` attaches its IntersectionObserver in an effect that reads
   * `ref.current` once. The pre-mount branch below used to render without the
   * ref, so on that first pass `ref.current` was null, the effect bailed, and
   * because a ref does not re-run effects it never attached at all. `isInView`
   * then stayed false forever and the content sat at opacity 0 permanently —
   * 26 large blocks on the live homepage, still invisible after scrolling the
   * whole page. Both branches render the same tag, so React reuses the DOM node
   * and the observer stays pointed at it when `mounted` flips.
   *
   * `settled` is the belt to that braces: whatever happens to the observer,
   * content becomes visible. Invisible content is a worse failure than a
   * missing animation, and this component had already produced it once.
   */
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 2000)
    return () => clearTimeout(t)
  }, [])

  const show = isInView || settled

  if (!mounted) {
    return <div ref={ref} className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={show ? "visible" : "hidden"}
      animate={show ? "visible" : "hidden"}
      variants={{
        hidden: v.hidden,
        visible: { ...v.visible, transition: { duration, delay, ease: [0.25, 0.4, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── StaggerContainer + StaggerItem ────────────────────────────
// Staggers children entrance animations

interface StaggerContainerProps {
  children: ReactNode
  staggerDelay?: number
  className?: string
  once?: boolean
}

export function StaggerContainer({
  children,
  staggerDelay = 0.1,
  className,
  once = true,
}: StaggerContainerProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: "0px 0px -60px 0px" })

  // This one attaches its ref immediately, so it does not have ScrollReveal's
  // bug — but it hides its children behind the same observer, and invisible
  // content is what just went out on the live site. Same fallback.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 2000)
    return () => clearTimeout(t)
  }, [])
  const show = isInView || settled

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={show ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: staggerDelay } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

interface StaggerItemProps {
  children: ReactNode
  className?: string
  variant?: RevealVariant
}

export function StaggerItem({ children, className, variant = "fade-up" }: StaggerItemProps) {
  const v = revealVariants[variant]
  return (
    <motion.div
      variants={{
        hidden: v.hidden,
        visible: { ...v.visible, transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─── ParallaxSection ───────────────────────────────────────────
// Applies parallax scroll offset to children

interface ParallaxSectionProps {
  children: ReactNode
  speed?: number
  className?: string
}

export function ParallaxSection({ children, speed = 0.3, className }: ParallaxSectionProps) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], [`${speed * -100}px`, `${speed * 100}px`])

  return (
    <div ref={ref} className={className} style={{ overflow: "hidden" }}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  )
}

// ─── TextReveal ────────────────────────────────────────────────
// Word-by-word or character-by-character stagger reveal

interface TextRevealProps {
  text: string
  mode?: "word" | "char"
  className?: string
  staggerDelay?: number
  once?: boolean
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span"
}

export function TextReveal({
  text,
  mode = "word",
  className,
  staggerDelay = 0.05,
  once = true,
  as: Tag = "h2",
}: TextRevealProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, margin: "0px 0px -40px 0px" })

  const units = mode === "word" ? text.split(" ") : text.split("")

  /**
   * WW-PERF — same reason as ScrollReveal above: every word was a motion.span
   * with `initial={{ opacity: 0 }}`, so headings rendered by this component
   * were served invisible and could not paint until framer-motion hydrated.
   * Headings are frequently the largest paint on a text-heavy page — /about's
   * LCP element is a paragraph, and the page measured 4,918ms of render delay.
   *
   * On the server, and until this mounts, the text is rendered plainly. It
   * reads identically, it is selectable and announced identically, and it
   * paints immediately.
   */
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Same fault, same fix as ScrollReveal above — see the note there.
  const [settled, setSettled] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSettled(true), 2000)
    return () => clearTimeout(t)
  }, [])
  const show = isInView || settled

  if (!mounted) {
    return (
      <Tag ref={ref} className={className} aria-label={text}>
        {text}
      </Tag>
    )
  }

  return (
    <Tag ref={ref} className={className} aria-label={text}>
      {units.map((unit, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
          animate={
            show
              ? {
                  opacity: 1,
                  y: 0,
                  filter: "blur(0px)",
                  transition: {
                    duration: 0.4,
                    delay: i * staggerDelay,
                    ease: [0.25, 0.4, 0.25, 1],
                  },
                }
              : {}
          }
          style={{ display: "inline-block", whiteSpace: mode === "word" ? "pre" : undefined }}
        >
          {unit}
          {mode === "word" && i < units.length - 1 ? "\u00A0" : ""}
        </motion.span>
      ))}
    </Tag>
  )
}

// ─── CountUp ───────────────────────────────────────────────────
// Animated number counter triggered on scroll

interface CountUpProps {
  end: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  once?: boolean
}

export function CountUp({
  end,
  duration = 2,
  prefix = "",
  suffix = "",
  className,
  once = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once, margin: "0px 0px -40px 0px" })
  // Seed with the target so SSR + a JS-less/animation-skipped client both show
  // the real number instead of a "0" (was the source of the "0+" stat flash).
  const [count, setCount] = useState(end)

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const startTime = performance.now()

    function animate(currentTime: number) {
      const elapsed = (currentTime - startTime) / 1000
      const progress = Math.min(elapsed / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = Math.round(eased * end)
      setCount(current)
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [isInView, end, duration])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {count.toLocaleString()}
      {suffix}
    </span>
  )
}
