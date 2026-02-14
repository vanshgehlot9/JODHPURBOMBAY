"use client"

import React, { useState, useEffect, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  Filter,
  ArrowRight,
  MoreHorizontal,
  Eye,
  FileText,
  Download,
  Edit,
  Trash2,
  Check,
  Calendar,
  MapPin,
  Truck,
  ArrowUpRight
} from "lucide-react"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

// --- Types ---

interface Bilty {
  id: string
  biltyNo: number
  biltyDate: string
  consignorName: string
  consigneeName: string
  from: string
  to: string
  truckNo?: string
  charges: {
    grandTotal: number
  }
  status?: string
}

// --- Component ---

export function ViewBiltiesTable() {
  const { toast } = useToast()

  // -- State --
  const [bilties, setBilties] = useState<Bilty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBilties, setSelectedBilties] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  // -- Fetch Data --
  useEffect(() => {
    fetchBilties()
  }, [])

  const fetchBilties = async () => {
    try {
      const response = await fetch("/api/bilty", { cache: 'no-store' })
      if (response.ok) {
        const data = await response.json()
        setBilties(data)
      }
    } catch (error) {
      console.error("Failed to fetch bilties", error)
    } finally {
      setLoading(false)
    }
  }

  // -- Filtering & Sorting --
  const filteredBilties = useMemo(() => {
    return bilties.filter((bilty) => {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch =
        bilty.biltyNo.toString().includes(searchLower) ||
        bilty.consignorName.toLowerCase().includes(searchLower) ||
        bilty.consigneeName.toLowerCase().includes(searchLower) ||
        bilty.from.toLowerCase().includes(searchLower) ||
        bilty.to.toLowerCase().includes(searchLower) ||
        (bilty.truckNo && bilty.truckNo.toLowerCase().includes(searchLower))

      if (filterStatus === "all") return matchesSearch
      // Simple status logic for now, can be expanded
      return matchesSearch
    }).sort((a, b) => new Date(b.biltyDate).getTime() - new Date(a.biltyDate).getTime()) // Default sort by newest
  }, [bilties, searchTerm, filterStatus])

  // -- Handlers --

  const toggleSelectAll = () => {
    if (selectedBilties.size === filteredBilties.length) {
      setSelectedBilties(new Set())
    } else {
      setSelectedBilties(new Set(filteredBilties.map(b => b.id)))
    }
  }

  const toggleSelectBilty = (id: string) => {
    const newSelected = new Set(selectedBilties)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedBilties(newSelected)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this transport document?")) return
    try {
      const res = await fetch(`/api/bilty/${id}`, { method: "DELETE" })
      if (res.ok) {
        setBilties(prev => prev.filter(b => b.id !== id))
        toast({ title: "Deleted", description: "Record removed successfully." })
      }
    } catch (e) {
      toast({ title: "Error", description: "Could not delete record.", variant: "destructive" })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Delete ${selectedBilties.size} selected records?`)) return
    setIsDeleting(true)
    try {
      await Promise.all(Array.from(selectedBilties).map(id => fetch(`/api/bilty/${id}`, { method: "DELETE" })))
      setBilties(prev => prev.filter(b => !selectedBilties.has(b.id)))
      setSelectedBilties(new Set())
      toast({ title: "Bulk Delete", description: "Selected records removed." })
    } catch (e) {
      toast({ title: "Error", description: "Bulk delete failed.", variant: "destructive" })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleExport = () => {
    window.location.href = "/api/bilty/export"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })
  }

  // -- Render --

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-96 gap-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-gray-400 font-medium tracking-wide text-sm animate-pulse">LOADING REGISTRY...</p>
    </div>
  )

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-20">

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">

        {/* Search */}
        <div className="relative w-full sm:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
          </div>
          <Input
            placeholder="Search by ID, Party, or Route..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 rounded-xl shadow-sm text-base transition-all"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full sm:w-auto">
          {selectedBilties.size > 0 && (
            <Button
              variant="destructive"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="animate-in fade-in slide-in-from-right-4 rounded-xl shadow-red-100 shadow-lg"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedBilties.size})
            </Button>
          )}

          <Button variant="outline" onClick={handleExport} className="flex-1 sm:flex-none border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-indigo-700 h-12 px-6 rounded-xl font-medium shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button onClick={() => window.location.href = '/bilty/create'} className="flex-1 sm:flex-none bg-[#1E1B4B] text-white hover:bg-[#2A275E] h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
            <FileText className="h-4 w-4 mr-2" />
            New Bilty
          </Button>
        </div>
      </div>

      {/* Operational List */}
      <div className="space-y-4">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[auto_1.5fr_2.5fr_1fr_auto] gap-4 px-6 py-3 bg-[#1E1B4B]/5 rounded-xl border border-[#1E1B4B]/10 text-xs font-bold text-[#1E1B4B] uppercase tracking-wider items-center">
          <div className="flex items-center w-8 justify-center">
            <Checkbox
              checked={filteredBilties.length > 0 && selectedBilties.size === filteredBilties.length}
              onCheckedChange={toggleSelectAll}
              className="border-indigo-300 data-[state=checked]:bg-[#1E1B4B] data-[state=checked]:border-[#1E1B4B]"
            />
          </div>
          <div>Document Details</div>
          <div>Transportation Route</div>
          <div className="text-right">Amount</div>
          <div className="w-10"></div>
        </div>

        {/* List Items */}
        <div className="space-y-3">
          {filteredBilties.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">No Documents Found</h3>
              <p className="text-gray-500 max-w-sm mx-auto">Try adjusting your search terms or create a new bilty to get started.</p>
            </div>
          ) : (
            <AnimatePresence>
              {filteredBilties.map((bilty, index) => (
                <motion.div
                  key={bilty.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className={cn(
                    "group flex flex-col items-stretch md:grid md:grid-cols-[auto_1.5fr_2.5fr_1fr_auto] md:items-center gap-3 p-4 sm:gap-4 sm:p-5 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5 transition-all cursor-default relative overflow-hidden",
                    selectedBilties.has(bilty.id) && "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200"
                  )}
                >
                  {/* Hover Gradient Bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Checkbox */}
                  <div className="flex items-center w-8 justify-center self-center md:self-auto">
                    <Checkbox
                      checked={selectedBilties.has(bilty.id)}
                      onCheckedChange={() => toggleSelectBilty(bilty.id)}
                      className={cn(
                        "border-gray-200",
                        selectedBilties.has(bilty.id) ? "data-[state=checked]:bg-[#1E1B4B] data-[state=checked]:border-[#1E1B4B] opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                      )}
                    />
                  </div>

                  {/* ID & Date */}
                  <div>
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className="font-black text-gray-900 text-lg tracking-tight group-hover:text-indigo-700 transition-colors">#{bilty.biltyNo}</span>
                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-100 font-bold px-2 py-0.5 rounded-lg text-[10px] tracking-wide uppercase">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 font-medium">
                      <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                      {formatDate(bilty.biltyDate)}
                    </div>
                  </div>

                  {/* Route & Parties */}
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-bold text-gray-900 truncate">{bilty.from}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider sm:block hidden">Origin</span>
                      </div>
                      <div className="flex-none border-b-2 border-dashed border-gray-200 relative w-8 sm:w-12">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gray-100 rounded-full p-1">
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex flex-col text-right min-w-0 flex-1">
                        <span className="text-sm font-bold text-gray-900 truncate">{bilty.to}</span>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider sm:block hidden">Dest</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-1.5">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="truncate" title={bilty.consignorName}>{bilty.consignorName}</span>
                        <ArrowRight className="h-3 w-3 text-gray-300 flex-shrink-0" />
                        <span className="truncate" title={bilty.consigneeName}>{bilty.consigneeName}</span>
                      </div>
                      {bilty.truckNo && (
                        <div className="flex items-center gap-1.5 pl-3 border-l border-gray-200 flex-shrink-0">
                          <Truck className="h-3 w-3 text-indigo-500" />
                          <span className="font-mono font-bold text-gray-700">{bilty.truckNo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Financials */}
                  <div className="text-right">
                    <div className="font-black text-gray-900 text-lg tracking-tight group-hover:text-[#1E1B4B] transition-colors">
                      ₹{bilty.charges?.grandTotal?.toLocaleString('en-IN') || "0"}
                    </div>
                    <Badge variant="outline" className="mt-1 bg-amber-50 text-amber-700 border-amber-200 text-[10px] uppercase font-bold tracking-wide">
                      Receivable
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end pr-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-[#1E1B4B] hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all data-[state=open]:opacity-100 data-[state=open]:bg-indigo-50 data-[state=open]:text-[#1E1B4B]">
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-gray-100">
                        <DropdownMenuItem onClick={() => window.open(`/bilty/view/${bilty.id}`, "_blank")} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                          <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 group-hover:text-indigo-600 group-hover:bg-WHITE border border-gray-200">
                            <Eye className="h-4 w-4" />
                          </div>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => window.location.href = `/bilty/edit/${bilty.id}`} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                          <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                            <Edit className="h-4 w-4" />
                          </div>
                          Edit Record
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem onClick={() => window.open(`/api/bilty/${bilty.id}/pdf`, "_blank")} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                          <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                            <FileText className="h-4 w-4" />
                          </div>
                          View PDF
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          const link = document.createElement('a');
                          link.href = `/api/bilty/${bilty.id}/pdf`;
                          link.download = `bilty_${bilty.biltyNo}.pdf`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                          <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                            <Download className="h-4 w-4" />
                          </div>
                          Download PDF
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem onClick={() => handleDelete(bilty.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-lg py-2.5 font-medium">
                          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 text-red-500 border border-red-100">
                            <Trash2 className="h-4 w-4" />
                          </div>
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Footer / Pagination Placeholder */}
        <div className="flex justify-between items-center text-xs font-medium text-gray-400 px-2 pt-4">
          <div>Showing {filteredBilties.length} records</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="h-8 rounded-lg">Previous</Button>
            <Button variant="outline" size="sm" disabled className="h-8 rounded-lg">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}
