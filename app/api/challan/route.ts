import { NextRequest, NextResponse } from "next/server";
import { createChallan, getAllChallans } from "@/lib/firestore";

export async function GET() {
  try {
    const challans = await getAllChallans();
    return NextResponse.json(challans);
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