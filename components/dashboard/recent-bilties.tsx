import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Eye,
  Edit,
  FileText,
  MapPin,
  ArrowRight,
  Truck
} from "lucide-react"
import { getRecentBilties } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"
import { cn } from "@/lib/utils"

export async function RecentBilties() {
  const bilties = await getRecentBilties(5)

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

              // Helper for initials
              const getInitials = (name: string) => name?.substring(0, 2).toUpperCase() || "NA"

              return (
                <div
                  key={bilty.id}
                  className="group relative px-6 py-5 hover:bg-gray-50/50 transition-all duration-300 cursor-default"
                >
                  {/* Active Indicator Line */}
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#1E1B4B] scale-y-0 group-hover:scale-y-100 transition-transform duration-300 origin-center" />

                  <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">

                    {/* Left: ID & Date */}
                    <div className="w-full sm:w-[200px] flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-[#1E1B4B]/5 text-[#1E1B4B] flex items-center justify-center font-black text-sm border border-[#1E1B4B]/5 group-hover:bg-[#1E1B4B] group-hover:text-white transition-colors duration-300">
                        {bilty.biltyNo.toString().padStart(2, '0')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 font-mono tracking-tight group-hover:text-[#1E1B4B] transition-colors">
                          #{bilty.biltyNo}
                        </div>
                        <div className="text-xs font-medium text-gray-500 mt-0.5">
                          {biltyDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Middle: Route Info */}
                    <div className="flex-1 w-full flex flex-col justify-center min-w-0">
                      <div className="flex items-center gap-3 text-sm font-bold text-gray-700 w-full">
                        <span className="truncate max-w-[40%]">{bilty.from}</span>

                        {/* Route Line Visualization */}
                        <div className="flex-1 h-[2px] bg-gray-100 relative min-w-[30px] max-w-[100px] overflow-hidden rounded-full">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#F59E0B] to-transparent -translate-x-full group-hover:animate-[shimmer_1s_infinite] opacity-50"></div>
                        </div>

                        <span className="truncate max-w-[40%]">{bilty.to}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Badge variant="secondary" className="bg-gray-50 text-gray-500 border-gray-100 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0 h-5 rounded-md">
                          Consignor
                        </Badge>
                        <span className="text-xs font-medium text-gray-400 truncate">{bilty.consignorName}</span>
                      </div>
                    </div>

                    {/* Right: Financials & Actions */}
                    <div className="w-full sm:w-auto flex items-center justify-between sm:justify-end gap-6 pl-0 sm:pl-4 sm:border-l border-gray-100">
                      <div className="text-right">
                        <div className="text-base font-black text-gray-900 group-hover:text-[#1E1B4B] transition-colors tabular-nums">
                          ₹{bilty.charges?.grandTotal?.toLocaleString('en-IN') || "0"}
                        </div>
                        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Amount</div>
                      </div>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 transform sm:translate-x-2 sm:group-hover:translate-x-0">
                        <Link href={`/bilty/view/${bilty.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#1E1B4B] hover:text-white text-gray-400 transition-all shadow-sm border border-transparent hover:border-[#1E1B4B]/20">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Link href={`/bilty/edit/${bilty.id}`}>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-[#1E1B4B] hover:text-white text-gray-400 transition-all shadow-sm border border-transparent hover:border-[#1E1B4B]/20">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
