'use client'

import { useState, useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, RefreshCw, Server } from 'lucide-react'
import { checkBackendHealth, type HealthStatus } from '@/lib/utils/health-check'

interface BackendStatusProps {
  showDetails?: boolean
  className?: string
}

export function BackendStatus({ showDetails = false, className = '' }: BackendStatusProps) {
  const [status, setStatus] = useState<HealthStatus | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const checkHealth = async () => {
    setIsChecking(true)
    try {
      const healthStatus = await checkBackendHealth()
      setStatus(healthStatus)
    } catch (error) {
      setStatus({
        isHealthy: false,
        message: 'Failed to check server status',
        timestamp: Date.now()
      })
    } finally {
      setIsChecking(false)
    }
  }

  useEffect(() => {
    checkHealth()
    
    // Check every 30 seconds
    const interval = setInterval(checkHealth, 30000)
    return () => clearInterval(interval)
  }, [])

  if (!status) {
    return null
  }

  if (status.isHealthy && !showDetails) {
    return null
  }

  return (
    <Alert className={`${className} ${status.isHealthy ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
      <div className="flex items-center gap-2">
        {status.isHealthy ? (
          <Wifi className="h-4 w-4 text-green-600" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-600" />
        )}
        <AlertTitle className="text-sm font-medium">
          {status.isHealthy ? 'Server Online' : 'Server Offline'}
        </AlertTitle>
        <Badge variant={status.isHealthy ? 'default' : 'destructive'} className="text-xs">
          {status.isHealthy ? 'Healthy' : 'Unhealthy'}
        </Badge>
      </div>
      
      <AlertDescription className="mt-2 text-sm">
        {status.message}
      </AlertDescription>
      
      {!status.isHealthy && (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-gray-600">
            The application will continue to work with cached data, but some features may be limited.
          </p>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkHealth}
              disabled={isChecking}
              className="text-xs"
            >
              {isChecking ? (
                <RefreshCw className="h-3 w-3 animate-spin mr-1" />
              ) : (
                <RefreshCw className="h-3 w-3 mr-1" />
              )}
              Retry
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.open('http://localhost:3000', '_blank')}
              className="text-xs"
            >
              <Server className="h-3 w-3 mr-1" />
              Open Server
            </Button>
          </div>
        </div>
      )}
    </Alert>
  )
}
