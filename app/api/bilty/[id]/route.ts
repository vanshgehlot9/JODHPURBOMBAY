import { type NextRequest, NextResponse } from "next/server"
import { getBiltyById, updateBilty, deleteBilty } from "@/lib/firestore"
import { Timestamp } from "firebase/firestore"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const bilty = await getBiltyById(params.id)

    if (!bilty) {
      return NextResponse.json({ message: "Bilty not found" }, { status: 404 })
    }

    // Convert Firestore Timestamps to ISO strings for JSON serialization
    const serializedBilty = {
      ...bilty,
      biltyDate: bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate().toISOString() : bilty.biltyDate,
      createdAt: bilty.createdAt instanceof Timestamp ? bilty.createdAt.toDate().toISOString() : bilty.createdAt,
    }

    return NextResponse.json(serializedBilty)
  } catch (error) {
    console.error("Error fetching bilty:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()

    // Convert date string to Date object if present
    if (updates.biltyDate) {
      updates.biltyDate = new Date(updates.biltyDate)
    }

    await updateBilty(params.id, updates)

    return NextResponse.json({ message: "Bilty updated successfully!" })
  } catch (error) {
    console.error("Error updating bilty:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteBilty(params.id)
    return NextResponse.json({ message: "Bilty deleted successfully" })
  } catch (error) {
    console.error("Error deleting bilty:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
