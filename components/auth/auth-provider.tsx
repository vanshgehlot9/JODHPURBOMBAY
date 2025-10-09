"use client"

import type React from "react"

import { createContext, useContext, useEffect, useState } from "react"
import { type User, onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useRouter, usePathname } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
})

export const useAuth = () => useContext(AuthContext)

// Session expiry time: 6 hours in milliseconds
const SESSION_DURATION = 6 * 60 * 60 * 1000 // 6 hours
const WARNING_TIME = 5 * 60 * 1000 // Show warning 5 minutes before expiry

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user)
      setLoading(false)

      // Set login timestamp when user logs in
      if (user && typeof window !== 'undefined') {
        const existingTimestamp = localStorage.getItem('loginTimestamp')
        if (!existingTimestamp) {
          localStorage.setItem('loginTimestamp', Date.now().toString())
        }
      } else if (typeof window !== 'undefined') {
        // Clear timestamp on logout
        localStorage.removeItem('loginTimestamp')
      }

      // Handle redirects on client side
      if (typeof window !== 'undefined') {
        const currentPath = window.location.pathname
        if (!user && currentPath !== "/auth/login") {
          window.location.href = "/auth/login"
        } else if (user && currentPath === "/auth/login") {
          window.location.href = "/"
        }
      }
    })

    return () => unsubscribe()
  }, [])

  // Session expiry check
  useEffect(() => {
    if (!user || typeof window === 'undefined') return

    let warningShown = false

    const checkSessionExpiry = async () => {
      const loginTimestamp = localStorage.getItem('loginTimestamp')
      if (!loginTimestamp) return

      const loginTime = parseInt(loginTimestamp, 10)
      const currentTime = Date.now()
      const elapsedTime = currentTime - loginTime
      const remainingTime = SESSION_DURATION - elapsedTime

      // Session expired - auto logout
      if (remainingTime <= 0) {
        await signOut(auth)
        localStorage.removeItem('loginTimestamp')
        alert("Session expired. Please login again.")
        window.location.href = "/auth/login"
        return
      }

      // Show warning 5 minutes before expiry
      if (remainingTime <= WARNING_TIME && !warningShown) {
        warningShown = true
        const minutesLeft = Math.ceil(remainingTime / 60000)
        console.log(`Session expiring in ${minutesLeft} minutes`)
      }
    }

    // Check immediately
    checkSessionExpiry()

    // Check every minute
    const interval = setInterval(checkSessionExpiry, 60000)

    return () => clearInterval(interval)
  }, [user])

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>
}
