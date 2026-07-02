"use client"

/**
 * <Icon> — the single typed icon wrapper for the dashboard redesign.
 *
 * Strategy (B2): Iconly (react-iconly) for the curated core — its rounded,
 * calm aesthetic carries nav/actions/status — with a lucide-react fallback for
 * the long tail (Iconly ships only ~104 glyphs; the dashboard uses ~190 lucide
 * names). This also satisfies the redesign plan's C-2 rule: the icons Iconly
 * matches poorly (refresh/sort/external-link/etc.) and the 5 previously
 * mis-mapped names (DollarSign/Minus/ScanLine/UserMinus/UserX) deliberately
 * stay on their correct lucide glyph via LUCIDE_MAP.
 *
 * Keys are lucide names so migrating a screen is a near-mechanical swap:
 *   <Trash2 className="h-4 w-4" />  →  <Icon name="Trash2" size={16} />
 *
 * react-iconly icons take no className and color via `currentColor`, so we wrap
 * in a span that carries the Tailwind text color (and margins). Size is the
 * `size` prop (a number), uniform across both backends.
 */

import * as React from "react"
import {
  Calendar as IlCalendar,
  Search as IlSearch,
  Plus as IlPlus,
  Delete as IlDelete,
  Edit as IlEdit,
  Filter as IlFilter,
  Filter2 as IlFilter2,
  Download as IlDownload,
  Upload as IlUpload,
  Wallet as IlWallet,
  TwoUsers as IlTwoUsers,
  User as IlUser,
  Chat as IlChat,
  Message as IlMessage,
  Send as IlSend,
  Notification as IlNotification,
  Setting as IlSetting,
  Home as IlHome,
  Star as IlStar,
  Show as IlShow,
  Hide as IlHide,
  Lock as IlLock,
  Unlock as IlUnlock,
  Logout as IlLogout,
  Login as IlLogin,
  Call as IlCall,
  Location as IlLocation,
  ShieldDone as IlShieldDone,
  ShieldFail as IlShieldFail,
  InfoCircle as IlInfoCircle,
  TimeCircle as IlTimeCircle,
  Document as IlDocument,
  Folder as IlFolder,
  Image as IlImage,
  Camera as IlCamera,
  Category as IlCategory,
  Chart as IlChart,
  Graph as IlGraph,
  Heart as IlHeart,
  Bookmark as IlBookmark,
  Play as IlPlay,
  Video as IlVideo,
  Scan as IlScan,
  Activity as IlActivity,
  Danger as IlDanger,
  TickSquare as IlTickSquare,
  CloseSquare as IlCloseSquare,
  Bag as IlBag,
  Buy as IlBuy,
  Ticket as IlTicket,
  Discount as IlDiscount,
  AddUser as IlAddUser,
  ChevronDown as IlChevronDown,
  ChevronUp as IlChevronUp,
  ChevronRight as IlChevronRight,
  ChevronLeft as IlChevronLeft,
  ArrowRight as IlArrowRight,
  ArrowLeft as IlArrowLeft,
  ArrowUp as IlArrowUp,
  ArrowDown as IlArrowDown,
  type IconProps as IconlyProps,
} from "react-iconly"
import {
  Loader2,
  Check,
  CheckCircle2,
  X,
  XCircle,
  MoreHorizontal,
  MoreVertical,
  ChevronsUpDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Copy,
  ExternalLink,
  Sparkles,
  Wand2,
  Crown,
  ThumbsUp,
  ThumbsDown,
  Megaphone,
  Package,
  DollarSign,
  Minus,
  ScanLine,
  UserMinus,
  UserX,
  UserCheck,
  RefreshCw,
  RotateCw,
  Repeat,
  Zap,
  Gauge,
  Target,
  Globe,
  Link2,
  Smile,
  Save,
  Inbox,
  Building2,
  HelpCircle,
  Truck,
  Utensils,
  // custom-fields field-type glyphs
  Type,
  AlignLeft,
  Hash,
  ToggleRight,
  ListChecks,
  Link,
  Paperclip,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

export type IconlySet = NonNullable<IconlyProps["set"]>
export type IconlyStroke = NonNullable<IconlyProps["stroke"]>

/** lucide name → Iconly component (curated good matches). */
const ICONLY_MAP = {
  Calendar: IlCalendar,
  CalendarDays: IlCalendar,
  CalendarCheck: IlCalendar,
  Search: IlSearch,
  Plus: IlPlus,
  Trash2: IlDelete,
  Trash: IlDelete,
  Pencil: IlEdit,
  PencilLine: IlEdit,
  Filter: IlFilter,
  SlidersHorizontal: IlFilter2,
  Download: IlDownload,
  Upload: IlUpload,
  FileUp: IlUpload,
  Wallet: IlWallet,
  Users: IlTwoUsers,
  Users2: IlTwoUsers,
  User: IlUser,
  MessageCircle: IlChat,
  MessageSquare: IlChat,
  Mail: IlMessage,
  Send: IlSend,
  Bell: IlNotification,
  Settings: IlSetting,
  Settings2: IlSetting,
  Home: IlHome,
  Star: IlStar,
  Eye: IlShow,
  EyeOff: IlHide,
  Lock: IlLock,
  Unlock: IlUnlock,
  LogOut: IlLogout,
  LogIn: IlLogin,
  Phone: IlCall,
  MapPin: IlLocation,
  Shield: IlShieldDone,
  ShieldCheck: IlShieldDone,
  ShieldAlert: IlShieldFail,
  Info: IlInfoCircle,
  Clock: IlTimeCircle,
  CalendarClock: IlTimeCircle,
  FileText: IlDocument,
  File: IlDocument,
  ClipboardList: IlDocument,
  Folder: IlFolder,
  Image: IlImage,
  ImageIcon: IlImage,
  Camera: IlCamera,
  LayoutGrid: IlCategory,
  Grid: IlCategory,
  BarChart: IlChart,
  BarChart3: IlChart,
  LineChart: IlGraph,
  Heart: IlHeart,
  Bookmark: IlBookmark,
  Play: IlPlay,
  Video: IlVideo,
  Scan: IlScan,
  Activity: IlActivity,
  AlertTriangle: IlDanger,
  AlertCircle: IlDanger,
  CheckSquare: IlTickSquare,
  XSquare: IlCloseSquare,
  ShoppingBag: IlBag,
  ShoppingCart: IlBuy,
  Ticket: IlTicket,
  Percent: IlDiscount,
  UserPlus: IlAddUser,
  ChevronDown: IlChevronDown,
  ChevronUp: IlChevronUp,
  ChevronRight: IlChevronRight,
  ChevronLeft: IlChevronLeft,
  ArrowRight: IlArrowRight,
  ArrowLeft: IlArrowLeft,
  ArrowUp: IlArrowUp,
  ArrowDown: IlArrowDown,
} satisfies Record<string, React.FC<IconlyProps>>

/** lucide name → lucide component. The long tail + C-2 "keep on lucide" set. */
const LUCIDE_MAP = {
  Check,
  CheckCircle2,
  X,
  XCircle,
  MoreHorizontal,
  MoreVertical,
  // C-2: poor Iconly matches kept on their correct lucide glyph
  ChevronsUpDown,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  RotateCw,
  Repeat,
  Zap,
  Gauge,
  Target,
  Globe,
  Link2,
  Smile,
  ExternalLink,
  UserCheck,
  // C-2: the 5 previously mis-mapped names — correct glyph wins
  DollarSign,
  Minus,
  ScanLine,
  UserMinus,
  UserX,
  // long tail with no clean Iconly equivalent
  CreditCard,
  Copy,
  Sparkles,
  Wand2,
  Crown,
  ThumbsUp,
  ThumbsDown,
  Megaphone,
  Package,
  Save,
  Inbox,
  Building2,
  // trade-ops domain glyphs (kitchen / fleet / live stalls)
  Truck,
  Utensils,
  // custom-fields field-type glyphs
  Type,
  AlignLeft,
  Hash,
  ToggleRight,
  ListChecks,
  Link,
  Paperclip,
} satisfies Record<string, LucideIcon>

export type IconName = keyof typeof ICONLY_MAP | keyof typeof LUCIDE_MAP

export interface IconProps {
  name: IconName
  /** Pixel size of the glyph. Default 18. */
  size?: number
  /** Iconly style set (ignored by lucide-fallback icons). Default "light". */
  variant?: IconlySet
  /** Iconly stroke weight. Default "regular". */
  stroke?: IconlyStroke
  /** Tailwind classes — color (text-*), margins, etc. */
  className?: string
  /** Accessible label. When omitted the icon is aria-hidden (decorative). */
  label?: string
}

const BASE = "inline-flex shrink-0 items-center justify-center"

/** Animated loading spinner. Iconly has no spinner — always use this for Loader2. */
export function Spinner({
  size = 16,
  className,
  label = "Loading",
}: {
  size?: number
  className?: string
  label?: string
}) {
  return (
    <span className={cn(BASE, className)} role="status" aria-label={label}>
      <Loader2 size={size} className="animate-spin" aria-hidden="true" />
    </span>
  )
}

export function Icon({
  name,
  size = 18,
  variant = "light",
  stroke = "regular",
  className,
  label,
}: IconProps) {
  const aria = label
    ? ({ role: "img", "aria-label": label } as const)
    : ({ "aria-hidden": "true" } as const)

  const Il = (ICONLY_MAP as Record<string, React.FC<IconlyProps>>)[name]
  if (Il) {
    return (
      <span className={cn(BASE, className)} {...aria}>
        <Il set={variant} size={size} stroke={stroke} />
      </span>
    )
  }

  const Lu = (LUCIDE_MAP as Record<string, LucideIcon>)[name]
  if (Lu) {
    return (
      <span className={cn(BASE, className)} {...aria}>
        <Lu size={size} aria-hidden="true" />
      </span>
    )
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error(`[Icon] Unknown icon name: "${name}". Add it to icon.tsx maps.`)
  }
  return (
    <span className={cn(BASE, className)} {...aria}>
      <HelpCircle size={size} aria-hidden="true" />
    </span>
  )
}

export default Icon
