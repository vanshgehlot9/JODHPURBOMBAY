"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, FileSpreadsheet, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ExportForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    reportType: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { startDate, endDate, reportType } = formData
      const url = `/api/bilty/export?from=${encodeURIComponent(startDate)}&to=${encodeURIComponent(endDate)}`

      let filename = "report.xlsx"
      if (reportType === "financial") filename = "gst_report.xlsx"
      else if (reportType === "bilty") filename = "bilty_report.xlsx"
      else if (reportType === "ewayBill") filename = "ewaybill_report.xlsx"

      const response = await fetch(url, { method: "GET" })
      if (!response.ok) throw new Error("Network response was not ok")

      const blob = await response.blob()

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)
      }, 100)

      toast({
        title: "Success",
        description: "Report exported successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      startDate: "",
      endDate: "",
      reportType: "",
    })
  }

  return (
    <Card className="max-w-xl mx-auto shadow-xl border-0 ring-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border-b border-gray-100 pb-8 pt-8">
        <div className="flex items-center gap-4 justify-center mb-2">
          <div className="p-3 bg-white rounded-2xl shadow-sm ring-1 ring-gray-100">
            <FileSpreadsheet className="h-8 w-8 text-indigo-600" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold text-center text-gray-900">Export Data</CardTitle>
        <CardDescription className="text-center text-gray-500 text-base">
          Generate and download Excel reports for your bilty data
        </CardDescription>
      </CardHeader>
      <CardContent className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                required
                className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 border-gray-200"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-sm font-semibold text-gray-700">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                required
                className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 border-gray-200"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reportType" className="text-sm font-semibold text-gray-700">Report Type</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, reportType: value }))}
            >
              <SelectTrigger className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 border-gray-200">
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bilty" className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50">Bilty Report</SelectItem>
                <SelectItem value="ewayBill" className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50">E-way Bill Report</SelectItem>
                <SelectItem value="financial" className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50">Financial Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              className="h-11 px-6 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            >
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="h-11 px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Exporting..." : "Export to Excel"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
