"use client"

import { useEffect, useState } from "react"
import { getTodayStats } from "@/lib/firestore"
import { Skeleton } from "@/components/ui/skeleton"

export function QuickStats() {
    const [stats, setStats] = useState<{ todayRevenue: number; todayCount: number } | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchStats() {
            try {
                const data = await getTodayStats()
                setStats(data)
            } catch (error) {
                console.error("Failed to fetch quick stats:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h3>
                <div className="space-y-4">
                    <Skeleton className="h-10 w-full rounded-xl bg-gray-50" />
                    <Skeleton className="h-10 w-full rounded-xl bg-gray-50" />
                </div>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-[1.5rem] p-5 sm:p-6 border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Stats</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <span className="text-sm font-medium text-gray-600">Total Billed Today</span>
                    <span className="font-black text-gray-900">
                        ₹{stats?.todayRevenue?.toLocaleString('en-IN') || "0"}
                    </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
                    <span className="text-sm font-medium text-gray-600">Bilties Created</span>
                    <span className="font-black text-gray-900">
                        {stats?.todayCount || 0}
                    </span>
                </div>
            </div>
        </div>
    )
}
