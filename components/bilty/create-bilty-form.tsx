"use client"

import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Check,
  Truck,
  Users,
  Package,
  FileText,
  Plus,
  X,
  Calendar,
  MapPin,
  ChevronDown,
  ArrowRight,
  Receipt,
  Building2,
  Box,
  Calculator,
  Info
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"

// --- Types ---

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
  const [isClient, setIsClient] = useState(false)

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
    biltyDate: "",
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

  // Start with one empty item
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

  useEffect(() => {
    setIsClient(true)
    setFormData(prev => ({
      ...prev,
      biltyDate: new Date().toISOString().split("T")[0]
    }))
  }, [])

  // -- Helpers --

  const addItem = () => {
    setItems([
      ...items,
      { quantity: 0, goodsDescription: "", hsnCode: "", weight: 0, chargedWeight: 0, rate: "" },
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
      const subTotal = updated.freight + updated.pf + updated.lc + updated.bc
      const totalGst = updated.cgst + updated.sgst + updated.igst
      const grandTotal = subTotal + totalGst - updated.advance
      return { ...updated, total: subTotal, grandTotal: grandTotal }
    })
  }

  const fetchSuggestions = async (field: string, searchTerm: string) => {
    if (searchTerm.length < 1) {
      if (field === 'consignor') setConsignorSuggestions([])
      if (field === 'consignee') setConsigneeSuggestions([])
      if (field === 'truck') setTruckSuggestions([])
      return
    }

    try {
      if (field === 'consignor' || field === 'consignee') {
        const response = await fetch(`/api/parties?search=${encodeURIComponent(searchTerm)}`)
        if (response.ok) {
          const data = await response.json()
          const mappedSuggestions = (data.parties || []).map((party: any) => ({
            displayName: party.name,
            displayGst: party.gstin,
            score: 100
          }))
          if (field === 'consignor') setConsignorSuggestions(mappedSuggestions)
          if (field === 'consignee') setConsigneeSuggestions(mappedSuggestions)
        }
      } else if (field === 'truck') {
        const response = await fetch(`/api/bilty/suggestions?field=${field}&q=${encodeURIComponent(searchTerm)}`)
        if (response.ok) {
          const data = await response.json()
          const mappedSuggestions = (data.suggestions || []).map((s: any) => ({
            displayTruckNo: s.value,
            score: s.score,
            lastConsignor: s.lastConsignor,
            lastConsignee: s.lastConsignee
          }))
          setTruckSuggestions(mappedSuggestions)
        }
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (consignorRef.current && !consignorRef.current.contains(event.target as Node)) setShowConsignorSuggestions(false)
      if (consigneeRef.current && !consigneeRef.current.contains(event.target as Node)) setShowConsigneeSuggestions(false)
      if (truckRef.current && !truckRef.current.contains(event.target as Node)) setShowTruckSuggestions(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async () => {
    if (!formData.biltyDate || !formData.truckNo || !formData.from || !formData.to) {
      toast({ title: "Incomplete", description: "Fill transport details.", variant: "destructive" })
      return
    }
    if (!formData.consignorName || !formData.consigneeName) {
      toast({ title: "Incomplete", description: "Add consignor and consignee info.", variant: "destructive" })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/bilty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, items, charges }),
      })

      if (response.ok) {
        const result = await response.json()
        toast({ title: "Created", description: `Bilty #${result.biltyNo} generated.` })
        router.push("/bilty/view")
        router.refresh()
      } else {
        throw new Error("Failed to create bilty")
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to create bilty.", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) return <div className="h-96" />

  const SectionHeader = ({ icon: Icon, title, colorClass }: { icon: any, title: string, colorClass: string }) => (
    <div className="flex items-center gap-3 mb-6">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shadow-sm", colorClass)}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest">{title}</h3>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-40">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">New Document</Badge>
            <span className="text-xs text-gray-400 font-mono tracking-wider">BILTY-2026-REG</span>
          </div>
          <h1 className="text-3xl font-black text-[#1E1B4B] tracking-tight">Create JBRC Bilty</h1>
          <p className="text-gray-500 font-medium">Official transport documentation & receipt</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 px-4 bg-white border border-gray-200 rounded-lg flex items-center gap-2 text-sm font-bold text-gray-600 shadow-sm">
            <Calendar className="h-4 w-4 text-gray-400" />
            {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Section 1: Transport Info */}
        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden rounded-[1.5rem] ring-1 ring-gray-100">
          <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <div className="p-6 md:p-8">
            <SectionHeader icon={Truck} title="Transport Details" colorClass="bg-blue-600" />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Date</Label>
                <div className="relative group">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    type="date"
                    value={formData.biltyDate}
                    onChange={e => setFormData({ ...formData, biltyDate: e.target.value })}
                    className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all font-medium h-11"
                  />
                </div>
              </div>
              <div className="space-y-1.5" ref={truckRef}>
                <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Truck No.</Label>
                <div className="relative group">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    value={formData.truckNo}
                    onChange={e => {
                      setFormData({ ...formData, truckNo: e.target.value })
                      fetchSuggestions('truck', e.target.value)
                      setShowTruckSuggestions(true)
                    }}
                    onFocus={() => formData.truckNo.length >= 2 && setShowTruckSuggestions(true)}
                    placeholder="RJ..."
                    className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all font-bold text-gray-800 uppercase h-11"
                  />
                  {showTruckSuggestions && truckSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto p-1">
                      {truckSuggestions.map((s, i) => (
                        <div key={i} className="px-3 py-2.5 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                          onClick={() => {
                            setFormData({ ...formData, truckNo: s.displayTruckNo || '' })
                            setShowTruckSuggestions(false)
                          }}
                        >
                          <div className="font-bold text-gray-900 text-sm">{s.displayTruckNo}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Route (From - To)</Label>
                <div className="flex items-center gap-2">
                  <div className="relative group flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      value={formData.from}
                      onChange={e => setFormData({ ...formData, from: e.target.value })}
                      placeholder="Origin City"
                      className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all font-medium h-11"
                    />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                  <div className="relative group flex-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                    <Input
                      value={formData.to}
                      onChange={e => setFormData({ ...formData, to: e.target.value })}
                      placeholder="Dest. City"
                      className="pl-10 bg-gray-50 border-transparent focus:bg-white focus:border-blue-200 focus:ring-4 focus:ring-blue-50 transition-all font-medium h-11"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Parties */}
        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden rounded-[1.5rem] ring-1 ring-gray-100">
          <div className="p-6 md:p-8">
            <SectionHeader icon={Users} title="Party Details" colorClass="bg-indigo-600" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
              {/* Vertical Divider for desktop */}
              <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-gray-200 to-transparent" />

              {/* Consignor */}
              <div className="space-y-5 relative" ref={consignorRef}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full">Consignor (Sender)</Label>
                  {formData.consignorGst.length === 15 && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
                <div className="space-y-3">
                  <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
                    <Input
                      value={formData.consignorName}
                      onChange={e => {
                        setFormData({ ...formData, consignorName: e.target.value })
                        fetchSuggestions('consignor', e.target.value)
                        setShowConsignorSuggestions(true)
                      }}
                      placeholder="Search Consignor..."
                      className="pl-10 h-12 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all font-medium text-lg"
                    />
                    {showConsignorSuggestions && consignorSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto p-1">
                        {consignorSuggestions.map((s, i) => (
                          <div key={i} className="px-3 py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setFormData({ ...formData, consignorName: s.displayName || '', consignorGst: s.displayGst || '' })
                              setShowConsignorSuggestions(false)
                            }}
                          >
                            <div className="font-bold text-gray-900 text-sm">{s.displayName}</div>
                            <div className="text-xs text-gray-500 mt-0.5 font-mono">GST: {s.displayGst}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={formData.consignorGst}
                    onChange={e => setFormData({ ...formData, consignorGst: e.target.value.toUpperCase() })}
                    placeholder="GSTIN (15 Digits)"
                    maxLength={15}
                    className="h-10 bg-white border-gray-200 focus:border-indigo-200 font-mono text-xs uppercase tracking-wider text-gray-600"
                  />
                </div>
              </div>

              {/* Consignee */}
              <div className="space-y-5" ref={consigneeRef}>
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-bold text-purple-900 bg-purple-50 px-3 py-1 rounded-full">Consignee (Receiver)</Label>
                  {formData.consigneeGst.length === 15 && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
                <div className="space-y-3">
                  <div className="relative group">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-purple-600 transition-colors" />
                    <Input
                      value={formData.consigneeName}
                      onChange={e => {
                        setFormData({ ...formData, consigneeName: e.target.value })
                        fetchSuggestions('consignee', e.target.value)
                        setShowConsigneeSuggestions(true)
                      }}
                      placeholder="Search Consignee..."
                      className="pl-10 h-12 bg-gray-50 border-transparent focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 transition-all font-medium text-lg"
                    />
                    {showConsigneeSuggestions && consigneeSuggestions.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-auto p-1">
                        {consigneeSuggestions.map((s, i) => (
                          <div key={i} className="px-3 py-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors border-b border-gray-50 last:border-0"
                            onClick={() => {
                              setFormData({ ...formData, consigneeName: s.displayName || '', consigneeGst: s.displayGst || '' })
                              setShowConsigneeSuggestions(false)
                            }}
                          >
                            <div className="font-bold text-gray-900 text-sm">{s.displayName}</div>
                            <div className="text-xs text-gray-500 mt-0.5 font-mono">GST: {s.displayGst}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Input
                    value={formData.consigneeGst}
                    onChange={e => setFormData({ ...formData, consigneeGst: e.target.value.toUpperCase() })}
                    placeholder="GSTIN (15 Digits)"
                    maxLength={15}
                    className="h-10 bg-white border-gray-200 focus:border-purple-200 font-mono text-xs uppercase tracking-wider text-gray-600"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Section 3: Items */}
        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden rounded-[1.5rem] ring-1 ring-gray-100">
          <div className="p-6 md:p-8">
            <div className="flex items-center justify-between mb-6">
              <SectionHeader icon={Package} title="Goods & Weights" colorClass="bg-amber-500" />
              <Button variant="ghost" size="sm" onClick={addItem} className="text-amber-700 hover:text-amber-800 hover:bg-amber-50 h-9 px-4 rounded-xl font-bold">
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={index}
                  className="p-4 rounded-xl bg-gray-50 border border-transparent hover:border-amber-200 hover:bg-amber-50/10 transition-colors group"
                >
                  <div className="grid grid-cols-12 gap-3 md:gap-4 items-end">
                    <div className="col-span-12 md:col-span-3 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Description</Label>
                      <Input
                        value={item.goodsDescription}
                        onChange={(e) => updateItem(index, "goodsDescription", e.target.value)}
                        placeholder="E.g Cotton Bales"
                        className="bg-white border-gray-200 focus:border-amber-300 font-medium h-10 md:h-11 text-sm md:text-base"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">HSN</Label>
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => updateItem(index, "hsnCode", e.target.value)}
                        placeholder="Code"
                        className="bg-white border-gray-200 focus:border-amber-300 font-mono text-sm h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-1 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", Number(e.target.value))}
                        className="bg-white border-gray-200 focus:border-amber-300 font-bold text-center h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Weight</Label>
                      <Input
                        type="number"
                        value={item.weight}
                        onChange={(e) => updateItem(index, "weight", Number(e.target.value))}
                        className="bg-white border-gray-200 focus:border-amber-300 font-bold text-center h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-6 md:col-span-2 space-y-1.5">
                      <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ch. Weight</Label>
                      <Input
                        type="number"
                        value={item.chargedWeight}
                        onChange={(e) => updateItem(index, "chargedWeight", Number(e.target.value))}
                        className="bg-white border-gray-200 focus:border-amber-300 font-bold text-center h-10 md:h-11"
                      />
                    </div>
                    <div className="col-span-12 md:col-span-2 flex gap-2 items-end">
                      <div className="space-y-1.5 flex-1">
                        <Label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Rate</Label>
                        <Input
                          value={item.rate}
                          onChange={(e) => updateItem(index, "rate", e.target.value)}
                          placeholder="₹"
                          className="bg-white border-gray-200 focus:border-amber-300 text-right font-mono h-10 md:h-11"
                        />
                      </div>
                      {items.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeItem(index)} className="h-10 w-10 md:h-11 md:w-11 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Section 4: Additional Information */}
        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-white overflow-hidden rounded-[1.5rem] ring-1 ring-gray-100">
          <div className="p-6 md:p-8">
            <SectionHeader icon={FileText} title="Additional Details" colorClass="bg-teal-600" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Invoice No.</Label>
                  <Input
                    value={formData.invoiceNo}
                    onChange={e => setFormData({ ...formData, invoiceNo: e.target.value })}
                    placeholder="Inv-001"
                    className="bg-gray-50 border-transparent focus:bg-white focus:border-teal-200 focus:ring-4 focus:ring-teal-50 transition-all font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">E-Way Bill No.</Label>
                  <Input
                    value={formData.ewayNo}
                    onChange={e => setFormData({ ...formData, ewayNo: e.target.value })}
                    placeholder="12 Digit Number"
                    className="bg-gray-50 border-transparent focus:bg-white focus:border-teal-200 focus:ring-4 focus:ring-teal-50 transition-all font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-gray-500 font-bold uppercase tracking-wider">Remarks / Special Instructions</Label>
                <textarea
                  value={formData.specialInstruction}
                  onChange={e => setFormData({ ...formData, specialInstruction: e.target.value })}
                  placeholder="Any handling instructions or notes..."
                  className="flex min-h-[120px] w-full rounded-md border border-transparent bg-gray-50 px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:border-teal-200 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Section 5: Charges */}
        <Card className="border-0 shadow-lg shadow-gray-200/50 bg-[#F8FAFC] overflow-hidden rounded-[1.5rem] ring-1 ring-gray-100">
          <div className="p-6 md:p-8">
            <SectionHeader icon={Receipt} title="Financials & Taxes" colorClass="bg-slate-700" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Base Charges</h4>
                <div className="space-y-4">
                  {['Freight', 'PF', 'Loading', 'Bilty'].map((label, i) => {
                    const keys = ['freight', 'pf', 'lc', 'bc'] as const;
                    const key = keys[i];
                    return (
                      <div key={key} className="flex items-center justify-between group">
                        <Label className="text-gray-600 font-medium group-hover:text-slate-800 transition-colors">{label} Charge</Label>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">₹</span>
                          <Input
                            type="number"
                            value={charges[key]}
                            onChange={e => updateCharges(key, Number(e.target.value))}
                            className="pl-6 text-right bg-gray-50 border-transparent focus:bg-white focus:border-slate-300 font-mono font-bold"
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-6 bg-[#1E1B4B] p-6 rounded-2xl text-white shadow-xl shadow-indigo-900/20 relative overflow-hidden">
                {/* Background Decor */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>

                <h4 className="text-xs font-bold text-indigo-200 uppercase tracking-widest border-b border-white/10 pb-2 relative z-10">Summary</h4>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center justify-between text-indigo-200 text-sm">
                    <span>Subtotal</span>
                    <span className="font-mono">₹{charges.total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-indigo-200 text-sm">
                    <span>Total GST (5%)</span>
                    <span className="font-mono">₹{(charges.cgst + charges.sgst + charges.igst).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-300 text-sm font-medium">
                    <span>Less: Advance</span>
                    <span className="font-mono">- ₹{charges.advance.toFixed(2)}</span>
                  </div>
                  <div className="pt-4 mt-2 border-t border-white/10 flex items-center justify-between">
                    <span className="text-lg font-bold">Grand Total</span>
                    <span className="text-3xl font-black tracking-tight">₹{charges.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 md:left-[280px] bg-white/80 backdrop-blur-xl border-t border-gray-200 z-50 transition-all duration-300">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()} className="text-gray-500 hover:text-red-600 hover:bg-red-50 h-10 px-4 font-medium">
            Cancel Draft
          </Button>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Net Payable</p>
              <p className="text-xl font-black text-[#1E1B4B]">₹{charges.grandTotal.toLocaleString()}</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#1E1B4B] hover:bg-[#2A275E] text-white shadow-lg shadow-indigo-900/20 h-11 px-8 rounded-xl font-bold tracking-wide transition-all active:scale-95 text-sm"
            >
              {loading ? (
                "Processing..."
              ) : (
                <>Create Bilty <ArrowRight className="ml-2 h-4 w-4" /></>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
