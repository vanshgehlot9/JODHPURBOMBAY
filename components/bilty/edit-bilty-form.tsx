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
  bilty: Bilty
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
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Bilty #{bilty.biltyNo}</h1>
            <p className="text-gray-600">Update bilty details</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/bilty/view")}
            className="hover:bg-green-100"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Route & Transport Information */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
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
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parties Information */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-green-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
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
                      className="font-mono"
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
                      className="font-mono"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invoice & Eway Bill */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-gray-100">
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceNo">Invoice Number</Label>
                <Input
                  id="invoiceNo"
                  name="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ewayNo">E-way Bill Number</Label>
                <Input
                  id="ewayNo"
                  name="ewayNo"
                  value={formData.ewayNo}
                  onChange={handleInputChange}
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalPackages">Total Packages</Label>
                <Input
                  id="totalPackages"
                  name="totalPackages"
                  value={formData.totalPackages}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="specialInstruction">Special Instructions</Label>
                <Input
                  id="specialInstruction"
                  name="specialInstruction"
                  value={formData.specialInstruction}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Goods Details</CardTitle>
                  <CardDescription>Items being transported</CardDescription>
                </div>
              </div>
              <Button type="button" onClick={addItem} size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-4 bg-gray-50/50">
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
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <Label>Description</Label>
                      <Input
                        value={item.goodsDescription}
                        onChange={(e) => handleItemChange(index, "goodsDescription", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>HSN Code</Label>
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => handleItemChange(index, "hsnCode", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Weight (kg)</Label>
                      <Input
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleItemChange(index, "weight", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Charged Wt</Label>
                      <Input
                        type="number"
                        value={item.chargedWeight}
                        onChange={(e) => handleItemChange(index, "chargedWeight", Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="space-y-2 col-span-2 md:col-span-6">
                      <Label>Rate</Label>
                      <Input
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Charges */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
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
                />
              </div>
              <div className="space-y-2">
                <Label>P.F.</Label>
                <Input
                  type="number"
                  value={charges.pf}
                  onChange={(e) => handleChargeChange("pf", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>L.C.</Label>
                <Input
                  type="number"
                  value={charges.lc}
                  onChange={(e) => handleChargeChange("lc", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>B.C.</Label>
                <Input
                  type="number"
                  value={charges.bc}
                  onChange={(e) => handleChargeChange("bc", Number(e.target.value))}
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
                />
              </div>
              <div className="space-y-2">
                <Label>SGST</Label>
                <Input
                  type="number"
                  value={charges.sgst}
                  onChange={(e) => handleChargeChange("sgst", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>IGST</Label>
                <Input
                  type="number"
                  value={charges.igst}
                  onChange={(e) => handleChargeChange("igst", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Advance</Label>
                <Input
                  type="number"
                  value={charges.advance}
                  onChange={(e) => handleChargeChange("advance", Number(e.target.value))}
                />
              </div>
              <div className="space-y-2 md:col-span-3">
                <Label className="font-bold">Grand Total</Label>
                <Input
                  type="number"
                  value={charges.grandTotal}
                  disabled
                  className="bg-blue-50 font-bold text-lg"
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
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={loading} size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
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
