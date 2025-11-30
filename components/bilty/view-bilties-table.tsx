"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  FileText,
  Filter,
  SortAsc,
  SortDesc,
  Calendar,
  MapPin,
  Truck,
  Users,
  CheckSquare,
  Square
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Checkbox } from "@/components/ui/checkbox"

interface Bilty {
  id: string
  biltyNo: number
  biltyDate: string
  consignorName: string
  consigneeName: string
  from: string
  to: string
  charges: {
    grandTotal: number
  }
  status?: string
}

export function ViewBiltiesTable() {
  const [bilties, setBilties] = useState<Bilty[]>([])
  const [filteredBilties, setFilteredBilties] = useState<Bilty[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<"biltyNo" | "biltyDate" | "grandTotal">("biltyDate")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [selectedBilties, setSelectedBilties] = useState<Set<string>>(new Set())
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleSort = (column: "biltyNo" | "biltyDate" | "grandTotal") => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

  const getSortIcon = (column: "biltyNo" | "biltyDate" | "grandTotal") => {
    if (sortBy !== column) return null
    return sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  useEffect(() => {
    fetchBilties()
  }, [])

  useEffect(() => {
    const filtered = bilties.filter(
      (bilty) =>
        bilty.biltyNo.toString().includes(searchTerm.toLowerCase()) ||
        bilty.consignorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bilty.consigneeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bilty.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bilty.to.toLowerCase().includes(searchTerm.toLowerCase()),
    ).sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "biltyNo":
          aValue = a.biltyNo
          bValue = b.biltyNo
          break
        case "biltyDate":
          aValue = new Date(a.biltyDate).getTime()
          bValue = new Date(b.biltyDate).getTime()
          break
        case "grandTotal":
          aValue = a.charges?.grandTotal || 0
          bValue = b.charges?.grandTotal || 0
          break
        default:
          return 0
      }

      return sortOrder === "asc" ? aValue - bValue : bValue - aValue
    })
    setFilteredBilties(filtered)
  }, [searchTerm, bilties, sortBy, sortOrder])

  const fetchBilties = async () => {
    try {
      const response = await fetch("/api/bilty")
      if (response.ok) {
        const data = await response.json()
        setBilties(data)
        setFilteredBilties(data)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch bilties",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bilty?")) return

    try {
      const response = await fetch(`/api/bilty/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setBilties(bilties.filter((b) => b.id !== id))
        toast({
          title: "Success",
          description: "Bilty deleted successfully",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete bilty",
        variant: "destructive",
      })
    }
  }

  const handleBulkDelete = async () => {
    if (selectedBilties.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select bilties to delete",
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete ${selectedBilties.size} selected bilty/bilties?`)) return

    setIsDeleting(true)
    try {
      const deletePromises = Array.from(selectedBilties).map(id =>
        fetch(`/api/bilty/${id}`, { method: "DELETE" })
      )

      const results = await Promise.all(deletePromises)
      const successCount = results.filter(r => r.ok).length
      const failCount = results.length - successCount

      setBilties(bilties.filter((b) => !selectedBilties.has(b.id)))
      setSelectedBilties(new Set())

      toast({
        title: "Bulk Delete Complete",
        description: `${successCount} bilty/bilties deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        variant: failCount > 0 ? "destructive" : "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete selected bilties",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

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

  const handleExport = () => {
    window.location.href = "/api/bilty/export"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN")
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading bilties...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Main Table */}
      <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100/50 pb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" />
                Bilty Documents
              </CardTitle>
              <CardDescription className="text-gray-500">
                {filteredBilties.length} of {bilties.length} bilties
                {searchTerm && ` matching "${searchTerm}"`}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search bilties, clients, routes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 border-gray-200"
                />
              </div>
              {selectedBilties.size > 0 && (
                <Button
                  onClick={handleBulkDelete}
                  variant="destructive"
                  disabled={isDeleting}
                  className="hover:bg-red-600 shadow-md shadow-red-200"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete ({selectedBilties.size})
                </Button>
              )}
              <Button onClick={handleExport} variant="outline" className="hover:bg-indigo-50 border-gray-200 text-gray-700">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredBilties.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-gray-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {searchTerm ? "No matching bilties found" : "No bilties created yet"}
              </h3>
              <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or clear the search to see all bilties"
                  : "Get started by creating your first bilty document"
                }
              </p>
              {!searchTerm && (
                <Button onClick={() => window.location.href = '/bilty/create'} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                  <FileText className="h-4 w-4 mr-2" />
                  Create First Bilty
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={filteredBilties.length > 0 && selectedBilties.size === filteredBilties.length}
                        onCheckedChange={toggleSelectAll}
                        className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                      />
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("biltyNo")}
                    >
                      <div className="flex items-center gap-2">
                        Bilty No
                        {getSortIcon("biltyNo")}
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("biltyDate")}
                    >
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-indigo-400" />
                        Date
                        {getSortIcon("biltyDate")}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        Consignor
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Consignee</TableHead>
                    <TableHead className="font-semibold text-gray-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        Route
                      </div>
                    </TableHead>
                    <TableHead
                      className="font-semibold text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort("grandTotal")}
                    >
                      <div className="flex items-center gap-2">
                        Amount
                        {getSortIcon("grandTotal")}
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-gray-700">Status</TableHead>
                    <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBilties.map((bilty) => (
                    <TableRow
                      key={bilty.id}
                      className="hover:bg-indigo-50/30 transition-all duration-200 border-b border-gray-50 group"
                    >
                      <TableCell>
                        <Checkbox
                          checked={selectedBilties.has(bilty.id)}
                          onCheckedChange={() => toggleSelectBilty(bilty.id)}
                          className="border-gray-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                          <span className="text-gray-900 font-mono">#{bilty.biltyNo}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-gray-600 font-medium">
                          {formatDate(bilty.biltyDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate font-medium text-gray-900">
                          {bilty.consignorName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate text-gray-600">
                          {bilty.consigneeName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <span className="font-medium text-indigo-600">{bilty.from}</span>
                          <span className="text-gray-300">→</span>
                          <span className="font-medium text-purple-600">{bilty.to}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-bold text-gray-900">
                          ₹{bilty.charges?.grandTotal?.toFixed(2) || "0.00"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-700 hover:bg-green-100 border-0"
                        >
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 shadow-xl border-gray-100 rounded-xl p-1">
                            <DropdownMenuItem
                              onClick={() => window.open(`/bilty/view/${bilty.id}`, "_blank")}
                              className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                            >
                              <Eye className="mr-2 h-4 w-4 text-indigo-600" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/api/bilty/${bilty.id}/pdf`, "_blank")}
                              className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                            >
                              <FileText className="mr-2 h-4 w-4 text-indigo-600" />
                              View PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/bilty/${bilty.id}/pdf`;
                              link.download = `bilty_${bilty.biltyNo}_3copies.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }} className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer">
                              <Download className="mr-2 h-4 w-4 text-indigo-600" />
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => (window.location.href = `/bilty/edit/${bilty.id}`)}
                              className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                            >
                              <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/api/bilty/${bilty.id}/ewaybill`, "_blank")}
                              className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                            >
                              <FileText className="mr-2 h-4 w-4 text-indigo-600" />
                              E-way Bill
                            </DropdownMenuItem>
                            <div className="h-px bg-gray-100 my-1"></div>
                            <DropdownMenuItem
                              onClick={() => handleDelete(bilty.id)}
                              className="hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
