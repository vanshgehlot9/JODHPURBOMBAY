import { type NextRequest, NextResponse } from "next/server"
import { getBilties } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"
import ExcelJS from "exceljs"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")

    const filters: any = {}
    if (from && to) {
      filters.dateFrom = new Date(from)
      filters.dateTo = new Date(to)
    }

    const bilties = await getBilties(filters)

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("GST Report")

    // Company Header
    worksheet.mergeCells("A1:J1")
    worksheet.getCell("A1").value = "Jodhpur Bombay Road Carrier"
    worksheet.getCell("A1").font = { bold: true, size: 14 }
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" }

    worksheet.mergeCells("A2:J2")
    worksheet.getCell("A2").value = "P.No. 69, Transport Nagar, IInd PHASE BASANI, JODHPUR    08AAAHL5963P1ZK"
    worksheet.getCell("A2").font = { size: 12 }
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" }

    worksheet.mergeCells("A4:J4")
    worksheet.getCell("A4").value = "GST REPORT"
    worksheet.getCell("A4").font = { bold: true, size: 12 }
    worksheet.getCell("A4").alignment = { vertical: "middle", horizontal: "center" }

    // Date Range Row
    worksheet.mergeCells("A5:B5")
    worksheet.getCell("A5").value = "Date From"
    worksheet.getCell("A5").font = { bold: true }
    worksheet.getCell("C5").value = from ? new Date(from).toLocaleDateString("en-GB") : ""
    worksheet.getCell("D5").value = "To"
    worksheet.getCell("E5").value = to ? new Date(to).toLocaleDateString("en-GB") : ""

    // Table Header
    worksheet.addRow([
      "Date",
      "G.R..NO.",
      "Consignor",
      "Consignor GSTIN",
      "Consignee",
      "Consignee GSTIN",
      "Tot. Amt.",
      "SGST",
      "CGST",
      "Paid by",
    ])
    const headerRow = worksheet.lastRow
    if (headerRow) {
      headerRow.font = { bold: true }
      headerRow.alignment = { horizontal: "center" }
    }

    // Data Rows
    bilties.forEach((bilty) => {
      const biltyDate = bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)

      worksheet.addRow([
        biltyDate.toLocaleDateString("en-GB"),
        bilty.biltyNo || "",
        bilty.consignorName || "",
        bilty.consignorGst || "",
        bilty.consigneeName || "",
        bilty.consigneeGst || "",
        bilty.charges ? bilty.charges.grandTotal : 0,
        bilty.charges ? bilty.charges.sgst : 0,
        bilty.charges ? bilty.charges.cgst : 0,
        "consignee",
      ])
    })

    // Set column widths
    const widths = [12, 10, 20, 18, 20, 18, 12, 10, 10, 12]
    widths.forEach((w, i) => {
      const column = worksheet.getColumn(i + 1)
      if (column) column.width = w
    })

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="gst_report.xlsx"',
      },
    })
  } catch (error) {
    console.error("Excel Export Error:", error)
    return NextResponse.json({ message: "Failed to export data" }, { status: 500 })
  }
}
