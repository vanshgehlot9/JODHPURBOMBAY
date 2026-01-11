"use client"

import { Suspense } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { RecentBilties } from "@/components/dashboard/recent-bilties"
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-y-auto">

          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[2rem] bg-[#1E1B4B] text-white shadow-xl shadow-indigo-900/20"
          >
            {/* Abstract Background Shapes */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-500/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>

            <div className="relative z-10 px-8 py-10 sm:px-10 sm:py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-indigo-200 text-sm font-bold uppercase tracking-wider mb-2">
                  <Activity className="h-4 w-4" />
                  <span>Overview</span>
                </div>
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-2">
                  Welcome back!
                </h1>
                <p className="text-indigo-100/80 text-lg max-w-lg">
                  Manage your logistics operations with precision.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Main Content Split */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Activity Feed */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-gray-400" />
                  Recent Activity
                </h2>
                <Link href="/bilty/view" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <Suspense fallback={<RecentBiltiesLoading />}>
                <RecentBilties />
              </Suspense>
            </motion.div>

            {/* Side Stats / Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="space-y-6"
            >
              <div className="bg-white rounded-[1.5rem] p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <span className="text-sm font-medium text-gray-600">Total Billed Today</span>
                    <span className="font-black text-gray-900">₹45,200</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-[#1E1B4B] to-[#2E2A6B] rounded-[1.5rem] p-6 text-white relative overflow-hidden group cursor-pointer">
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

function RecentBiltiesLoading() {
  return (
    <Card className="rounded-[1.5rem] border border-gray-100 shadow-sm bg-white overflow-hidden">
      <CardHeader className="border-b border-gray-50 bg-gray-50/30 pb-4">
        <Skeleton className="h-6 w-32 bg-gray-200" />
        <Skeleton className="h-4 w-48 bg-gray-200 mt-2" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-50">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4">
              <Skeleton className="h-10 w-10 rounded-full bg-gray-100" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32 bg-gray-100" />
                <Skeleton className="h-3 w-24 bg-gray-100" />
              </div>
              <Skeleton className="h-6 w-16 bg-gray-100" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
