"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Icon } from "@/components/dashboard/shared/icon"

/**
 * SectionErrorBoundary — per-section React error boundary with retry. Fixes the
 * "toast-only error handling" gap: when a section throws, the rest of the
 * dashboard stays usable and the user can retry just that section.
 *
 * `resetKeys` — when any value changes, the boundary clears its error (e.g. pass
 * the active filter/route so navigating away recovers automatically).
 */
interface Props {
  children: React.ReactNode
  /** Custom fallback renderer. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode
  resetKeys?: unknown[]
  className?: string
  label?: string
}

interface State {
  error: Error | null
}

export class SectionErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[SectionErrorBoundary]", this.props.label ?? "", error, info)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && this.props.resetKeys && prev.resetKeys) {
      const changed = this.props.resetKeys.some((k, i) => k !== prev.resetKeys![i])
      if (changed) this.reset()
    }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    if (this.props.fallback) return this.props.fallback(error, this.reset)
    return (
      <div
        role="alert"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center",
          this.props.className,
        )}
      >
        <span className="grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <Icon name="AlertTriangle" size={22} />
        </span>
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Something went wrong here</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            This section failed to load. Your other work is safe — try again.
          </p>
        </div>
        <button
          type="button"
          onClick={this.reset}
          className="inline-flex items-center gap-1.5 rounded-lg border border-input px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <Icon name="RefreshCw" size={14} />
          Retry
        </button>
      </div>
    )
  }
}

export default SectionErrorBoundary
