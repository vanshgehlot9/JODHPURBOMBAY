"use client"

import { useState, useEffect } from 'react'

/**
 * Custom hook to monitor online/offline status
 * @returns Object containing online status and last offline time
 */
export function useNetworkStatus() {
  // Initialize as true to match server render
  const [isOnline, setIsOnline] = useState(true)
  const [lastOfflineTime, setLastOfflineTime] = useState<Date | null>(null)

  useEffect(() => {
    // Check initial status only on client
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine)
    }

    const handleOnline = () => {
      console.log('Network: Back online')
      setIsOnline(true)
    }

    const handleOffline = () => {
      console.log('Network: Connection lost')
      setIsOnline(false)
      setLastOfflineTime(new Date())
    }

    // Add event listeners
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, lastOfflineTime }
}

/**
 * Custom hook to detect slow connections
 * @param threshold - Threshold in ms for slow connection (default: 3000)
 * @returns boolean indicating if connection is slow
 */
export function useSlowConnection(threshold = 3000) {
  const [isSlow, setIsSlow] = useState(false)

  useEffect(() => {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return
    }

    const connection = (navigator as any).connection

    const checkConnection = () => {
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        setIsSlow(true)
      } else if (connection.rtt > threshold || connection.downlink < 0.5) {
        setIsSlow(true)
      } else {
        setIsSlow(false)
      }
    }

    checkConnection()
    connection.addEventListener('change', checkConnection)

    return () => {
      connection.removeEventListener('change', checkConnection)
    }
  }, [threshold])

  return isSlow
}
