import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
  	extend: {
  		colors: {
  			// ── Bridal palette (Phase 0 — design revamp) ─────────────────
  			// Pakistani wedding aesthetic: ivory silk, champagne gold, rose
  			// petal, deep mauve, sage mehndi, dusty coral, warm charcoal.
  			// Use these for all NEW components going through the revamp.
  			bridal: {
  				ivory: '#FDF8F2',
  				cream: '#FFF9F4',
  				blush: '#FFF0F3',
  				rose: '#F2B5C0',
  				gold: '#C9956A',
  				'gold-dark': '#B07D54',
  				mauve: '#8B5A72',
  				sage: '#A8C4A2',
  				coral: '#E8917A',
  				charcoal: '#2C1810',
  				beige: '#EDD9C3',
  				sand: '#F5E6D3',
  				text: '#5C3D2E',
  				'text-soft': '#7A5040',
  				'text-label': '#A0694A',
  			},
  			gold: {
  				50: '#FFFDF5',
  				100: '#FFF9E6',
  				200: '#FFF0BF',
  				300: '#FFE699',
  				400: '#E8C84A',
  				500: '#D4AF37',
  				600: '#B8962E',
  				700: '#8C7223',
  				800: '#604E18',
  				900: '#3D310F',
  				950: '#1F1908',
  				DEFAULT: 'hsl(var(--gold))',
  				foreground: 'hsl(var(--gold-foreground))',
  				muted: 'hsl(var(--gold-muted))',
  			},
  			purple: {
  				50: '#F5F3FF',
  				100: '#EDE9FE',
  				200: '#DDD6FE',
  				300: '#C4B5FD',
  				400: '#A78BFA',
  				500: '#8B5CF6',
  				600: '#7C3AED',
  				700: '#6D28D9',
  				800: '#5B21B6',
  				900: '#4C1D95',
  				950: '#2E1065',
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-playfair)', 'Georgia', 'Times New Roman', 'serif'],
  			// `sans` keeps the legacy Inter mapping so existing screens don't
  			// shift mid-revamp. New bridal screens should use `font-bridal`
  			// (DM Sans) explicitly via Tailwind class.
  			sans: ['var(--font-inter)', 'Arial', 'Helvetica', 'sans-serif'],
  			bridal: ['var(--font-dm-sans)', 'Helvetica Neue', 'Arial', 'sans-serif'],
  			display: ['var(--font-playfair)', 'Georgia', 'Times New Roman', 'serif'],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
		screens: {
        '2xsmall': '320px',
        xsmall: '512px',
        small: '1024px',
        medium: '1280px',
        large: '1440px',
        xxl: '1500px',
        xlarge: '1680px',
        '2xlarge': '1920px'
      },
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'spinner-leaf-fade': {
  				'0%, 100%': { opacity: '0' },
  				'50%': { opacity: '1' }
  			},
  			'fade-up': {
  				'0%': { opacity: '0', transform: 'translateY(20px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' }
  			},
  			'fade-in': {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' }
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			'shimmer': {
  				'0%': { backgroundPosition: '200% center' },
  				'100%': { backgroundPosition: '-200% center' }
  			},
  			'scale-in': {
  				'0%': { opacity: '0', transform: 'scale(0.95)' },
  				'100%': { opacity: '1', transform: 'scale(1)' }
  			},
  			'slide-in-right': {
  				'0%': { opacity: '0', transform: 'translateX(20px)' },
  				'100%': { opacity: '1', transform: 'translateX(0)' }
  			},
  			'ken-burns': {
  				'0%': { transform: 'scale(1) translate(0, 0)' },
  				'50%': { transform: 'scale(1.12) translate(-1%, -1%)' },
  				'100%': { transform: 'scale(1) translate(0, 0)' },
  			},
  			'gradient-shift': {
  				'0%, 100%': { backgroundPosition: '0% 50%' },
  				'50%': { backgroundPosition: '100% 50%' },
  			},
  			'pulse-glow': {
  				'0%, 100%': { boxShadow: '0 0 8px rgba(124, 58, 237, 0.3)' },
  				'50%': { boxShadow: '0 0 24px rgba(124, 58, 237, 0.6)' },
  			},
  			'blur-in': {
  				'0%': { opacity: '0', filter: 'blur(12px)' },
  				'100%': { opacity: '1', filter: 'blur(0)' },
  			},
  			'ripple': {
  				'0%': { transform: 'scale(0)', opacity: '0.5' },
  				'100%': { transform: 'scale(4)', opacity: '0' },
  			},
  			'bounce-dot': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(8px)' },
  			},
  			'slide-up-fade': {
  				'0%': { opacity: '0', transform: 'translateY(16px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  			// ── Bridal motion ─────────────────────────────────────────
  			'petal-fall': {
  				'0%': { transform: 'translate3d(0, -8%, 0) rotate(0deg)', opacity: '0' },
  				'10%': { opacity: '0.85' },
  				'100%': { transform: 'translate3d(40px, 110vh, 0) rotate(360deg)', opacity: '0' },
  			},
  			'petal-drift': {
  				'0%, 100%': { transform: 'translate3d(0, 0, 0) rotate(0deg)' },
  				'50%': { transform: 'translate3d(20px, -16px, 0) rotate(8deg)' },
  			},
  			'stagger-fade-up': {
  				'0%': { opacity: '0', transform: 'translateY(14px)' },
  				'100%': { opacity: '1', transform: 'translateY(0)' },
  			},
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'spinner-leaf-fade': 'spinner-leaf-fade 800ms linear infinite',
  			'fade-up': 'fade-up 0.6s ease-out forwards',
  			'fade-in': 'fade-in 0.4s ease-out forwards',
  			'float': 'float 6s ease-in-out infinite',
  			'shimmer': 'shimmer 3s linear infinite',
  			'scale-in': 'scale-in 0.3s ease-out forwards',
  			'slide-in-right': 'slide-in-right 0.4s ease-out forwards',
  			'ken-burns': 'ken-burns 20s ease-in-out infinite',
  			'gradient-shift': 'gradient-shift 6s ease infinite',
  			'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
  			'blur-in': 'blur-in 0.6s ease-out forwards',
  			'ripple': 'ripple 0.6s linear forwards',
  			'bounce-dot': 'bounce-dot 1.5s ease-in-out infinite',
  			'slide-up-fade': 'slide-up-fade 0.5s ease-out forwards',
  			'petal-fall': 'petal-fall 14s linear infinite',
  			'petal-drift': 'petal-drift 8s ease-in-out infinite',
  			'stagger-fade-up': 'stagger-fade-up 0.5s ease-out forwards',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
