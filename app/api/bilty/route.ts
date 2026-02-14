import { type NextRequest, NextResponse } from "next/server"
import { getBilties, createBilty } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"
import { retryOperation, getErrorMessage, isNetworkError } from "@/lib/network-utils"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const status = searchParams.get("status")
    const date = searchParams.get("date")

    const filters: any = {}

    if (search) {
      filters.search = search
    }

    if (status) {
      filters.status = status
    }

    if (date) {
      const d = new Date(date)
      d.setHours(0, 0, 0, 0)
      const next = new Date(d)
      next.setDate(d.getDate() + 1)
      filters.dateFrom = d
      filters.dateTo = next
    }

    // Retry the operation with exponential backoff
    const bilties = await retryOperation(() => getBilties(filters), 2, 300);

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const serializedBilties = bilties.map((bilty) => ({
      ...bilty,
      biltyDate: bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate().toISOString() : bilty.biltyDate,
      createdAt: bilty.createdAt instanceof Timestamp ? bilty.createdAt.toDate().toISOString() : bilty.createdAt,
    }))

    return NextResponse.json(serializedBilties)
  } catch (error: any) {
    console.error("Error fetching bilties:", error)
    
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: isNetworkError(error) ? 503 : 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const biltyData = await request.json()

    // Validate required fields
    const requiredFields = ["biltyDate", "truckNo", "from", "to", "consignorName", "consigneeName", "items", "charges"]
    for (const field of requiredFields) {
      if (biltyData[field] === undefined || biltyData[field] === null) {
        return NextResponse.json({ message: `Field '${field}' is required` }, { status: 400 })
      }
    }

    if (!Array.isArray(biltyData.items) || biltyData.items.length === 0) {
      return NextResponse.json({ message: "Items cannot be empty" }, { status: 400 })
    }

    if (typeof biltyData.charges.grandTotal !== "number") {
      return NextResponse.json({ message: "charges.grandTotal is required" }, { status: 400 })
    }

    // Convert date string to Date object
    biltyData.biltyDate = new Date(biltyData.biltyDate)

    // Create bilty directly (no retry for write operations to avoid duplicates)
    const result = await createBilty(biltyData);

    return NextResponse.json(
      {
        message: "Bilty created successfully!",
        biltyId: result.id,
        biltyNo: result.biltyNo,
      },
      { status: 201 },
    )
  } catch (error: any) {
    console.error("Error creating bilty:", error)
    
    return NextResponse.json(
      { message: getErrorMessage(error) },
      { status: isNetworkError(error) ? 503 : 500 }
    )
  }
}
