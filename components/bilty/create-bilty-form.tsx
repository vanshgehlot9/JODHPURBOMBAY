"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Minus, 
  Save, 
  X, 
  Truck, 
  Users, 
  Package, 
  Calculator,
  FileText,
  CheckCircle,
  AlertCircle
} from "lucide-react"
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

interface Suggestion {
  name?: string
  gst?: string
  displayName?: string
  displayGst?: string
  truckNo?: string
  displayTruckNo?: string
  lastConsignor?: string
  lastConsignee?: string
  score?: number
}

export function CreateBiltyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  // Suggestion states
  const [consignorSuggestions, setConsignorSuggestions] = useState<Suggestion[]>([])
  const [consigneeSuggestions, setConsigneeSuggestions] = useState<Suggestion[]>([])
  const [truckSuggestions, setTruckSuggestions] = useState<Suggestion[]>([])
  const [showConsignorSuggestions, setShowConsignorSuggestions] = useState(false)
  const [showConsigneeSuggestions, setShowConsigneeSuggestions] = useState(false)
  const [showTruckSuggestions, setShowTruckSuggestions] = useState(false)
  
  const consignorRef = useRef<HTMLDivElement>(null)
  const consigneeRef = useRef<HTMLDivElement>(null)
  const truckRef = useRef<HTMLDivElement>(null)

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
    ewayDate: "",
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

  // Fetch suggestions with fuzzy matching
  const fetchSuggestions = async (field: string, searchTerm: string) => {
    if (searchTerm.length < 1) {
      if (field === 'consignor') setConsignorSuggestions([])
      if (field === 'consignee') setConsigneeSuggestions([])
      if (field === 'truck') setTruckSuggestions([])
      return
    }

    try {
      const response = await fetch(`/api/bilty/suggestions?field=${field}&q=${encodeURIComponent(searchTerm)}`)
      if (response.ok) {
        const data = await response.json()
        const mappedSuggestions = (data.suggestions || []).map((s: any) => {
          if (field === 'consignor' || field === 'consignee') {
            return {
              displayName: s.value,
              displayGst: '', // We'll handle GST separately
              score: s.score
            }
          } else if (field === 'truck') {
            return {
              displayTruckNo: s.value,
              score: s.score
            }
          }
          return s
        })
        
        if (field === 'consignor') setConsignorSuggestions(mappedSuggestions)
        if (field === 'consignee') setConsigneeSuggestions(mappedSuggestions)
        if (field === 'truck') setTruckSuggestions(mappedSuggestions)
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (consignorRef.current && !consignorRef.current.contains(event.target as Node)) {
        setShowConsignorSuggestions(false)
      }
      if (consigneeRef.current && !consigneeRef.current.contains(event.target as Node)) {
        setShowConsigneeSuggestions(false)
      }
      if (truckRef.current && !truckRef.current.contains(event.target as Node)) {
        setShowTruckSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleConsignorSelect = (suggestion: Suggestion) => {
    setFormData(prev => ({
      ...prev,
      consignorName: suggestion.displayName || '',
      consignorGst: suggestion.displayGst || ''
    }))
    setShowConsignorSuggestions(false)
  }

  const handleConsigneeSelect = (suggestion: Suggestion) => {
    setFormData(prev => ({
      ...prev,
      consigneeName: suggestion.displayName || '',
      consigneeGst: suggestion.displayGst || ''
    }))
    setShowConsigneeSuggestions(false)
  }

  const handleTruckSelect = (suggestion: Suggestion) => {
    setFormData(prev => ({
      ...prev,
      truckNo: suggestion.displayTruckNo || ''
    }))
    setShowTruckSuggestions(false)
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
    <div className="space-y-8">
      {/* Progress Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Bilty</h1>
            <p className="text-gray-600">Fill in the details to generate a new transport document</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              <FileText className="h-3 w-3 mr-1" />
              Draft
            </Badge>
          </div>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              1
            </div>
            <span className="text-sm font-medium text-blue-600">Transport Details</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              2
            </div>
            <span className="text-sm text-gray-600">Parties & Items</span>
          </div>
          <div className="w-8 h-0.5 bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-medium">
              3
            </div>
            <span className="text-sm text-gray-600">Charges & Submit</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Transport Information */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Transport Information</CardTitle>
                <CardDescription>Basic bilty and transport details</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="biltyDate" className="text-sm font-medium text-gray-700">
                  Bilty Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="biltyDate"
                  type="date"
                  value={formData.biltyDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, biltyDate: e.target.value }))}
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2" ref={truckRef}>
                <Label htmlFor="truckNo" className="text-sm font-medium text-gray-700">
                  Truck Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="truckNo"
                    value={formData.truckNo}
                    onChange={(e) => {
                      setFormData((prev) => ({ ...prev, truckNo: e.target.value }))
                      fetchSuggestions('truck', e.target.value)
                      setShowTruckSuggestions(true)
                    }}
                    onFocus={() => {
                      if (formData.truckNo.length >= 2) setShowTruckSuggestions(true)
                    }}
                    placeholder="e.g., RJ14GA1234"
                    className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                  {showTruckSuggestions && truckSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto">
                      <div className="px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-200">
                        <span className="text-xs font-semibold text-orange-700 uppercase tracking-wide flex items-center gap-1">
                          <Truck className="h-3 w-3" />
                          Similar Trucks ({truckSuggestions.length})
                        </span>
                      </div>
                      {truckSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleTruckSelect(suggestion)}
                          className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-orange-50 hover:to-amber-50 focus:bg-orange-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-all duration-150 group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900 group-hover:text-orange-700 transition-colors font-mono">
                                {suggestion.displayTruckNo}
                              </div>
                              {suggestion.lastConsignor && (
                                <div className="text-xs text-gray-500 mt-1">
                                  <span className="bg-gray-100 px-2 py-0.5 rounded">
                                    Last: {suggestion.lastConsignor} → {suggestion.lastConsignee}
                                  </span>
                                </div>
                              )}
                            </div>
                            {suggestion.score && suggestion.score > 80 && (
                              <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-200">
                                {suggestion.score >= 100 ? 'Exact' : suggestion.score >= 90 ? 'High' : 'Match'}
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="from" className="text-sm font-medium text-gray-700">
                  From <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="from"
                  value={formData.from}
                  onChange={(e) => setFormData((prev) => ({ ...prev, from: e.target.value }))}
                  placeholder="Origin city"
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to" className="text-sm font-medium text-gray-700">
                  To <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="to"
                  value={formData.to}
                  onChange={(e) => setFormData((prev) => ({ ...prev, to: e.target.value }))}
                  placeholder="Destination city"
                  className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <div className="space-y-2" ref={consignorRef}>
                    <Label htmlFor="consignorName" className="text-sm font-medium text-gray-700">
                      Consignor Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="consignorName"
                        value={formData.consignorName}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, consignorName: e.target.value }))
                          fetchSuggestions('consignor', e.target.value)
                          setShowConsignorSuggestions(true)
                        }}
                        onFocus={() => {
                          if (formData.consignorName.length >= 2) setShowConsignorSuggestions(true)
                        }}
                        placeholder="Company or person name"
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {showConsignorSuggestions && consignorSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto">
                          <div className="px-3 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
                            <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                              Similar Entries ({consignorSuggestions.length})
                            </span>
                          </div>
                          {consignorSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleConsignorSelect(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-all duration-150 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 group-hover:text-blue-700 transition-colors">
                                    {suggestion.displayName}
                                  </div>
                                  {suggestion.displayGst && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">GST: {suggestion.displayGst}</span>
                                    </div>
                                  )}
                                </div>
                                {suggestion.score && suggestion.score > 80 && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                                    {suggestion.score >= 100 ? 'Exact' : suggestion.score >= 90 ? 'High' : 'Match'}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consignorGst" className="text-sm font-medium text-gray-700">
                      Consignor GST
                    </Label>
                    <Input
                      id="consignorGst"
                      value={formData.consignorGst}
                      onChange={(e) => setFormData((prev) => ({ ...prev, consignorGst: e.target.value }))}
                      placeholder="GST number (optional)"
                      className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900 border-b border-gray-200 pb-2">Consignee Details</h3>
                <div className="space-y-4">
                  <div className="space-y-2" ref={consigneeRef}>
                    <Label htmlFor="consigneeName" className="text-sm font-medium text-gray-700">
                      Consignee Name <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="consigneeName"
                        value={formData.consigneeName}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, consigneeName: e.target.value }))
                          fetchSuggestions('consignee', e.target.value)
                          setShowConsigneeSuggestions(true)
                        }}
                        onFocus={() => {
                          if (formData.consigneeName.length >= 2) setShowConsigneeSuggestions(true)
                        }}
                        placeholder="Company or person name"
                        className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                      {showConsigneeSuggestions && consigneeSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-auto">
                          <div className="px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">
                              Similar Entries ({consigneeSuggestions.length})
                            </span>
                          </div>
                          {consigneeSuggestions.map((suggestion, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleConsigneeSelect(suggestion)}
                              className="w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 focus:bg-green-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-all duration-150 group"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 group-hover:text-green-700 transition-colors">
                                    {suggestion.displayName}
                                  </div>
                                  {suggestion.displayGst && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">GST: {suggestion.displayGst}</span>
                                    </div>
                                  )}
                                </div>
                                {suggestion.score && suggestion.score > 80 && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                                    {suggestion.score >= 100 ? 'Exact' : suggestion.score >= 90 ? 'High' : 'Match'}
                                  </Badge>
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consigneeGst" className="text-sm font-medium text-gray-700">
                      Consignee GST
                    </Label>
                    <Input
                      id="consigneeGst"
                      value={formData.consigneeGst}
                      onChange={(e) => setFormData((prev) => ({ ...prev, consigneeGst: e.target.value }))}
                      placeholder="GST number (optional)"
                      className="focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-purple-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Package className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-xl">Items Details</CardTitle>
                  <CardDescription>Goods description and specifications</CardDescription>
                </div>
              </div>
              <Button 
                type="button" 
                onClick={addItem} 
                size="sm"
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {items.map((item, index) => (
                <div 
                  key={index} 
                  className="p-6 border border-gray-200 rounded-lg bg-gray-50/30 hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-gray-900">Item {index + 1}</h4>
                    </div>
                    {items.length > 1 && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Quantity</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        placeholder="Pkgs"
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Description</Label>
                      <Input
                        value={item.goodsDescription}
                        onChange={(e) => updateItem(index, "goodsDescription", e.target.value)}
                        placeholder="Goods description"
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">HSN Code</Label>
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                        placeholder="HSN"
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Actual Kg</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.weight}
                        onChange={(e) => updateItem(index, "weight", Number(e.target.value))}
                        placeholder="Weight"
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Charged Kg</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.chargedWeight}
                        onChange={(e) => updateItem(index, "chargedWeight", Number(e.target.value))}
                        placeholder="Charged"
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Rate</Label>
                      <Input
                        value={item.rate}
                        onChange={(e) => updateItem(index, "rate", e.target.value)}
                        placeholder="Rate"
                        className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
          <CardHeader className="bg-gradient-to-r from-orange-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calculator className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Charges & Billing</CardTitle>
                <CardDescription>Financial details and tax information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="freight" className="text-sm font-medium text-gray-700">Freight</Label>
                <Input
                  id="freight"
                  type="number"
                  step="0.01"
                  value={charges.freight}
                  onChange={(e) => updateCharges("freight", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pf" className="text-sm font-medium text-gray-700">P.F.</Label>
                <Input
                  id="pf"
                  type="number"
                  step="0.01"
                  value={charges.pf}
                  onChange={(e) => updateCharges("pf", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lc" className="text-sm font-medium text-gray-700">L.C.</Label>
                <Input
                  id="lc"
                  type="number"
                  step="0.01"
                  value={charges.lc}
                  onChange={(e) => updateCharges("lc", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bc" className="text-sm font-medium text-gray-700">B.C.</Label>
                <Input
                  id="bc"
                  type="number"
                  step="0.01"
                  value={charges.bc}
                  onChange={(e) => updateCharges("bc", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cgst" className="text-sm font-medium text-gray-700">CGST</Label>
                <Input
                  id="cgst"
                  type="number"
                  step="0.01"
                  value={charges.cgst}
                  onChange={(e) => updateCharges("cgst", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sgst" className="text-sm font-medium text-gray-700">SGST</Label>
                <Input
                  id="sgst"
                  type="number"
                  step="0.01"
                  value={charges.sgst}
                  onChange={(e) => updateCharges("sgst", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="igst" className="text-sm font-medium text-gray-700">IGST</Label>
                <Input
                  id="igst"
                  type="number"
                  step="0.01"
                  value={charges.igst}
                  onChange={(e) => updateCharges("igst", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="advance" className="text-sm font-medium text-gray-700">Advance</Label>
                <Input
                  id="advance"
                  type="number"
                  step="0.01"
                  value={charges.advance}
                  onChange={(e) => updateCharges("advance", Number(e.target.value))}
                  className="focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Sub Total</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={charges.total} 
                    readOnly 
                    className="bg-gray-50 border-gray-300 text-gray-700 font-medium pr-8" 
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Grand Total</Label>
                <div className="relative">
                  <Input 
                    type="number" 
                    value={charges.grandTotal} 
                    readOnly 
                    className="bg-blue-50 border-blue-300 text-blue-700 font-bold text-lg pr-8" 
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <CheckCircle className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card className="shadow-sm border-0 ring-1 ring-gray-200/50">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <FileText className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Additional Information</CardTitle>
                <CardDescription>Extra details and documentation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceNo" className="text-sm font-medium text-gray-700">Invoice No.</Label>
                <Input
                  id="invoiceNo"
                  value={formData.invoiceNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNo: e.target.value }))}
                  placeholder="DJ/25-26/0089"
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ewayNo" className="text-sm font-medium text-gray-700">E-Way Bill No.</Label>
                <Input
                  id="ewayNo"
                  value={formData.ewayNo}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ewayNo: e.target.value }))}
                  placeholder="781524917682"
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ewayDate" className="text-sm font-medium text-gray-700">E-Way Bill Date</Label>
                <Input
                  id="ewayDate"
                  type="date"
                  value={formData.ewayDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, ewayDate: e.target.value }))}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grossValue" className="text-sm font-medium text-gray-700">G.V. (Gross Value)</Label>
                <Input
                  id="grossValue"
                  type="number"
                  step="0.01"
                  value={formData.grossValue}
                  onChange={(e) => setFormData((prev) => ({ ...prev, grossValue: Number(e.target.value) }))}
                  placeholder="568009"
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="totalPackages" className="text-sm font-medium text-gray-700">Total Packages</Label>
                <Input
                  id="totalPackages"
                  value={formData.totalPackages}
                  onChange={(e) => setFormData((prev) => ({ ...prev, totalPackages: e.target.value }))}
                  placeholder="Total packages"
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="specialInstruction" className="text-sm font-medium text-gray-700">Special Instructions</Label>
                <Textarea
                  id="specialInstruction"
                  value={formData.specialInstruction}
                  onChange={(e) => setFormData((prev) => ({ ...prev, specialInstruction: e.target.value }))}
                  placeholder="Any special handling instructions..."
                  rows={3}
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-6 bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4" />
            <span>Please review all information before creating the bilty</span>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => router.back()}
              className="hover:bg-gray-50"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 min-w-[140px]"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Bilty
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
