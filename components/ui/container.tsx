import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ContainerProps {
  children: ReactNode
  className?: string
  variant?: "default" | "narrow" | "wide" | "full"
  as?: keyof JSX.IntrinsicElements
}

export function Container({ 
  children, 
  className, 
  variant = "default",
  as: Component = "div"
}: ContainerProps) {
  const baseClasses = "mx-auto"
  
  const variantClasses = {
    default: "w-[90%] px-4 sm:px-6 lg:px-8 xl:px-12",
    narrow: "w-[90%] px-4 sm:px-6 lg:px-8 xl:max-w-6xl xl:mx-auto",
    wide: "w-[90%] px-4 sm:px-6 lg:px-8 xl:px-16 2xl:px-20",
    full: "w-full px-4 sm:px-6 lg:px-8 xl:px-12"
  }

  return (
    <Component className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </Component>
  )
}

// Section wrapper with responsive padding
interface SectionProps {
  children: ReactNode
  className?: string
  variant?: "default" | "small" | "large"
  as?: keyof JSX.IntrinsicElements
}

export function Section({ 
  children, 
  className, 
  variant = "default",
  as: Component = "section"
}: SectionProps) {
  const baseClasses = "w-full"
  
  const variantClasses = {
    default: "py-8 sm:py-12 lg:py-16 xl:py-20",
    small: "py-6 sm:py-8 lg:py-12 xl:py-16",
    large: "py-12 sm:py-16 lg:py-20 xl:py-24"
  }

  return (
    <Component className={cn(baseClasses, variantClasses[variant], className)}>
      {children}
    </Component>
  )
}

// Responsive grid container
interface GridContainerProps {
  children: ReactNode
  className?: string
  cols?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: "sm" | "md" | "lg" | "xl"
}

export function GridContainer({ 
  children, 
  className, 
  cols = 1,
  gap = "md"
}: GridContainerProps) {
  const baseClasses = "grid"
  
  const colsClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
  }
  
  const gapClasses = {
    sm: "gap-4 sm:gap-6",
    md: "gap-6 sm:gap-8 lg:gap-10",
    lg: "gap-8 sm:gap-10 lg:gap-12",
    xl: "gap-10 sm:gap-12 lg:gap-16"
  }

  return (
    <div className={cn(baseClasses, colsClasses[cols], gapClasses[gap], className)}>
      {children}
    </div>
  )
}
