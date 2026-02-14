"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Upload, FileSpreadsheet, CheckCircle, XCircle, FileText, Download } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function BulkBiltyImport() {
  const [data, setData] = useState("")
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("paste")
  const { toast } = useToast()

  const parseBiltyData = (data: string) => {
    const lines = data.trim().split('\n')
    const bilties: any[] = []
    const errors: string[] = []
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return
      
      try {
        let parts: string[]
        
        // Check if this is pipe-delimited (from Excel)
        if (trimmedLine.includes('|')) {
          parts = trimmedLine.split('|').map(p => p.trim())
        } else {
          // Space-delimited (from paste)
          parts = trimmedLine.split(/\s+/)
        }
        
        // Validate minimum fields (date and GR number required)
        if (parts.length < 2) {
          errors.push(`Line ${index + 1}: Not enough data. Need at least Date and G.R No`)
          return
        }
        
        // Parse date - handle DD-MM-YYYY format
        const dateStr = parts[0]
        let biltyDate: Date
        
        if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
          // DD-MM-YYYY format
          const [day, month, year] = dateStr.split('-').map(Number)
          biltyDate = new Date(year, month - 1, day)
        } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
          // DD/MM/YYYY or MM/DD/YYYY format
          const [part1, part2, year] = dateStr.split('/').map(Number)
          biltyDate = new Date(year, part2 - 1, part1) // Assume DD/MM/YYYY
        } else {
          errors.push(`Line ${index + 1}: Invalid date format "${dateStr}". Use DD-MM-YYYY`)
          return
        }
        
        if (isNaN(biltyDate.getTime())) {
          errors.push(`Line ${index + 1}: Invalid date "${dateStr}"`)
          return
        }
        
        // Parse fields with defaults
        const biltyNo = parts[1] || ''
        if (!biltyNo || biltyNo === '0') {
          errors.push(`Line ${index + 1}: Missing or invalid G.R No`)
          return
        }
        
        const consignorName = parts[2] || 'Unknown'
        const consignorGSTIN = parts[3] || ''
        const consigneeName = parts[4] || 'Unknown'
        const consigneeGSTIN = parts[5] || ''
        
        // Parse amounts - remove currency symbols and handle negative numbers in parentheses
        const parseAmount = (str: string = '0'): number => {
          if (!str) return 0
          const cleaned = str.replace(/[₹,\s()]/g, '').replace(/[^\d.-]/g, '')
          const num = parseFloat(cleaned)
          return isNaN(num) ? 0 : num
        }
        
        const totalAmount = parseAmount(parts[6])
        const sgst = parseAmount(parts[7])
        const cgst = parseAmount(parts[8])
        const paidBy = parts[9] || 'EXEMPTED'
        const from = parts[10] || 'JODHPUR'
        const to = parts[11] || 'HYDERABAD'
        const truckNo = parts[12] || ''
        
        // Additional validation
        if (totalAmount <= 0) {
          errors.push(`Line ${index + 1}: Total amount must be greater than 0`)
          return
        }
        
        // Create bilty object
        const bilty = {
          biltyNo: biltyNo.toString(),
          biltyDate,
          consignorName,
          consignorGSTIN,
          consigneeName,
          consigneeGSTIN,
          totalAmount,
          sgst,
          cgst,
          paidBy,
          from,
          to,
          truckNo,
          // Default values for other fields
          numberOfPackages: 1,
          typeOfPackaging: 'Box',
          weight: 0,
          description: '',
          ratePerUnit: 0,
          unit: 'Ton',
          additionalCharges: 0,
          unloadingCharges: 0,
          hamaliCharges: 0,
          courierCharges: 0,
          otherCharges: 0,
          remarks: '',
          paymentMode: 'Cash',
          paymentStatus: 'Unpaid',
        }
        
        bilties.push(bilty)
        
      } catch (error: any) {
        errors.push(`Line ${index + 1}: ${error.message}`)
      }
    })
    
    return { bilties, errors }
  }

  const parseExcelFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary', cellDates: true })
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convert to JSON to preserve column structure
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'dd-mm-yyyy' })
          
          // Find header row (look for row with "Date" or "G.R" or similar)
          let headerRowIndex = -1
          for (let i = 0; i < Math.min(10, jsonData.length); i++) {
            const row = jsonData[i] as any[]
            if (!row || row.length === 0) continue
            const rowText = row.join('').toLowerCase()
            if (rowText.includes('date') || rowText.includes('g.r') || rowText.includes('consignor')) {
              headerRowIndex = i
              break
            }
          }
          
          if (headerRowIndex === -1) {
            reject(new Error('Could not find header row. Please ensure your Excel has headers like "Date", "G.R No", "Consignor", etc.'))
            return
          }
          
          const headers = jsonData[headerRowIndex] as any[]
          
          // Map column indices - be more flexible with header matching
          const columnMap: any = {}
          headers.forEach((header: any, index: number) => {
            if (!header) return
            const headerStr = String(header).toLowerCase().trim().replace(/[.\s]/g, '')
            
            if (headerStr.includes('date') && !columnMap.date) columnMap.date = index
            else if ((headerStr.includes('gr') || headerStr.includes('grno') || headerStr.includes('biltyno')) && !columnMap.grNo) columnMap.grNo = index
            else if (headerStr.includes('consignor') && (headerStr.includes('gstin') || headerStr.includes('gst'))) columnMap.consignorGSTIN = index
            else if (headerStr.includes('consignor') && !headerStr.includes('gstin') && !headerStr.includes('gst') && !columnMap.consignor) columnMap.consignor = index
            else if (headerStr.includes('consignee') && (headerStr.includes('gstin') || headerStr.includes('gst'))) columnMap.consigneeGSTIN = index
            else if (headerStr.includes('consignee') && !headerStr.includes('gstin') && !headerStr.includes('gst') && !columnMap.consignee) columnMap.consignee = index
            else if ((headerStr.includes('tot') && headerStr.includes('amt')) || headerStr.includes('totamt') || headerStr.includes('amount') || headerStr.includes('total')) columnMap.amount = index
            else if (headerStr.includes('sgst')) columnMap.sgst = index
            else if (headerStr.includes('cgst')) columnMap.cgst = index
            else if (headerStr.includes('paid') || headerStr.includes('paidby')) columnMap.paidBy = index
            else if (headerStr.includes('from') || headerStr.includes('origin')) columnMap.from = index
            else if (headerStr.includes('to') || headerStr.includes('destination') || headerStr.includes('dest')) columnMap.to = index
            else if (headerStr.includes('truck') || headerStr.includes('vehicle')) columnMap.truckNo = index
          })
          
          // Validate required columns
          if (columnMap.date === undefined || columnMap.grNo === undefined) {
            reject(new Error('Required columns not found. Please ensure your Excel has "Date" and "G.R No" columns.'))
            return
          }
          
          // Convert rows to text format, preserving all columns
          const textLines: string[] = []
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[]
            if (!row || row.length === 0) continue
            
            // Get date value
            const dateValue = row[columnMap.date]
            if (!dateValue) continue
            
            // Convert date to DD-MM-YYYY format
            let dateStr = ''
            if (dateValue instanceof Date) {
              const day = String(dateValue.getDate()).padStart(2, '0')
              const month = String(dateValue.getMonth() + 1).padStart(2, '0')
              const year = dateValue.getFullYear()
              dateStr = `${day}-${month}-${year}`
            } else if (typeof dateValue === 'string') {
              // Check if already in DD-MM-YYYY format
              if (/^\d{2}-\d{2}-\d{4}$/.test(dateValue)) {
                dateStr = dateValue
              } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateValue)) {
                // Convert from MM/DD/YYYY or DD/MM/YYYY
                const parts = dateValue.split('/')
                dateStr = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`
              } else {
                // Try parsing as date
                const parsedDate = new Date(dateValue)
                if (!isNaN(parsedDate.getTime())) {
                  const day = String(parsedDate.getDate()).padStart(2, '0')
                  const month = String(parsedDate.getMonth() + 1).padStart(2, '0')
                  const year = parsedDate.getFullYear()
                  dateStr = `${day}-${month}-${year}`
                }
              }
            }
            
            if (!dateStr) {
              continue
            }
            
            // Get GR number
            const grNo = String(row[columnMap.grNo] || '').trim()
            if (!grNo || grNo === '0') continue
            
            // Skip summary/total rows
            if (grNo.toLowerCase().includes('total') || grNo.toLowerCase().includes('tot')) continue
            
            // Build line with proper spacing and use | as delimiter for better parsing
            const line: string[] = []
            
            // Add values in the expected order
            line.push(dateStr) // Date
            line.push(grNo) // GR No
            line.push(String(row[columnMap.consignor] || '').trim() || 'Unknown') // Consignor
            line.push(String(row[columnMap.consignorGSTIN] || '').trim()) // Consignor GSTIN
            line.push(String(row[columnMap.consignee] || '').trim() || 'Unknown') // Consignee
            line.push(String(row[columnMap.consigneeGSTIN] || '').trim()) // Consignee GSTIN
            
            // Amount - handle various formats
            let amount = '0'
            if (columnMap.amount !== undefined) {
              const rawAmount = String(row[columnMap.amount] || '0').trim()
              amount = rawAmount.replace(/[₹,\s()]/g, '').replace(/[^\d.-]/g, '')
              if (!amount || amount === '') amount = '0'
            }
            line.push(amount)
            
            line.push(String(row[columnMap.sgst] || '0').trim()) // SGST
            line.push(String(row[columnMap.cgst] || '0').trim()) // CGST
            line.push(String(row[columnMap.paidBy] || 'EXEMPTED').trim()) // Paid By
            line.push(String(row[columnMap.from] || 'JODHPUR').trim()) // From
            line.push(String(row[columnMap.to] || 'HYDERABAD').trim()) // To
            line.push(String(row[columnMap.truckNo] || '').trim()) // Truck No
            
            // Add line
            textLines.push(line.join('|'))
          }
          
          if (textLines.length === 0) {
            reject(new Error('No valid data rows found in Excel file. Please check your data format.'))
            return
          }
          
          const textData = textLines.join('\n')
          resolve(textData)
        } catch (error: any) {
          reject(new Error(`Failed to parse Excel file: ${error.message}`))
        }
      }
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      
      reader.readAsBinaryString(file)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ]
    
    if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx?|csv)$/i)) {
      toast({
        title: "Error",
        description: "Please upload a valid Excel (.xlsx, .xls) or CSV file",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)
      const textData = await parseExcelFile(file)
      setData(textData)
      setActiveTab("paste") // Switch to paste tab to show parsed data
      
      toast({
        title: "Success",
        description: "Excel file parsed successfully. Review the data and click Import.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!data.trim()) {
      toast({
        title: "Error",
        description: "Please paste the bilty data",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const parsedData = parseBiltyData(data)

      if (parsedData.bilties.length === 0) {
        toast({
          title: "Error",
          description: parsedData.errors.length > 0 
            ? `Failed to parse data:\n${parsedData.errors.slice(0, 5).join('\n')}${parsedData.errors.length > 5 ? `\n...and ${parsedData.errors.length - 5} more errors` : ''}`
            : "No valid bilty data found",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Show warnings if there were errors
      if (parsedData.errors.length > 0) {
        toast({
          title: "Warning",
          description: `${parsedData.errors.length} lines could not be parsed. Importing ${parsedData.bilties.length} valid bilties.`,
          variant: "default"
        })
      }

      const response = await fetch('/api/bilty/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bilties: parsedData.bilties })
      })

      const result = await response.json()
      setResults(result)

      if (response.ok) {
        toast({
          title: "Success",
          description: result.message,
        })
      } else {
        toast({
          title: "Error",
          description: result.message,
          variant: "destructive"
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to import bilties",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const exportResultsToPdf = () => {
    if (!results) return

    const doc = new jsPDF()
    
    // Add title
    doc.setFontSize(18)
    doc.text('Bulk Bilty Import Results', 14, 20)
    
    // Add summary
    doc.setFontSize(12)
    doc.text(`Import Date: ${new Date().toLocaleDateString()}`, 14, 30)
    doc.text(`Total Bilties: ${results.total}`, 14, 38)
    doc.text(`Succeeded: ${results.succeeded}`, 14, 46)
    doc.text(`Failed: ${results.failed}`, 14, 54)
    
    // Add successful imports table if any
    if (results.results && results.results.length > 0) {
      doc.setFontSize(14)
      doc.text('Successfully Imported Bilties', 14, 68)
      
      const successData = results.results.map((item: any) => [
        item.biltyNo,
        item.id.substring(0, 8) + '...'
      ])
      
      autoTable(doc, {
        startY: 72,
        head: [['Bilty No.', 'Document ID']],
        body: successData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }, // green
        margin: { left: 14 }
      })
    }
    
    // Add errors table if any
    if (results.errors && results.errors.length > 0) {
      const finalY = (doc as any).lastAutoTable?.finalY || 75
      
      doc.setFontSize(14)
      doc.text('Failed Imports', 14, finalY + 10)
      
      const errorData = results.errors.map((item: any) => [
        item.biltyNo,
        item.error
      ])
      
      autoTable(doc, {
        startY: finalY + 14,
        head: [['Bilty No.', 'Error']],
        body: errorData,
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }, // red
        margin: { left: 14 },
        columnStyles: {
          1: { cellWidth: 120 }
        }
      })
    }
    
    // Save the PDF
    const fileName = `bulk-import-results-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(fileName)
    
    toast({
      title: "Success",
      description: "Results exported to PDF successfully",
    })
  }

  const sampleData = `07-01-2025 2165 DAULAT INDUSTRIES 08AABFD6109L1ZF APARNA METAL INDUSTRIES 37ABYPM0832H1ZA 45946.00 0 0 EXEMPTED
07-01-2025 2166 DAULAT INDUSTRIES 08AABFD6109L1ZF GURUDEVA INDUSTRIES 37AKKPM0063F1ZA 45121.00 0 0 EXEMPTED`

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Bulk Bilty Import
        </CardTitle>
        <CardDescription>
          Import multiple bilties at once using Excel file or paste text data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <Alert className="bg-blue-50 border-blue-200">
          <AlertDescription className="text-sm space-y-2">
            <div className="font-semibold text-blue-900">📋 Import Instructions:</div>
            <div className="text-blue-800">
              <strong>Excel Format:</strong> Your Excel should have headers in the first row:
              <div className="ml-4 mt-1 font-mono text-xs">Date | G.R No | Consignor | Consignor GSTIN | Consignee | Consignee GSTIN | Tot.Amt | SGST | CGST | Paid By | From | To | Truck No</div>
            </div>
            <div className="text-blue-800">
              <strong>Date Format:</strong> DD-MM-YYYY (e.g., 07-01-2025)
            </div>
            <div className="text-blue-800">
              <strong>Required Fields:</strong> Date, G.R No, Consignor, Consignee, Tot.Amt
            </div>
            <div className="text-blue-800">
              <strong>Supported Files:</strong> .xlsx, .xls, .csv
            </div>
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Paste Text
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Upload Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Paste Bilty Data</label>
              <Textarea
                placeholder={`Format (space-separated):\nDate GR.NO Consignor ConsignorGSTIN Consignee ConsigneeGSTIN Amount SGST CGST PaidBy From To TruckNo\n\nExample:\n${sampleData}`}
                value={data}
                onChange={(e) => setData(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Upload Excel File</label>
              <div className="flex items-center gap-4">
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  onChange={handleFileUpload}
                  disabled={loading}
                  className="cursor-pointer"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Upload an Excel file (.xlsx, .xls) or CSV file with columns: Date, G.R.NO, Consignor, Consignor GSTIN, Consignee, Consignee GSTIN, Tot. Amt., SGST, CGST, Paid by
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleImport} 
          disabled={loading || !data.trim()}
          className="w-full"
        >
          <Upload className="mr-2 h-4 w-4" />
          {loading ? "Importing..." : "Import Bilties"}
        </Button>

        {results && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Alert className="flex-1">
                <AlertDescription>
                  <div className="flex items-center gap-2 font-semibold">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    {results.succeeded} succeeded
                    {results.failed > 0 && (
                      <>
                        <XCircle className="h-4 w-4 text-red-600 ml-4" />
                        {results.failed} failed
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={exportResultsToPdf}
                variant="outline"
                className="ml-4"
                title="Export results to PDF"
              >
                <Download className="mr-2 h-4 w-4" />
                Export to PDF
              </Button>
            </div>

            {results.errors && results.errors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Errors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    {results.errors.map((err: any, idx: number) => (
                      <div key={idx} className="text-sm text-red-600 py-1">
                        Bilty #{err.biltyNo}: {err.error}
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {results.results && results.results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Successfully Imported</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-40">
                    {results.results.map((res: any, idx: number) => (
                      <div key={idx} className="text-sm text-green-600 py-1">
                        ✓ Bilty #{res.biltyNo} imported (ID: {res.id})
                      </div>
                    ))}
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
