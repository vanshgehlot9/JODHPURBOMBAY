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
        // Validate required fields
        const requiredFields = ["biltyNo", "biltyDate", "consignorName", "consigneeName", "totalAmount"]
        const missingFields = requiredFields.filter(field => !biltyData[field])
        
        if (missingFields.length > 0) {
          errors.push({
            biltyNo: biltyData.biltyNo || "Unknown",
            error: `Missing fields: ${missingFields.join(", ")}`
          })
          continue
        }

        // Parse and validate date
        let biltyDate: Date
        if (biltyData.biltyDate instanceof Date) {
          biltyDate = biltyData.biltyDate
        } else {
          biltyDate = new Date(biltyData.biltyDate)
        }
        
        // Validate date is valid
        if (isNaN(biltyDate.getTime())) {
          errors.push({
            biltyNo: biltyData.biltyNo || "Unknown",
            error: `Invalid date: ${biltyData.biltyDate}`
          })
          continue
        }

        // Create bilty document
        const bilty = {
          biltyNo: parseInt(biltyData.biltyNo),
          biltyDate: Timestamp.fromDate(biltyDate),
          consignorName: biltyData.consignorName,
          consignorGSTIN: biltyData.consignorGSTIN || "",
          consigneeName: biltyData.consigneeName,
          consigneeGSTIN: biltyData.consigneeGSTIN || "",
          from: biltyData.from || "JODHPUR",
          to: biltyData.to || "HYDERABAD",
          truckNo: biltyData.truckNo || "",
          items: biltyData.items || [{
            description: "Goods",
            quantity: 1,
            weight: 0,
            rate: biltyData.totalAmount || 0,
            freight: biltyData.totalAmount || 0
          }],
          charges: {
            freight: biltyData.totalAmount || 0,
            sgst: biltyData.sgst || 0,
            cgst: biltyData.cgst || 0,
            grandTotal: biltyData.totalAmount || 0
          },
          paidBy: biltyData.paidBy || "EXEMPTED",
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
        errors.push({
          biltyNo: biltyData.biltyNo || "Unknown",
          error: error.message
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
