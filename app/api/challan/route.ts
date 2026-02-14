import { NextRequest, NextResponse } from "next/server";
import { createChallan, getAllChallans } from "@/lib/firestore";
import { Timestamp } from "firebase/firestore";

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const challans = await getAllChallans();
    
    // Serialize Firestore Timestamps to ISO strings
    const serializedChallans = challans.map((challan: any) => ({
      ...challan,
      date: challan.date instanceof Timestamp 
        ? challan.date.toDate().toISOString() 
        : (challan.date?.seconds ? new Date(challan.date.seconds * 1000).toISOString() : challan.date),
      createdAt: challan.createdAt instanceof Timestamp 
        ? challan.createdAt.toDate().toISOString() 
        : (challan.createdAt?.seconds ? new Date(challan.createdAt.seconds * 1000).toISOString() : challan.createdAt),
    }));
    
    return NextResponse.json(serializedChallans);
  } catch (error) {
    console.error("Error fetching challans:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const challanData = await request.json();

    // Validate required fields
    const requiredFields = ["date", "truckNo", "truckOwnerName", "from", "to", "items"];
    for (const field of requiredFields) {
      if (challanData[field] === undefined || challanData[field] === null) {
        return NextResponse.json({ message: `Field '${field}' is required` }, { status: 400 });
      }
    }

    if (!Array.isArray(challanData.items) || challanData.items.length === 0) {
      return NextResponse.json({ message: "Items cannot be empty" }, { status: 400 });
    }

    // Convert date string to Date object if needed
    if (typeof challanData.date === "string") {
      challanData.date = new Date(challanData.date);
    }

    const result = await createChallan(challanData);

    return NextResponse.json(
      {
        message: "Challan created successfully!",
        challanId: result.id,
        challanNo: result.challanNo,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating challan:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}