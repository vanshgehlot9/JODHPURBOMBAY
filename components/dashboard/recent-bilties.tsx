import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Eye,
  Edit,
  Download,
  FileText,
  MapPin,
  Calendar,
  ArrowRight,
  TrendingUp,
  Users
} from "lucide-react"
import { getRecentBilties } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

export async function RecentBilties() {
  const bilties = await getRecentBilties(5)

  return (
    <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-100/50 pb-6">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <FileText className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Recent Bilties</CardTitle>
              <CardDescription className="text-gray-500 font-medium">Latest transport documents</CardDescription>
            </div>
          </div>
          <Link href="/bilty/view">
            <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 font-medium">
              View All
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {bilties.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bilties yet</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">Create your first bilty to get started with your logistics management.</p>
            <Link href="/bilty/create">
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:scale-105">
                <FileText className="h-5 w-5 mr-2" />
                Create New Bilty
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
                  className="p-6 hover:bg-indigo-50/30 transition-all duration-300 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-6">
                        {/* ID Badge */}
                        <div className="flex flex-col items-center justify-center w-16 h-16 bg-white border border-indigo-100 rounded-2xl shadow-sm group-hover:shadow-md transition-all group-hover:border-indigo-200">
                          <span className="text-xs text-gray-400 font-medium uppercase">No.</span>
                          <span className="text-lg font-bold text-indigo-600">#{bilty.biltyNo}</span>
                        </div>

                        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-8">
                          {/* Date & Status */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-gray-900 text-lg">Bilty #{bilty.biltyNo}</p>
                              <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-0 px-2.5 py-0.5">
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                              <Calendar className="h-4 w-4 text-indigo-400" />
                              {biltyDate.toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>

                          {/* Consignor */}
                          <div className="hidden lg:block space-y-1">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Consignor</p>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              <p className="text-sm font-semibold text-gray-700 truncate max-w-[140px]">
                                {bilty.consignorName}
                              </p>
                            </div>
                          </div>

                          {/* Route */}
                          <div className="hidden lg:block space-y-1">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Route</p>
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <span className="text-gray-700">{bilty.from}</span>
                              <ArrowRight className="h-3 w-3 text-indigo-300" />
                              <span className="text-gray-900">{bilty.to}</span>
                            </div>
                          </div>

                          {/* Amount */}
                          <div className="hidden lg:block space-y-1 text-right">
                            <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Amount</p>
                            <p className="text-lg font-bold text-indigo-600">
                              ₹{bilty.charges?.grandTotal?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="lg:hidden mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-400 uppercase">Route</p>
                          <div className="flex items-center gap-1 text-sm font-medium mt-1">
                            <span className="text-gray-900">{bilty.from}</span>
                            <ArrowRight className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-900">{bilty.to}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 uppercase">Total</p>
                          <p className="text-sm font-bold text-indigo-600 mt-1">
                            ₹{bilty.charges?.grandTotal?.toFixed(2) || "0.00"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-all duration-200 transform translate-x-2 group-hover:translate-x-0">
                      <Link href={`/bilty/view/${bilty.id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/bilty/edit/${bilty.id}`}>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 rounded-full hover:bg-indigo-50 text-gray-400 hover:text-indigo-600"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/api/bilty/${bilty.id}/pdf`;
                          link.download = `bilty_${bilty.biltyNo}_3copies.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
