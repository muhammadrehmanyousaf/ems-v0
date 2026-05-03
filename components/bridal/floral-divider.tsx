import { cn } from "@/lib/utils"

// Hand-drawn gold floral divider — thin botanical curve with a centerpiece.
// Used between sections instead of a flat <hr>. Per brief: no straight
// horizontal lines on bridal surfaces.
export function FloralDivider({
  className,
  width = 280,
}: {
  className?: string
  width?: number
}) {
  const stroke = "#C9956A"
  return (
    <div
      className={cn(
        "flex items-center justify-center w-full",
        className
      )}
      aria-hidden
    >
      <svg
        width={width}
        height="22"
        viewBox="0 0 280 22"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="opacity-90"
      >
        {/* left tail */}
        <path
          d="M 0 11 C 30 11, 60 4, 90 11 C 100 13, 110 13, 120 11"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
        {/* left leaf */}
        <path
          d="M 78 8 C 84 4, 90 6, 92 11 C 90 14, 84 14, 78 8 Z"
          fill={stroke}
          fillOpacity="0.18"
          stroke={stroke}
          strokeWidth="0.6"
        />
        {/* centerpiece — small floret */}
        <g transform="translate(140 11)">
          <circle r="3" fill={stroke} />
          <circle r="6" fill="none" stroke={stroke} strokeWidth="0.6" />
          <circle r="10" fill="none" stroke={stroke} strokeWidth="0.4" strokeDasharray="1 2" />
        </g>
        {/* right leaf */}
        <path
          d="M 202 14 C 196 18, 190 16, 188 11 C 190 8, 196 8, 202 14 Z"
          fill={stroke}
          fillOpacity="0.18"
          stroke={stroke}
          strokeWidth="0.6"
        />
        {/* right tail */}
        <path
          d="M 160 11 C 170 13, 180 13, 190 11 C 220 4, 250 11, 280 11"
          stroke={stroke}
          strokeWidth="1"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
