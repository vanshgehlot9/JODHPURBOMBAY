import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { BiltyActionsClient } from "@/components/bilty/bilty-actions-client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Truck, MapPin, Building2, FileText, Package, CreditCard } from "lucide-react"

interface BiltyData {
  id: string;
  biltyNo?: string;
  truckNo?: string;
  from?: string;
  to?: string;
  consignorName?: string;
  consignorGst?: string;
  consigneeName?: string;
  consigneeGst?: string;
  transporterId?: string;
  invoiceNo?: string;
  ewayNo?: string;
  grossValue?: string;
  totalPackages?: string;
  specialInstruction?: string;
  items?: Array<{
    quantity?: string;
    goodsDescription?: string;
    hsnCode?: string;
    weight?: string;
    chargedWeight?: string;
    rate?: string;
  }>;
  charges?: {
    freight?: number;
    pf?: number;
    lc?: number;
    bc?: number;
    total?: number;
    cgst?: number;
    sgst?: number;
    igst?: number;
    advance?: number;
    grandTotal?: number;
  };
}

export default async function ViewSingleBiltyPage({ params }: { params: { id: string } }) {
  const biltyId = params.id
  let bilty: BiltyData | null = null
  try {
    const docRef = doc(db, "bilties", biltyId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      bilty = { id: docSnap.id, ...docSnap.data() } as BiltyData
    }
  } catch (error) {
    // handle error or show not found
  }

  if (!bilty) {
    return (
      <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Bilty Not Found" subtitle="The requested bilty could not be found" />
          <main className="flex-1 p-6">
            <Card className="max-w-md mx-auto mt-20">
              <CardContent className="pt-6 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Bilty Not Found</h3>
                <p className="text-gray-600">The bilty you're looking for doesn't exist or has been removed.</p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={`Bilty #${bilty.biltyNo || bilty.id}`} subtitle="View Bilty Details" />
        <main className="flex-1 p-6 space-y-6">
          {/* Header Card with Bilty Number and Status */}
          <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <FileText className="h-8 w-8" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold">Bilty #{bilty.biltyNo || bilty.id}</h1>
                    <p className="text-blue-100 mt-1">Transport Document</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
                  Active
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Transport Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Route Information */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Route Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">From</div>
                  <div className="text-lg font-semibold text-gray-900">{bilty.from || 'N/A'}</div>
                </div>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">To</div>
                  <div className="text-lg font-semibold text-gray-900">{bilty.to || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Information */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Truck className="h-5 w-5 text-green-600" />
                  Vehicle Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Truck Number</div>
                  <div className="text-lg font-semibold text-gray-900 font-mono bg-gray-50 px-3 py-2 rounded-lg">
                    {bilty.truckNo || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Transporter ID</div>
                  <div className="text-gray-900">{bilty.transporterId || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>

            {/* Document Information */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Invoice No</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                    {bilty.invoiceNo || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">E-way No</div>
                  <div className="text-gray-900 font-mono text-sm bg-gray-50 px-2 py-1 rounded">
                    {bilty.ewayNo || 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Gross Value</div>
                  <div className="text-lg font-semibold text-green-600">
                    ₹{bilty.grossValue ? Number(bilty.grossValue).toLocaleString('en-IN') : 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Party Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Consignor */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-blue-600" />
                  Consignor Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Company Name</div>
                  <div className="text-lg font-semibold text-gray-900">{bilty.consignorName || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">GST Number</div>
                  <div className="text-gray-900 font-mono text-sm bg-blue-50 px-3 py-2 rounded-lg border border-blue-200">
                    {bilty.consignorGst || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Consignee */}
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-green-600" />
                  Consignee Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">Company Name</div>
                  <div className="text-lg font-semibold text-gray-900">{bilty.consigneeName || 'N/A'}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-600 mb-1">GST Number</div>
                  <div className="text-gray-900 font-mono text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200">
                    {bilty.consigneeGst || 'N/A'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Items Information */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                Items & Packages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {bilty.totalPackages && (
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-800 mb-1">Total Packages</div>
                  <div className="text-2xl font-bold text-orange-900">{bilty.totalPackages}</div>
                </div>
              )}
              
              {bilty.specialInstruction && (
                <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="text-sm font-medium text-amber-800 mb-1">Special Instructions</div>
                  <div className="text-amber-900">{bilty.specialInstruction}</div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50">Qty</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50">Description</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700 bg-gray-50">HSN</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 bg-gray-50">Weight</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 bg-gray-50">Charged Weight</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-700 bg-gray-50">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bilty.items && bilty.items.length > 0 ? (
                      bilty.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4 font-medium text-gray-900">{item.quantity || '-'}</td>
                          <td className="py-4 px-4 text-gray-900">{item.goodsDescription || '-'}</td>
                          <td className="py-4 px-4 text-gray-700 font-mono text-sm">{item.hsnCode || '-'}</td>
                          <td className="py-4 px-4 text-right text-gray-900">{item.weight || '-'}</td>
                          <td className="py-4 px-4 text-right text-gray-900">{item.chargedWeight || '-'}</td>
                          <td className="py-4 px-4 text-right font-medium text-gray-900">{item.rate || '-'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-8 px-4 text-center text-gray-500">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Charges Information */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-green-600" />
                Charges & Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Basic Charges */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Basic Charges</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Freight:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.freight?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">P.F.:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.pf?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">L.C.:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.lc?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">B.C.:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.bc?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-semibold">
                      <span className="text-gray-900">Total:</span>
                      <span className="text-blue-600">₹{bilty.charges?.total?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Charges */}
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Tax Details</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">CGST:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.cgst?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">SGST:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.sgst?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IGST:</span>
                      <span className="font-medium text-gray-900">₹{bilty.charges?.igst?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Advance:</span>
                      <span className="font-medium text-red-600">₹{bilty.charges?.advance?.toLocaleString('en-IN') || '0'}</span>
                    </div>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="md:col-span-2 lg:col-span-1">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-3">Final Amount</h4>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-700 mb-1">
                        ₹{bilty.charges?.grandTotal?.toLocaleString('en-IN') || '0'}
                      </div>
                      <div className="text-sm text-green-600 font-medium">Grand Total</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6">
              <BiltyActionsClient biltyId={bilty.id} />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 