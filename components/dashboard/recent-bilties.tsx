"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import {
  Eye,
  Edit,
  FileText,
  ArrowRight,
  Truck
} from "lucide-react"
import { getRecentBilties, type Bilty } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

export function RecentBilties() {
  const [bilties, setBilties] = useState<Bilty[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBilties() {
      try {
        const data = await getRecentBilties(10)
        setBilties(data)
      } catch (error) {
        console.error("Failed to fetch recent bilties:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBilties()
  }, [])

  if (loading) {
    return (
      <div className="rounded-[1.5rem] border border-gray-100 shadow-sm bg-white overflow-hidden">
        <div className="border-b border-gray-50 bg-gray-50/30 p-4">
          {/* Header Skeleton closely matching the real header if needed, or just lines */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-5 rounded-full bg-gray-200" />
            <Skeleton className="h-6 w-32 bg-gray-200" />
          </div>
        </div>
        <div className="p-0">
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4">
                <Skeleton className="h-10 w-10 rounded-xl bg-gray-100" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 bg-gray-100" />
                  <Skeleton className="h-3 w-24 bg-gray-100" />
                </div>
                <Skeleton className="h-6 w-16 bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Container is now purely structural, styling handled by parent layout or inner items */}
      <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden">
        {bilties.length === 0 ? (
          <div className="text-center py-16 px-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <FileText className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No shipments recorded</h3>
            <p className="text-gray-500 text-sm mb-8 max-w-xs mx-auto">Get started by creating your first transport manifest.</p>
            <Link href="/bilty/create">
              <Button className="bg-[#1E1B4B] hover:bg-[#2A275E] text-white px-8 h-12 rounded-xl shadow-lg shadow-indigo-900/10 transition-all font-bold tracking-wide active:scale-95">
                <Truck className="h-4 w-4 mr-2" />
                Create New Manifest
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {bilties.map((bilty, index) => {
              const biltyDate =
                bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)

              return (
                <div
                  key={bilty.id}
                  className="group relative p-4 sm:px-6 sm:py-5 hover:bg-gray-50/80 transition-all duration-300 cursor-default border-b last:border-0 border-gray-50"
                  // Interactive scale on touch
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {/* Review Button Overlay for Mobile */}
                  <Link href={`/bilty/view/${bilty.id}`} className="absolute inset-0 z-0 sm:hidden" />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 relative z-10">

                    {/* Top Row on Mobile: ID, Date, Amount */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-4">
                      <div className="flex items-center gap-3">
                        {/* ID Badge */}
                        <div className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg sm:rounded-xl bg-[#1E1B4B]/5 text-[#1E1B4B] flex items-center justify-center font-black text-xs sm:text-sm border border-[#1E1B4B]/5 group-hover:bg-[#1E1B4B] group-hover:text-white transition-colors duration-300">
                          {bilty.biltyNo.toString().padStart(2, '0')}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-900 sm:hidden">#{bilty.biltyNo}</span>
                          <span className="text-[10px] sm:text-xs font-medium text-gray-500">
                            {biltyDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>

                      {/* Amount (Visible here on mobile) */}
                      <div className="text-right sm:hidden">
                        <div className="text-sm font-black text-gray-900 tabular-nums">
                          ₹{bilty.charges?.grandTotal?.toLocaleString('en-IN') || "0"}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Route & Consignor */}
                    <div className="flex-1 w-full min-w-0 grid gap-1">
                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-gray-800 w-full">
                        <span className="truncate">{bilty.from}</span>
                        <div className="flex-shrink-0 text-gray-300">
                          <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
                        </div>
                        <span className="truncate">{bilty.to}</span>
                      </div>

                      {/* Consignor */}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] h-4 px-1 rounded-sm border-gray-200 text-gray-400 font-bold uppercase tracking-wider">
                          Consignor
                        </Badge>
                        <span className="text-xs font-medium text-gray-500 truncate max-w-[150px] sm:max-w-none">
                          {bilty.consignorName}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Right: Amount & Actions */}
                    <div className="hidden sm:flex items-center gap-6 pl-4 border-l border-gray-100">
                      <div className="text-right">
                        <div className="text-base font-black text-gray-900 group-hover:text-[#1E1B4B] transition-colors tabular-nums">
                          ₹{bilty.charges?.grandTotal?.toLocaleString('en-IN') || "0"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Amount</div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <Link href={`/bilty/view/${bilty.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#1E1B4B] hover:text-white text-gray-400 transition-all">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/bilty/edit/${bilty.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#1E1B4B] hover:text-white text-gray-400 transition-all">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              )
            })
            }
          </div>
        )}
      </div>
    </div >
  )
}
