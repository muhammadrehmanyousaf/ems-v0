// Global design tokens and utility classes
export const designTokens = {
  colors: {
    primary: {
      50: '#fdf2f8',
      100: '#fce7f3',
      200: '#fbcfe8',
      300: '#f9a8d4',
      400: '#f472b6',
      500: '#ec4899',
      600: '#db2777',
      700: '#be185d',
      800: '#9d174d',
      900: '#831843',
    },
    secondary: {
      50: '#faf5ff',
      100: '#f3e8ff',
      200: '#e9d5ff',
      300: '#d8b4fe',
      400: '#c084fc',
      500: '#a855f7',
      600: '#9333ea',
      700: '#7c3aed',
      800: '#6b21a8',
      900: '#581c87',
    },
    gray: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    }
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  }
}

// Utility classes for vendor cards
export const vendorCardClasses = {
  container: "group h-full cursor-pointer overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 bg-white",
  imageContainer: "relative aspect-[4/3] overflow-hidden",
  image: "object-cover transition-transform duration-300 group-hover:scale-105",
  content: "p-4 space-y-3",
  title: "font-semibold text-lg leading-tight group-hover:text-primary transition-colors",
  location: "flex items-center text-gray-600 text-sm",
  rating: "flex items-center gap-2",
  price: "text-lg font-bold text-primary",
  badge: "bg-white/90 text-gray-800 border-0",
  sponsoredBadge: "bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0",
  favoriteButton: "absolute top-3 right-3 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white p-0",
  bookButton: "w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg",
}

// Responsive breakpoints
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
}

// Animation durations
export const animations = {
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '500ms',
}

// Z-index scale
export const zIndex = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} 