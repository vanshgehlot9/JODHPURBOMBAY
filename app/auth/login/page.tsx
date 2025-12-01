"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { LogIn, Truck, Mail, Lock, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Success",
        description: "Logged in successfully!",
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/40">
      {/* Animated Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,.03)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_110%)]"></div>

      {/* Driving Truck Animation */}
      <div className="absolute top-20 left-0 w-full h-24 overflow-hidden pointer-events-none">
        <div className="animate-truck-drive">
          <div className="flex items-center gap-3">
            <Truck className="h-16 w-16 text-indigo-600/40" />
            <div className="flex gap-1">
              <div className="h-2 w-2 rounded-full bg-indigo-400/40 animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="h-2 w-2 rounded-full bg-indigo-400/40 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 rounded-full bg-indigo-400/40 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Road Lines Animation */}
      <div className="absolute top-32 left-0 w-full h-1 overflow-hidden pointer-events-none opacity-30">
        <div className="animate-road-lines flex gap-8">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="h-1 w-12 bg-gray-400"></div>
          ))}
        </div>
      </div>

      {/* Floating Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md animate-in slide-up">
        <Card className="border-0 shadow-2xl ring-1 ring-gray-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center space-y-6 pt-12 pb-8">
            {/* Logo with Modern Styling */}
            <div className="flex justify-center">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity duration-500 animate-pulse"></div>
                <div className="relative p-5 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl transform group-hover:scale-105 transition-transform duration-300">
                  <Truck className="h-14 w-14 text-white" />
                </div>
              </div>
            </div>

            {/* Title Section */}
            <div className="space-y-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-900 bg-clip-text text-transparent">
                JBRC Login
              </h1>
              <p className="text-sm text-gray-600 font-medium">
                Jodhpur Bombay Road Carrier Management
              </p>
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-indigo-300"></div>
              <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-indigo-300"></div>
            </div>
          </CardHeader>

          <CardContent className="px-8 pb-10">
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email Input */}
              <div className="space-y-2 animate-in slide-up" style={{ animationDelay: '100ms' }}>
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-indigo-600" />
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2 animate-in slide-up" style={{ animationDelay: '200ms' }}>
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Lock className="h-4 w-4 text-indigo-600" />
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="h-12 pr-12 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600 transition-colors duration-200"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mt-6 animate-in slide-up"
                style={{ animationDelay: '300ms' }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white mr-3"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <LogIn className="h-5 w-5 mr-2" />
                    <span>Sign In</span>
                  </div>
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center space-y-3 animate-in fade-in" style={{ animationDelay: '400ms' }}>
              <div className="flex items-center justify-center gap-2">
                <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-300"></div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Secure Access</p>
                <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-300"></div>
              </div>
              <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                <Lock className="h-3 w-3" />
                Protected by Firebase Authentication
              </p>
              <div className="pt-4 border-t border-gray-200 mt-6">
                <p className="text-xs text-gray-500">
                  © 2025 <span className="font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Shivkara Digital</span>
                </p>
                <p className="text-xs text-gray-400 mt-1">All rights reserved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subtle Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600/20 via-purple-600/20 to-indigo-600/20 rounded-2xl opacity-0 group-hover:opacity-100 blur-2xl -z-10 transition-opacity duration-500"></div>
      </div>
    </div>
  )
}
