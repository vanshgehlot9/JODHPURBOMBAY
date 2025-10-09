"use client"

import { Suspense } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentBilties } from "@/components/dashboard/recent-bilties"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Activity, CheckCircle, TrendingUp } from "lucide-react"

export default function Dashboard() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
            <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl animate-pulse"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null // AuthProvider will redirect to login
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Dashboard" subtitle="Welcome to JBRC Management System" />
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Animated Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 sm:p-8 text-white shadow-2xl animate-in">
            <div className="absolute inset-0 bg-grid-white/10"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-bounce">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold">Welcome back! 👋</h2>
                  <p className="text-blue-100 text-sm sm:text-base">Here's what's happening with your business today</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl -ml-32 -mb-32"></div>
          </div>

          <Suspense fallback={<StatsLoading />}>
            <DashboardStats />
          </Suspense>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="slide-up">
                <QuickActions />
              </div>
            </div>
            <div className="space-y-6">
              <Card className="card-hover shadow-lg border-0 ring-1 ring-gray-200/50 animate-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                      <Activity className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">System Status</CardTitle>
                      <CardDescription className="text-xs">All systems operational</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">Database</span>
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">API Services</span>
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50/50 border border-green-100">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-700">PDF Generator</span>
                      </div>
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">Active</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="slide-up" style={{ animationDelay: '0.2s' }}>
            <Suspense fallback={<RecentBiltiesLoading />}>
              <RecentBilties />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}

function StatsLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function RecentBiltiesLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
