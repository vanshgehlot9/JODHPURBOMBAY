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
    <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
      <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Recent Bilties</CardTitle>
              <CardDescription>Latest transport documents</CardDescription>
            </div>
          </div>
          <Link href="/bilty/view">
            <Button variant="outline" size="sm" className="hover:bg-blue-50">
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {bilties.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No bilties yet</h3>
            <p className="text-gray-500 mb-4">Create your first bilty to get started</p>
            <Link href="/bilty/create">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <FileText className="h-4 w-4 mr-2" />
                Create Bilty
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {bilties.map((bilty, index) => {
              const biltyDate =
                bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)

              return (
                <div
                  key={bilty.id}
                  className="p-6 hover:bg-blue-50/30 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                            #{bilty.biltyNo}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-gray-900">Bilty #{bilty.biltyNo}</p>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Calendar className="h-3 w-3" />
                              {biltyDate.toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          </div>
                        </div>
                        
                        <div className="hidden lg:flex items-center gap-8">
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                              <Users className="h-3 w-3" />
                              Consignor
                            </div>
                            <p className="text-sm font-medium text-gray-900 max-w-[120px] truncate">
                              {bilty.consignorName}
                            </p>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                              <MapPin className="h-3 w-3" />
                              Route
                            </div>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="font-medium text-blue-600">{bilty.from}</span>
                              <ArrowRight className="h-3 w-3 text-gray-400" />
                              <span className="font-medium text-purple-600">{bilty.to}</span>
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <div className="flex items-center gap-1 text-sm text-gray-500 mb-1">
                              <TrendingUp className="h-3 w-3" />
                              Amount
                            </div>
                            <p className="text-sm font-bold text-green-600">
                              ₹{bilty.charges?.grandTotal?.toFixed(2) || "0.00"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Mobile/Medium screen layout */}
                      <div className="lg:hidden mt-3 pt-3 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">From: </span>
                            <span className="font-medium text-blue-600">{bilty.from}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">To: </span>
                            <span className="font-medium text-purple-600">{bilty.to}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Consignor: </span>
                            <span className="font-medium">{bilty.consignorName}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Amount: </span>
                            <span className="font-bold text-green-600">
                              ₹{bilty.charges?.grandTotal?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/bilty/view/${bilty.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-blue-100">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Link href={`/bilty/edit/${bilty.id}`}>
                        <Button variant="ghost" size="sm" className="hover:bg-orange-100">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="hover:bg-green-100"
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
