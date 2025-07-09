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
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export to Excel
        </CardTitle>
        <CardDescription>Export bilty data for the selected date range</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="reportType">Report Type</Label>
            <Select
              value={formData.reportType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, reportType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select report type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bilty">Bilty Report</SelectItem>
                <SelectItem value="ewayBill">E-way Bill Report</SelectItem>
                <SelectItem value="financial">Financial Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              {loading ? "Exporting..." : "Export to Excel"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
