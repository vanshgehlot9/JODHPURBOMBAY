import { NextRequest, NextResponse } from "next/server";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // 'consignor', 'consignee', 'truck'
    const searchTerm = searchParams.get("search")?.toLowerCase() || "";

    if (!type) {
      return NextResponse.json(
        { error: "Type parameter is required" },
        { status: 400 }
      );
    }

    const biltiesRef = collection(db, "bilties");
    const snapshot = await getDocs(biltiesRef);

    // Create a map to store unique entries with their associated data
    const suggestionMap = new Map<string, any>();

    snapshot.docs.forEach((doc) => {
      const data = doc.data();

      if (type === "consignor") {
        const name = data.consignorName?.toLowerCase();
        const gst = data.consignorGst || data.consignorGSTIN || "";
        
        if (name && name.includes(searchTerm)) {
          // Store or update with the most recent entry
          if (!suggestionMap.has(name) || suggestionMap.get(name).gst === "") {
            suggestionMap.set(name, {
              name: data.consignorName,
              gst: gst,
              displayName: data.consignorName,
              displayGst: gst,
            });
          }
        }
      } else if (type === "consignee") {
        const name = data.consigneeName?.toLowerCase();
        const gst = data.consigneeGst || data.consigneeGSTIN || "";
        
        if (name && name.includes(searchTerm)) {
          if (!suggestionMap.has(name) || suggestionMap.get(name).gst === "") {
            suggestionMap.set(name, {
              name: data.consigneeName,
              gst: gst,
              displayName: data.consigneeName,
              displayGst: gst,
            });
          }
        }
      } else if (type === "truck") {
        const truckNo = data.truckNo?.toLowerCase();
        
        if (truckNo && truckNo.includes(searchTerm)) {
          if (!suggestionMap.has(truckNo)) {
            suggestionMap.set(truckNo, {
              truckNo: data.truckNo,
              displayTruckNo: data.truckNo,
              // Also include recent consignor/consignee for context
              lastConsignor: data.consignorName,
              lastConsignee: data.consigneeName,
            });
          }
        }
      }
    });

    // Convert map to array and limit results
    const suggestions = Array.from(suggestionMap.values()).slice(0, 10);

    return NextResponse.json({ suggestions });
  } catch (error: any) {
    console.error("Error fetching suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
