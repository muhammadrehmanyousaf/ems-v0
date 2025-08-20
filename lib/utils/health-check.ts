import { BACKEND_URL } from '@/lib/backend-url'

/**
 * Health check utilities for backend server
 */

export interface HealthStatus {
  isHealthy: boolean
  message: string
  timestamp: number
}

// Check if backend server is running
export async function checkBackendHealth(): Promise<HealthStatus> {
  const timestamp = Date.now()
  
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
    
    const response = await fetch(`${BACKEND_URL}api/v1/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    })
    
    clearTimeout(timeoutId)
    
    if (response.ok) {
      return {
        isHealthy: true,
        message: 'Backend server is running',
        timestamp
      }
    } else {
      return {
        isHealthy: false,
        message: `Backend server responded with status: ${response.status}`,
        timestamp
      }
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return {
        isHealthy: false,
        message: 'Backend server is not responding (timeout)',
        timestamp
      }
    }
    
    if (error.code === 'ERR_NETWORK') {
      return {
        isHealthy: false,
        message: 'Backend server is not reachable. Please check if the server is running on localhost:3000',
        timestamp
      }
    }
    
    return {
      isHealthy: false,
      message: `Backend server error: ${error.message}`,
      timestamp
    }
  }
}

// Get a user-friendly error message
export function getErrorMessage(error: any): string {
  if (error?.code === 'ERR_NETWORK') {
    return 'Network error: Unable to connect to the server. Please check your internet connection and ensure the backend server is running.'
  }
  
  if (error?.response?.status === 404) {
    return 'Resource not found: The requested data could not be found.'
  }
  
  if (error?.response?.status >= 500) {
    return 'Server error: The server is experiencing issues. Please try again later.'
  }
  
  if (error?.message?.includes('timeout')) {
    return 'Request timeout: The server is taking too long to respond. Please try again.'
  }
  
  return error?.message || 'An unexpected error occurred. Please try again.'
}

// Check if we should use cached data
export function shouldUseCache(error: any): boolean {
  return error?.code === 'ERR_NETWORK' || 
         error?.response?.status >= 500 ||
         error?.message?.includes('timeout')
}
