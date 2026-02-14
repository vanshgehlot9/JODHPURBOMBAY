import { NextRequest, NextResponse } from "next/server";
import { getPartyById, updateParty, deleteParty } from "@/lib/firestore";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const party = await getPartyById(params.id);
    
    if (!party) {
      return NextResponse.json(
        { error: "Party not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ party });
  } catch (error: any) {
    console.error("Error fetching party:", error);
    return NextResponse.json(
      { error: "Failed to fetch party", details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    
    await updateParty(params.id, body);
    
    return NextResponse.json({ 
      message: "Party updated successfully"
    });
  } catch (error: any) {
    console.error("Error updating party:", error);
    return NextResponse.json(
      { error: "Failed to update party", details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await deleteParty(params.id);
    
    return NextResponse.json({ 
      message: "Party deleted successfully"
    });
  } catch (error: any) {
    console.error("Error deleting party:", error);
    return NextResponse.json(
      { error: "Failed to delete party", details: error.message },
      { status: 500 }
    );
  }
}
