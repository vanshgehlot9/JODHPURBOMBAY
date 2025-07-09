"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Search, Download, Eye, Edit, Trash2, MoreHorizontal, FileText } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

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
    )
    setFilteredBilties(filtered)
  }, [searchTerm, bilties])

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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Bilty Documents</CardTitle>
            <CardDescription>
              {filteredBilties.length} of {bilties.length} bilties
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search bilties..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={handleExport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bilty No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Consignor</TableHead>
                <TableHead>Consignee</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBilties.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <p className="text-muted-foreground">No bilties found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBilties.map((bilty) => (
                  <TableRow key={bilty.id}>
                    <TableCell className="font-medium">#{bilty.biltyNo}</TableCell>
                    <TableCell>{formatDate(bilty.biltyDate)}</TableCell>
                    <TableCell>{bilty.consignorName}</TableCell>
                    <TableCell>{bilty.consigneeName}</TableCell>
                    <TableCell>
                      {bilty.from} → {bilty.to}
                    </TableCell>
                    <TableCell>₹{bilty.charges?.grandTotal?.toFixed(2) || "0.00"}</TableCell>
                    <TableCell>
                      <Badge variant={bilty.status === "delivered" ? "default" : "secondary"}>
                        {bilty.status || "pending"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(`/api/bilty/${bilty.id}/pdf`, "_blank")}>
                            <Eye className="mr-2 h-4 w-4" />
                            View PDF
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => (window.location.href = `/bilty/edit/${bilty.id}`)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/api/bilty/${bilty.id}/ewaybill`, "_blank")}>
                            <FileText className="mr-2 h-4 w-4" />
                            E-way Bill
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(bilty.id)} className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
