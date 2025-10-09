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

  const parseBiltyData = (text: string) => {
    const lines = text.trim().split('\n')
    const bilties = []

    for (const line of lines) {
      // Skip empty lines, header line, and total line
      if (!line.trim() || 
          line.includes('Date G.R.') || 
          line.includes('Tot. Amt.') ||
          line.match(/^\d+\s+0\s+0$/) ||
          (!line.match(/^\d{2}-\d{2}-\d{4}/) && !line.includes('|'))) {
        continue
      }

      let parts: string[]
      
      // Check if data is pipe-delimited (from Excel) or space-delimited (from paste)
      if (line.includes('|')) {
        // Excel format with pipe delimiter
        parts = line.split('|').map(p => p.trim())
        
        // Expected format: Date|GR.NO|Consignor|ConsignorGSTIN|Consignee|ConsigneeGSTIN|Amt|SGST|CGST|PaidBy
        if (parts.length < 6) {
          console.warn('Skipping line with insufficient parts:', line)
          continue
        }
        
        const dateStr = parts[0]
        const grNo = parts[1]
        const consignor = parts[2] || ''
        const consignorGSTIN = parts[3] || ''
        const consignee = parts[4] || ''
        const consigneeGSTIN = parts[5] || ''
        const totalAmount = parseFloat((parts[6] || '0').replace(/[()]/g, '')) || 0
        const sgst = parseFloat(parts[7] || '0') || 0
        const cgst = parseFloat(parts[8] || '0') || 0
        const paidBy = parts[9] || 'EXEMPTED'

        // Convert date from DD-MM-YYYY to proper Date object
        const [day, month, year] = dateStr.split('-').map(part => parseInt(part, 10))
        const biltyDate = new Date(year, month - 1, day)
        
        if (isNaN(biltyDate.getTime())) {
          console.error(`Invalid date for bilty ${grNo}: ${dateStr}`)
          continue
        }

        console.log(`Parsed Bilty ${grNo}:`, {
          consignor,
          consignorGSTIN: consignorGSTIN || 'MISSING',
          consignee,
          consigneeGSTIN: consigneeGSTIN || 'MISSING'
        })

        bilties.push({
          biltyNo: grNo,
          biltyDate: biltyDate.toISOString(),
          consignorName: consignor,
          consignorGSTIN,
          consigneeName: consignee,
          consigneeGSTIN,
          totalAmount,
          sgst,
          cgst,
          paidBy,
          from: 'JODHPUR',
          to: 'HYDERABAD'
        })
      } else {
        // Original space-delimited format
        parts = line.split(/\s+/)
        
        if (parts.length < 8) continue

        const dateStr = parts[0]
        const grNo = parts[1]
        
        // Find GSTIN positions (they follow a pattern like 08XXXXX or 37XXXXX)
        let consignorGSTIN = ''
        let consigneeGSTIN = ''
        let consignor = ''
        let consignee = ''
        let totalAmount = 0
        let sgst = 0
        let cgst = 0
        let paidBy = ''

        // Extract data based on GSTIN pattern (15 characters starting with 2 digits)
        const gstinPattern = /^\d{2}[A-Z0-9]{13}$/
        
        let currentIndex = 2
        const consignorParts = []
        
        // Get consignor name (until we hit a GSTIN)
        while (currentIndex < parts.length && !gstinPattern.test(parts[currentIndex])) {
          consignorParts.push(parts[currentIndex])
          currentIndex++
        }
        consignor = consignorParts.join(' ')
        
        // Get consignor GSTIN
        if (currentIndex < parts.length && gstinPattern.test(parts[currentIndex])) {
          consignorGSTIN = parts[currentIndex]
          currentIndex++
        }
        
        // Get consignee name (until we hit another GSTIN)
        const consigneeParts = []
        while (currentIndex < parts.length && !gstinPattern.test(parts[currentIndex])) {
          consigneeParts.push(parts[currentIndex])
          currentIndex++
        }
        consignee = consigneeParts.join(' ')
        
        // Get consignee GSTIN
        if (currentIndex < parts.length && gstinPattern.test(parts[currentIndex])) {
          consigneeGSTIN = parts[currentIndex]
          currentIndex++
        }
        
        // Get amount (remove parentheses and parse)
        if (currentIndex < parts.length) {
          const amountStr = parts[currentIndex].replace(/[()]/g, '')
          totalAmount = parseFloat(amountStr) || 0
          currentIndex++
        }
        
        // Get SGST
        if (currentIndex < parts.length) {
          sgst = parseFloat(parts[currentIndex]) || 0
          currentIndex++
        }
        
        // Get CGST
        if (currentIndex < parts.length) {
          cgst = parseFloat(parts[currentIndex]) || 0
          currentIndex++
        }
        
        // Get Paid By
        if (currentIndex < parts.length) {
          paidBy = parts.slice(currentIndex).join(' ')
        }

        // Convert date from DD-MM-YYYY to proper Date object
        const [day, month, year] = dateStr.split('-').map(part => parseInt(part, 10))
        const biltyDate = new Date(year, month - 1, day)
        
        if (isNaN(biltyDate.getTime())) {
          console.error(`Invalid date for bilty ${grNo}: ${dateStr}`)
          continue
        }

        console.log(`Parsed Bilty ${grNo}:`, {
          consignor,
          consignorGSTIN: consignorGSTIN || 'MISSING',
          consignee,
          consigneeGSTIN: consigneeGSTIN || 'MISSING'
        })

        bilties.push({
          biltyNo: grNo,
          biltyDate: biltyDate.toISOString(),
          consignorName: consignor,
          consignorGSTIN,
          consigneeName: consignee,
          consigneeGSTIN,
          totalAmount,
          sgst,
          cgst,
          paidBy: paidBy || 'EXEMPTED',
          from: 'JODHPUR',
          to: 'HYDERABAD'
        })
      }
    }

    return bilties
  }

  const parseExcelFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          
          // Get the first sheet
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          
          // Convert to JSON to preserve column structure
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
          
          // Find header row (look for row with "Date" or "G.R" or similar)
          let headerRowIndex = 0
          for (let i = 0; i < Math.min(5, jsonData.length); i++) {
            const row = jsonData[i] as any[]
            const rowText = row.join('').toLowerCase()
            if (rowText.includes('date') || rowText.includes('g.r') || rowText.includes('consignor')) {
              headerRowIndex = i
              break
            }
          }
          
          const headers = jsonData[headerRowIndex] as any[]
          
          // Map column indices - be more flexible with header matching
          const columnMap: any = {}
          headers.forEach((header: any, index: number) => {
            const headerStr = String(header || '').toLowerCase().trim().replace(/[.\s]/g, '')
            
            if (headerStr.includes('date') && !columnMap.date) columnMap.date = index
            else if ((headerStr.includes('gr') || headerStr.includes('grno')) && !columnMap.grNo) columnMap.grNo = index
            else if (headerStr.includes('consignor') && headerStr.includes('gstin')) columnMap.consignorGSTIN = index
            else if (headerStr.includes('consignor') && !headerStr.includes('gstin') && !columnMap.consignor) columnMap.consignor = index
            else if (headerStr.includes('consignee') && headerStr.includes('gstin')) columnMap.consigneeGSTIN = index
            else if (headerStr.includes('consignee') && !headerStr.includes('gstin') && !columnMap.consignee) columnMap.consignee = index
            else if ((headerStr.includes('tot') && headerStr.includes('amt')) || headerStr.includes('totamt')) columnMap.amount = index
            else if (headerStr.includes('sgst')) columnMap.sgst = index
            else if (headerStr.includes('cgst')) columnMap.cgst = index
            else if (headerStr.includes('paid')) columnMap.paidBy = index
          })
          
          console.log('Column Map:', columnMap)
          console.log('Headers:', headers)
          
          // Convert rows to text format, preserving all columns
          const textLines: string[] = []
          for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[]
            if (!row || row.length === 0) continue
            
            // Skip summary/total rows
            const firstCell = String(row[0] || '').trim()
            if (!firstCell || !/^\d{2}-\d{2}-\d{4}/.test(firstCell)) continue
            
            // Build line with proper spacing and use | as delimiter for better parsing
            const line: string[] = []
            
            // Get values in the expected order
            if (columnMap.date !== undefined) line.push(String(row[columnMap.date] || '').trim())
            if (columnMap.grNo !== undefined) line.push(String(row[columnMap.grNo] || '').trim())
            if (columnMap.consignor !== undefined) line.push(String(row[columnMap.consignor] || '').trim())
            if (columnMap.consignorGSTIN !== undefined) line.push(String(row[columnMap.consignorGSTIN] || '').trim())
            if (columnMap.consignee !== undefined) line.push(String(row[columnMap.consignee] || '').trim())
            if (columnMap.consigneeGSTIN !== undefined) line.push(String(row[columnMap.consigneeGSTIN] || '').trim())
            if (columnMap.amount !== undefined) {
              const amt = String(row[columnMap.amount] || '0').trim().replace(/[()]/g, '')
              line.push(amt)
            }
            if (columnMap.sgst !== undefined) line.push(String(row[columnMap.sgst] || '0').trim())
            if (columnMap.cgst !== undefined) line.push(String(row[columnMap.cgst] || '0').trim())
            if (columnMap.paidBy !== undefined) line.push(String(row[columnMap.paidBy] || 'EXEMPTED').trim())
            
            console.log(`Row ${i}:`, line)
            
            // Only add if we have at least date and GR number
            if (line.length >= 2 && line[0] && line[1]) {
              textLines.push(line.join('|'))  // Use pipe delimiter
            }
          }
          
          const textData = textLines.join('\n')
          console.log('Parsed Excel Data:', textData)
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
      const bilties = parseBiltyData(data)

      if (bilties.length === 0) {
        toast({
          title: "Error",
          description: "No valid bilty data found",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      const response = await fetch('/api/bilty/bulk-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bilties })
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
                placeholder={`Format:\nDate GR.NO Consignor ConsignorGSTIN Consignee ConsigneeGSTIN Amount SGST CGST PaidBy\n\nExample:\n${sampleData}`}
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
