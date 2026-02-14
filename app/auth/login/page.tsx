"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { ArrowRight, Shield, Disc, Wifi, Cpu } from "lucide-react"
import dynamic from 'next/dynamic'

// Dynamically import the 3D scene to avoid SSR issues with Canvas
const Login3DScene = dynamic(() => import('@/components/auth/Login3D'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full text-blue-500/50 animate-pulse">
      <div className="text-xs font-mono tracking-widest uppercase">Initializing 3D Engine...</div>
    </div>
  )
})

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    await new Promise(r => setTimeout(r, 800))

    try {
      await signInWithEmailAndPassword(auth, email, password)
      toast({
        title: "Biometric Verified",
        description: "Access granted to JBRC Mainframe.",
        className: "bg-blue-950 text-blue-100 border-blue-800"
      })
      router.push("/")
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: "Invalid credentials. Incident reported.",
        variant: "destructive",
      })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex relative overflow-hidden bg-slate-50 font-sans selection:bg-blue-500/30">
      {/* Left Side - 3D Hero Visual */}
      <div className="hidden lg:flex lg:w-[60%] relative bg-[#0B1120] overflow-hidden flex-col items-center justify-center p-0">

        {/* Animated Background Mesh */}
        <div className="absolute inset-0 opacity-20 pointer-events-none z-0">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.1)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
          <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent animate-[dash_3s_linear_infinite]" />
          <div className="absolute bottom-1/3 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/30 to-transparent animate-[dash_5s_linear_infinite_reverse]" />
        </div>

        {/* Brand Top Left */}
        <div className="absolute top-10 left-10 flex items-center gap-3 z-30">
          <div className="h-10 w-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <div className="font-display font-bold text-white text-xl tracking-tighter">J</div>
          </div>
          <div>
            <h3 className="text-white font-bold font-display tracking-wide drop-shadow-md">JBRC</h3>
            <p className="text-blue-400 text-[10px] tracking-[0.2em] uppercase font-semibold">Logistics Mainframe</p>
          </div>
        </div>

        {/* 3D Scene Container */}
        <div className="absolute inset-0 z-10">
          <Login3DScene />
        </div>

        {/* HUD Overlay */}
        <div className="absolute bottom-10 right-10 hidden lg:flex flex-col gap-2 scale-90 opacity-80 z-20 pointer-events-none">
          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-2.5 rounded-lg border border-blue-500/30 text-xs text-blue-200 shadow-[0_0_15px_rgba(59,130,246,0.2)] animate-pulse">
            <div className="relative">
              <Wifi className="h-3.5 w-3.5 text-blue-400" />
              <span className="absolute inset-0 animate-ping bg-blue-400 rounded-full opacity-30 h-3.5 w-3.5"></span>
            </div>
            <span className="font-mono tracking-wide">TELEMATICS: ONLINE</span>
          </div>
          <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md p-2.5 rounded-lg border border-indigo-500/30 text-xs text-indigo-200">
            <Cpu className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-mono tracking-wide">SYSTEM LOAD: 12%</span>
          </div>
        </div>

        {/* Caption */}
        <div className="absolute bottom-10 left-10 z-20 max-w-sm">
          <h2 className="text-2xl font-display font-bold text-white tracking-tight mb-2 drop-shadow-xl">
            Precision <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">Fleet Control</span>
          </h2>
          <p className="text-blue-200/60 text-xs leading-relaxed font-light">
            Real-time 3D visualization of fleet assets.
          </p>
        </div>
      </div>

      {/* Right Side - Login */}
      <div className="w-full lg:w-[40%] flex flex-col justify-center items-center bg-white p-8 lg:p-12 relative overflow-hidden z-20 shadow-2xl">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#475569_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600"></div>

        <div className={`w-full max-w-sm space-y-8 relative z-10 transition-all duration-700 delay-100 ${mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
          <div className="space-y-2 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold uppercase tracking-wider mb-2">
              <Disc className="h-3 w-3 animate-spin" /> Secure Gateway
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-display">Operator Login</h1>
            <p className="text-slate-500 text-sm">Welcome back. Enter your credentials to access the grid.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1.5 group">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Access ID</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 pl-4 text-base bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl shadow-sm placeholder:text-slate-300"
                placeholder="operator@jbrc.net"
                required
              />
            </div>

            <div className="space-y-1.5 group">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest ml-1 transition-colors group-focus-within:text-blue-600">Passkey</label>
                <a className="text-xs font-semibold text-blue-600 hover:text-blue-500 transition-colors" href="#">Recovery?</a>
              </div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 pl-4 text-base bg-slate-50/50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl shadow-sm"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl shadow-blue-600/20 rounded-xl group relative overflow-hidden transition-all hover:scale-[1.01]"
              disabled={loading}
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-[-15deg]"></div>
              {loading ? (
                <span className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Verifying Credentials...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2 font-bold tracking-wide text-lg">
                  Initialize Session <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-8 border-t border-slate-100 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              <Shield className="h-3 w-3 text-emerald-500" />
              <span>Encrypted Connection • IPv4</span>
            </div>
            <p className="text-center text-xs text-slate-300 max-w-xs">
              Unauthorized access is prohibited and monitored.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
