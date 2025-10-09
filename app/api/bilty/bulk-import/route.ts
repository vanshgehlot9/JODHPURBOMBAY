import { type NextRequest, NextResponse } from "next/server"
import { collection, addDoc, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export async function POST(request: NextRequest) {
  try {
    const { bilties } = await request.json()

    if (!Array.isArray(bilties) || bilties.length === 0) {
      return NextResponse.json(
        { message: "Bilties array is required and must not be empty" },
        { status: 400 }
      )
    }

    const results = []
    const errors = []

    for (const biltyData of bilties) {
      try {
        // Validate required fields with more detail
        const requiredFields = ["biltyNo", "biltyDate", "consignorName", "consigneeName", "totalAmount"]
        const missingFields = requiredFields.filter(field => {
          const value = biltyData[field]
          if (field === 'totalAmount') {
            return !value || value <= 0
          }
          return !value || (typeof value === 'string' && value.trim() === '')
        })
        
        if (missingFields.length > 0) {
          errors.push({
            biltyNo: biltyData.biltyNo || "Unknown",
            error: `Missing or invalid fields: ${missingFields.join(", ")}`
          })
          continue
        }

        // Parse and validate date - handle DD-MM-YYYY format
        let biltyDate: Date
        if (biltyData.biltyDate instanceof Date) {
          biltyDate = biltyData.biltyDate
        } else if (typeof biltyData.biltyDate === 'string') {
          const dateStr = biltyData.biltyDate.trim()
          
          // Try DD-MM-YYYY format
          if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
            const [day, month, year] = dateStr.split('-').map(Number)
            biltyDate = new Date(year, month - 1, day)
          } else if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateStr)) {
            // Try DD/MM/YYYY format
            const [day, month, year] = dateStr.split('/').map(Number)
            biltyDate = new Date(year, month - 1, day)
          } else {
            // Try standard date parsing
            biltyDate = new Date(dateStr)
          }
        } else {
          biltyDate = new Date(biltyData.biltyDate)
        }
        
        // Validate date is valid
        if (isNaN(biltyDate.getTime())) {
          errors.push({
            biltyNo: biltyData.biltyNo || "Unknown",
            error: `Invalid date: ${biltyData.biltyDate}. Please use DD-MM-YYYY format`
          })
          continue
        }

        // Parse numeric fields
        const parseNum = (val: any): number => {
          if (typeof val === 'number') return val
          if (typeof val === 'string') {
            const cleaned = val.replace(/[₹,\s()]/g, '')
            const num = parseFloat(cleaned)
            return isNaN(num) ? 0 : num
          }
          return 0
        }

        const totalAmount = parseNum(biltyData.totalAmount)
        const sgst = parseNum(biltyData.sgst)
        const cgst = parseNum(biltyData.cgst)

        // Create bilty document
        const bilty = {
          biltyNo: parseInt(String(biltyData.biltyNo)),
          biltyDate: Timestamp.fromDate(biltyDate),
          consignorName: String(biltyData.consignorName).trim(),
          consignorGSTIN: String(biltyData.consignorGSTIN || "").trim(),
          consigneeName: String(biltyData.consigneeName).trim(),
          consigneeGSTIN: String(biltyData.consigneeGSTIN || "").trim(),
          from: String(biltyData.from || "JODHPUR").trim(),
          to: String(biltyData.to || "HYDERABAD").trim(),
          truckNo: String(biltyData.truckNo || "").trim(),
          items: biltyData.items || [{
            description: "Goods",
            quantity: 1,
            weight: 0,
            rate: totalAmount,
            freight: totalAmount
          }],
          charges: {
            freight: totalAmount,
            sgst: sgst,
            cgst: cgst,
            grandTotal: totalAmount
          },
          paidBy: String(biltyData.paidBy || "EXEMPTED").trim(),
          status: "pending",
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        }

        const docRef = await addDoc(collection(db, "bilties"), bilty)
        results.push({
          biltyNo: bilty.biltyNo,
          id: docRef.id,
          success: true
        })
      } catch (error: any) {
        console.error('Error processing bilty:', biltyData.biltyNo, error)
        errors.push({
          biltyNo: biltyData.biltyNo || "Unknown",
          error: error.message || 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      message: `Bulk import completed. ${results.length} succeeded, ${errors.length} failed.`,
      results,
      errors,
      total: bilties.length,
      succeeded: results.length,
      failed: errors.length
    }, { status: 200 })

  } catch (error: any) {
    console.error("Error in bulk import:", error)
    return NextResponse.json(
      { message: error?.message || "Internal server error" },
      { status: 500 }
    )
  }
}
