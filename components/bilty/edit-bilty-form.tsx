"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Plus,
  Minus,
  Save,
  ArrowLeft,
  Truck,
  Users,
  Package,
  Calculator
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Bilty } from "@/lib/firestore"

interface BiltyItem {
  quantity: number
  goodsDescription: string
  hsnCode: string
  weight: number
  chargedWeight: number
  rate: string
}

interface BiltyCharges {
  freight: number
  pf: number
  lc: number
  bc: number
  total: number
  cgst: number
  sgst: number
  igst: number
  advance: number
  grandTotal: number
}

interface EditBiltyFormProps {
  bilty: any // Using specific types would be better, but we need to handle serialized dates (string/Date) vs Firestore Timestamps
}

export function EditBiltyForm({ bilty }: EditBiltyFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    truckNo: bilty.truckNo || "",
    from: bilty.from || "",
    to: bilty.to || "",
    consignorName: bilty.consignorName || "",
    consignorGst: bilty.consignorGst || "",
    consigneeName: bilty.consigneeName || "",
    consigneeGst: bilty.consigneeGst || "",
    transporterId: bilty.transporterId || "",
    invoiceNo: bilty.invoiceNo || "",
    ewayNo: bilty.ewayNo || "",
    ewayDate: bilty.ewayDate || "",
    grossValue: bilty.grossValue || 0,
    totalPackages: bilty.totalPackages || "",
    specialInstruction: bilty.specialInstruction || "",
  })

  const [items, setItems] = useState<BiltyItem[]>(
    bilty.items || [
      {
        quantity: 0,
        goodsDescription: "",
        hsnCode: "",
        weight: 0,
        chargedWeight: 0,
        rate: "",
      },
    ]
  )

  const [charges, setCharges] = useState<BiltyCharges>(
    bilty.charges || {
      freight: 0,
      pf: 0,
      lc: 0,
      bc: 0,
      total: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      advance: 0,
      grandTotal: 0,
    }
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleItemChange = (index: number, field: keyof BiltyItem, value: string | number) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const addItem = () => {
    setItems([
      ...items,
      {
        quantity: 0,
        goodsDescription: "",
        hsnCode: "",
        weight: 0,
        chargedWeight: 0,
        rate: "",
      },
    ])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const handleChargeChange = (field: keyof BiltyCharges, value: number) => {
    setCharges((prev) => {
      const updated = { ...prev, [field]: value }

      // Recalculate totals
      const subTotal = updated.freight + updated.pf + updated.lc + updated.bc
      const totalGst = updated.cgst + updated.sgst + updated.igst
      const grandTotal = subTotal + totalGst - updated.advance

      return {
        ...updated,
        total: subTotal,
        grandTotal: grandTotal,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare the update data
      const updateData = {
        truckNo: formData.truckNo,
        from: formData.from,
        to: formData.to,
        consignorName: formData.consignorName,
        consignorGst: formData.consignorGst,
        consigneeName: formData.consigneeName,
        consigneeGst: formData.consigneeGst,
        transporterId: formData.transporterId,
        invoiceNo: formData.invoiceNo,
        ewayNo: formData.ewayNo,
        ewayDate: formData.ewayDate,
        grossValue: Number(formData.grossValue),
        totalPackages: formData.totalPackages,
        specialInstruction: formData.specialInstruction,
        items,
        charges,
      }

      const response = await fetch(`/api/bilty/${bilty.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: `Bilty #${bilty.biltyNo} updated successfully!`,
        })
        router.push("/bilty/view")
      } else {
        const error = await response.json()
        throw new Error(error.message || "Failed to update bilty")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bilty. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Bilty #{bilty.biltyNo}</h1>
            <p className="text-gray-600">Update bilty details</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/bilty/view")}
            className="hover:bg-indigo-50 border-indigo-200 text-indigo-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Route & Transport Information */}
        <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Truck className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Route & Transport</CardTitle>
                <CardDescription>Truck and route details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="truckNo">Truck Number</Label>
                <Input
                  id="truckNo"
                  name="truckNo"
                  value={formData.truckNo}
                  onChange={handleInputChange}
                  placeholder="MH12AB1234"
                  required
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from">From</Label>
                <Input
                  id="from"
                  name="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  placeholder="Origin city"
                  required
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  placeholder="Destination city"
                  required
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties Information */}
        <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Parties Information</CardTitle>
                <CardDescription>Consignor and consignee details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Consignor Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="consignorName">Consignor Name</Label>
                    <Input
                      id="consignorName"
                      name="consignorName"
                      value={formData.consignorName}
                      onChange={handleInputChange}
                      required
                      className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consignorGst">Consignor GST</Label>
                    <Input
                      id="consignorGst"
                      name="consignorGst"
                      value={formData.consignorGst}
                      onChange={handleInputChange}
                      maxLength={15}
                      className="font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Consignee Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="consigneeName">Consignee Name</Label>
                    <Input
                      id="consigneeName"
                      name="consigneeName"
                      value={formData.consigneeName}
                      onChange={handleInputChange}
                      required
                      className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consigneeGst">Consignee GST</Label>
                    <Input
                      id="consigneeGst"
                      name="consigneeGst"
                      value={formData.consigneeGst}
                      onChange={handleInputChange}
                      maxLength={15}
                      className="font-mono focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice & Eway Bill */}
        <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-gray-100">
            <CardTitle className="text-xl">Invoice & E-way Bill Details</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="transporterId">Transporter ID</Label>
                <Input
                  id="transporterId"
                  name="transporterId"
                  value={formData.transporterId}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNo">Invoice Number</Label>
                <Input
                  id="invoiceNo"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ewayNo">E-way Bill Number</Label>
                <Input
                  id="ewayNo"
                  name="ewayNo"
                  value={formData.ewayNo}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ewayDate">E-way Bill Date</Label>
                <Input
                  id="ewayDate"
                  name="ewayDate"
                  type="date"
                  value={formData.ewayDate}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grossValue">Gross Value</Label>
                <Input
                  id="grossValue"
                  name="grossValue"
                  type="number"
                  value={formData.grossValue}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPackages">Total Packages</Label>
                <Input
                  id="totalPackages"
                  name="totalPackages"
                  value={formData.totalPackages}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specialInstruction">Special Instructions</Label>
                <Input
                  id="specialInstruction"
                  name="specialInstruction"
                  value={formData.specialInstruction}
                  onChange={handleInputChange}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Goods Details</CardTitle>
                  <CardDescription>Items being transported</CardDescription>
                </div>
              </div>
              <Button type="button" onClick={addItem} size="sm" variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-700">Item #{index + 1}</h4>
                    {items.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Minus className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-12 gap-3 md:gap-4 items-end">
                    <div className="col-span-12 md:col-span-3 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description</Label>
                      <Input
                        value={item.goodsDescription}
                        onChange={(e) => handleItemChange(index, "goodsDescription", e.target.value)}
                        required
                        className="bg-white border-gray-200 focus:border-purple-300 font-medium h-10 md:h-11 text-sm md:text-base"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">HSN</Label>
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                        className="bg-white border-gray-200 focus:border-purple-300 font-mono text-sm h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        required
                        className="bg-white border-gray-200 focus:border-purple-300 font-bold text-center h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Weight</Label>
                      <Input
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleItemChange(index, "weight", Number(e.target.value))}
                        required
                        className="bg-white border-gray-200 focus:border-purple-300 font-bold text-center h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ch. Weight</Label>
                      <Input
                        type="number"
                        value={item.chargedWeight}
                        onChange={(e) => handleItemChange(index, "chargedWeight", Number(e.target.value))}
                        required
                        className="bg-white border-gray-200 focus:border-purple-300 font-bold text-center h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rate</Label>
                      <Input
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                        className="bg-white border-gray-200 focus:border-purple-300 text-right font-mono h-10 md:h-11"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charges */}
        <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Calculator className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Charges Breakdown</CardTitle>
                <CardDescription>Freight and additional charges</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>Freight</Label>
                <Input
                  type="number"
                  value={charges.freight}
                  onChange={(e) => handleChargeChange("freight", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>P.F.</Label>
                <Input
                  type="number"
                  value={charges.pf}
                  onChange={(e) => handleChargeChange("pf", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>L.C.</Label>
                <Input
                  type="number"
                  value={charges.lc}
                  onChange={(e) => handleChargeChange("lc", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>B.C.</Label>
                <Input
                  type="number"
                  value={charges.bc}
                  onChange={(e) => handleChargeChange("bc", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Total</Label>
                <Input
                  type="number"
                  value={charges.total}
                  disabled
                  className="bg-gray-100"
                />
              </div>
              <div className="space-y-2">
                <Label>CGST</Label>
                <Input
                  type="number"
                  value={charges.cgst}
                  onChange={(e) => handleChargeChange("cgst", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>SGST</Label>
                <Input
                  type="number"
                  value={charges.sgst}
                  onChange={(e) => handleChargeChange("sgst", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>IGST</Label>
                <Input
                  type="number"
                  value={charges.igst}
                  onChange={(e) => handleChargeChange("igst", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label>Advance</Label>
                <Input
                  type="number"
                  value={charges.advance}
                  onChange={(e) => handleChargeChange("advance", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label className="font-bold">Grand Total</Label>
                <Input
                  type="number"
                  value={charges.grandTotal}
                  disabled
                  className="bg-indigo-50 font-bold text-lg text-indigo-700 border-indigo-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/bilty/view")}
            disabled={loading}
            className="hover:bg-gray-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading} size="lg" className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300">
            {loading ? (
              <>
                <span className="animate-spin mr-2">⏳</span>
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
