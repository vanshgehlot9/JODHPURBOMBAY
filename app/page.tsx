"use client"


import { useAuth } from "@/components/auth/auth-provider"
import { RecentBilties } from "@/components/dashboard/recent-bilties"
import { QuickStats } from "@/components/dashboard/quick-stats"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { motion } from "framer-motion"
import {
  TrendingUp,
  ArrowRight,
  Activity,
  Clock
} from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-[#1E1B4B] mx-auto"></div>
          </div>
          <p className="text-sm text-slate-500 font-medium tracking-wide">INITIALIZING SYSTEM...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // AuthProvider will redirect to login
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 font-sans">
        <Header title="Dashboard" subtitle="Overview" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 overflow-y-auto">

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] bg-[#1E1B4B] text-white shadow-xl shadow-indigo-900/20"
          >
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

            <div className="relative z-10 px-5 py-6 sm:px-10 sm:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-200 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                  <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Overview</span>
                </div>
                <h1 className="text-2xl sm:text-5xl font-black tracking-tight mb-2">
                  Welcome back!
                </h1>
                <p className="text-indigo-100/80 text-sm sm:text-lg max-w-lg">
                  Manage your logistics operations with precision.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content Split */}
          <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 sm:gap-8">
            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-4 sm:space-y-6 order-2 lg:order-1"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  Recent Activity
                </h2>
                <Link href="/bilty/view" className="text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View All <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                </Link>
              </div>

              <RecentBilties />
            </motion.div>

            {/* Side Stats / Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-4 sm:space-y-6 order-1 lg:order-2"
            >
              <QuickStats />

              <div className="hidden sm:block bg-gradient-to-br from-[#1E1B4B] to-[#2E2A6B] rounded-[1.5rem] p-5 sm:p-6 text-white relative overflow-hidden group cursor-pointer">
                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                  <TrendingUp className="h-24 w-24 -rotate-12" />
                </div>
                <div className="relative z-10">
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="h-5 w-5 text-amber-400" />
                  </div>
                  <h3 className="font-bold text-lg mb-1">View Reports</h3>
                  <p className="text-indigo-200 text-sm mb-4">Analyze your monthly performance.</p>
                  <div className="inline-flex items-center text-xs font-bold uppercase tracking-wider bg-white/10 px-3 py-1.5 rounded-lg group-hover:bg-white/20 transition-colors">
                    Open Analytics
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

        </main>
      </div>
    </div>
  )
}


