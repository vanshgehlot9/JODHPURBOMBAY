"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Plus, Minus, Save, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

export function CreateBiltyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    biltyDate: new Date().toISOString().split("T")[0],
    truckNo: "",
    from: "",
    to: "",
    consignorName: "",
    consignorGst: "",
    consigneeName: "",
    consigneeGst: "",
    transporterId: "",
    invoiceNo: "",
    ewayNo: "",
    grossValue: 0,
    totalPackages: "",
    specialInstruction: "",
  })

  const [items, setItems] = useState<BiltyItem[]>([
    {
      quantity: 0,
      goodsDescription: "",
      hsnCode: "",
      weight: 0,
      chargedWeight: 0,
      rate: "",
    },
  ])

  const [charges, setCharges] = useState<BiltyCharges>({
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
  })

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

  const updateItem = (index: number, field: keyof BiltyItem, value: any) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }
    setItems(updatedItems)
  }

  const updateCharges = (field: keyof BiltyCharges, value: number) => {
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
      const response = await fetch("/api/bilty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          items,
          charges,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({
          title: "Success",
          description: `Bilty #${result.biltyNo} created successfully!`,
        })
        router.push("/bilty/view")
      } else {
        throw new Error("Failed to create bilty")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create bilty. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Information */}
      <Card>
        <CardHeader>
          <CardTitle>Header Information</CardTitle>
          <CardDescription>Basic bilty details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="biltyDate">Bilty Date</Label>
            <Input
              id="biltyDate"
              type="date"
              value={formData.biltyDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, biltyDate: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="truckNo">Truck Number</Label>
            <Input
              id="truckNo"
              value={formData.truckNo}
              onChange={(e) => setFormData((prev) => ({ ...prev, truckNo: e.target.value }))}
              placeholder="Enter truck number"
              required
            />
          </div>
          <div>
            <Label htmlFor="from">From</Label>
            <Input
              id="from"
              value={formData.from}
              onChange={(e) => setFormData((prev) => ({ ...prev, from: e.target.value }))}
              placeholder="Origin city"
              required
            />
          </div>
          <div>
            <Label htmlFor="to">To</Label>
            <Input
              id="to"
              value={formData.to}
              onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
              placeholder="Destination city"
              required
            />
          </div>
        </CardContent>
      </Card>

      {/* Parties Information */}
      <Card>
        <CardHeader>
          <CardTitle>Parties Information</CardTitle>
          <CardDescription>Consignor and consignee details</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="consignorName">Consignor Name</Label>
            <Input
              id="consignorName"
              value={formData.consignorName}
              onChange={(e) => setFormData((prev) => ({ ...prev, consignorName: e.target.value }))}
              placeholder="Consignor name"
              required
            />
          </div>
          <div>
            <Label htmlFor="consignorGst">Consignor GST</Label>
            <Input
              id="consignorGst"
              value={formData.consignorGst}
              onChange={(e) => setFormData((prev) => ({ ...prev, consignorGst: e.target.value }))}
              placeholder="GST number"
            />
          </div>
          <div>
            <Label htmlFor="consigneeName">Consignee Name</Label>
            <Input
              id="consigneeName"
              value={formData.consigneeName}
              onChange={(e) => setFormData((prev) => ({ ...prev, consigneeName: e.target.value }))}
              placeholder="Consignee name"
              required
            />
          </div>
          <div>
            <Label htmlFor="consigneeGst">Consignee GST</Label>
            <Input
              id="consigneeGst"
              value={formData.consigneeGst}
              onChange={(e) => setFormData((prev) => ({ ...prev, consigneeGst: e.target.value }))}
              placeholder="GST number"
            />
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Items</CardTitle>
            <CardDescription>Goods description and details</CardDescription>
          </div>
          <Button type="button" onClick={addItem} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={index} className="p-4 border rounded-lg space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Item {index + 1}</h4>
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                    <Minus className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                    placeholder="Pkgs"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label>Description</Label>
                  <Input
                    value={item.goodsDescription}
                    onChange={(e) => updateItem(index, "goodsDescription", e.target.value)}
                    placeholder="Goods description"
                  />
                </div>
                <div>
                  <Label>HSN Code</Label>
                  <Input
                    value={item.hsnCode}
                    onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                    placeholder="HSN"
                  />
                </div>
                <div>
                  <Label>Weight</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={item.weight}
                    onChange={(e) => updateItem(index, "weight", Number(e.target.value))}
                    placeholder="Actual"
                  />
                </div>
                <div>
                  <Label>Rate</Label>
                  <Input
                    value={item.rate}
                    onChange={(e) => updateItem(index, "rate", e.target.value)}
                    placeholder="Rate"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Charges</CardTitle>
          <CardDescription>Billing and tax information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="freight">Freight</Label>
              <Input
                id="freight"
                type="number"
                step="0.01"
                value={charges.freight}
                onChange={(e) => updateCharges("freight", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="pf">P.F.</Label>
              <Input
                id="pf"
                type="number"
                step="0.01"
                value={charges.pf}
                onChange={(e) => updateCharges("pf", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="lc">L.C.</Label>
              <Input
                id="lc"
                type="number"
                step="0.01"
                value={charges.lc}
                onChange={(e) => updateCharges("lc", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="bc">B.C.</Label>
              <Input
                id="bc"
                type="number"
                step="0.01"
                value={charges.bc}
                onChange={(e) => updateCharges("bc", Number(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="cgst">CGST</Label>
              <Input
                id="cgst"
                type="number"
                step="0.01"
                value={charges.cgst}
                onChange={(e) => updateCharges("cgst", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="sgst">SGST</Label>
              <Input
                id="sgst"
                type="number"
                step="0.01"
                value={charges.sgst}
                onChange={(e) => updateCharges("sgst", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="igst">IGST</Label>
              <Input
                id="igst"
                type="number"
                step="0.01"
                value={charges.igst}
                onChange={(e) => updateCharges("igst", Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="advance">Advance</Label>
              <Input
                id="advance"
                type="number"
                step="0.01"
                value={charges.advance}
                onChange={(e) => updateCharges("advance", Number(e.target.value))}
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Sub Total</Label>
              <Input type="number" value={charges.total} readOnly className="bg-gray-50" />
            </div>
            <div>
              <Label>Grand Total</Label>
              <Input type="number" value={charges.grandTotal} readOnly className="bg-gray-50 font-bold" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Footer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="totalPackages">Total Packages</Label>
            <Input
              id="totalPackages"
              value={formData.totalPackages}
              onChange={(e) => setFormData((prev) => ({ ...prev, totalPackages: e.target.value }))}
              placeholder="Total packages"
            />
          </div>
          <div>
            <Label htmlFor="specialInstruction">Special Instructions</Label>
            <Textarea
              id="specialInstruction"
              value={formData.specialInstruction}
              onChange={(e) => setFormData((prev) => ({ ...prev, specialInstruction: e.target.value }))}
              placeholder="Special instructions"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? "Creating..." : "Create Bilty"}
        </Button>
      </div>
    </form>
  )
}
