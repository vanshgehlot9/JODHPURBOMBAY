import { NextRequest, NextResponse } from "next/server";
import { createParty, getAllParties, searchParties } from "@/lib/firestore";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    
    let parties;
    if (search) {
      parties = await searchParties(search);
    } else {
      parties = await getAllParties();
    }
    
    return NextResponse.json({ parties });
  } catch (error: any) {
    console.error("Error fetching parties:", error);
    return NextResponse.json(
      { error: "Failed to fetch parties", details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, gstin, type, address, contactPerson, phone, email } = body;
    
    // Validation
    if (!name || !gstin) {
      return NextResponse.json(
        { error: "Name and GSTIN are required" },
        { status: 400 }
      );
    }
    
    // GSTIN format validation
    // Format: 2 digits (State Code) + 10 characters (PAN) + 3 alphanumeric characters
    // Example: 37ACRPK5945P1ZK or 27AAPFU0939F1ZV
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$/;
    if (gstin.length !== 15 || !gstinRegex.test(gstin)) {
      return NextResponse.json(
        { error: "Invalid GSTIN format. Must be 15 characters (Example: 37ACRPK5945P1ZK)" },
        { status: 400 }
      );
    }
    
    const partyId = await createParty({
      name,
      gstin,
      type,
      address,
      contactPerson,
      phone,
      email,
    });
    
    return NextResponse.json({ 
      message: "Party created successfully",
      id: partyId
    });
  } catch (error: any) {
    console.error("Error creating party:", error);
    return NextResponse.json(
      { error: "Failed to create party", details: error.message },
      { status: 500 }
    );
  }
}
