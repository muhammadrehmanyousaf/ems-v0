'use client'

import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

export function PerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [stats, setStats] = useState({
    cacheHits: 0,
    apiCalls: 0,
    cacheSize: 0,
    lastUpdated: new Date()
  })
  
  const queryClient = useQueryClient()

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return

    const updateStats = () => {
      const queries = queryClient.getQueryCache().getAll()
      const mutations = queryClient.getMutationCache().getAll()
      
      setStats({
        cacheHits: queries.filter(q => q.state.dataUpdatedAt > q.state.dataUpdatedAt - 60000).length,
        apiCalls: mutations.length,
        cacheSize: queries.length,
        lastUpdated: new Date()
      })
    }

    const interval = setInterval(updateStats, 5000)
    updateStats()

    return () => clearInterval(interval)
  }, [queryClient])

  // Toggle visibility with Ctrl+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (!isVisible || process.env.NODE_ENV !== 'development') return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor</div>
      <div>Cache Hits: {stats.cacheHits}</div>
      <div>API Calls: {stats.apiCalls}</div>
      <div>Cache Size: {stats.cacheSize}</div>
      <div>Updated: {stats.lastUpdated.toLocaleTimeString()}</div>
      <div className="mt-2 text-gray-400">Press Ctrl+Shift+P to toggle</div>
    </div>
  )
}
