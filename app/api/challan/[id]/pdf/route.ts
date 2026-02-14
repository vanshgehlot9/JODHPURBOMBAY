import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const challanId = params.id;
    const challanRef = doc(db, "challans", challanId);
    const challanSnap = await getDoc(challanRef);

    if (!challanSnap.exists()) {
      return new Response("Challan not found", { status: 404 });
    }

    const challan = challanSnap.data();

    // Fetch latest bilty details to ensure accurate data (Quantity, etc.)
    let enrichedItems = [];
    if (challan.items && Array.isArray(challan.items)) {
      enrichedItems = await Promise.all(challan.items.map(async (item: any) => {
        try {
          if (item.biltyNo) {
            // Try matching as number first, then string if needed
            const biltyRef = collection(db, "bilties");
            // Note: In Firestore numbers and strings are different. We'll try both numeric and string query if simple query fails, 
            // but usually consistency is maintained. Let's try flexible search.
            // A safer way is to fetch all bilties (cached logic?) or rely on specific type.
            // Given "biltyNo" is often a number in DB but string in JSON.
            // Let's try finding by numeric field first which is common for "biltyNo".

            let q = query(biltyRef, where("biltyNo", "==", Number(item.biltyNo)));
            let querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
              q = query(biltyRef, where("biltyNo", "==", String(item.biltyNo)));
              querySnapshot = await getDocs(q);
            }

            if (!querySnapshot.empty) {
              const biltyData = querySnapshot.docs[0].data();
              const firstBiltyItem = biltyData.items?.[0] || {};

              return {
                ...item,
                quantity: firstBiltyItem.quantity !== undefined ? firstBiltyItem.quantity : item.quantity,
                description: firstBiltyItem.goodsDescription || item.description,
                weight: firstBiltyItem.weight !== undefined ? firstBiltyItem.weight : item.weight,
                consignorName: biltyData.consignorName || item.consignorName,
                consigneeName: biltyData.consigneeName || item.consigneeName
              };
            }
          }
          return item;
        } catch (err) {
          console.error("Error enriching item:", err);
          return item;
        }
      }));
    } else {
      enrichedItems = [];
    }

    const pageWidth = 210;
    const pageHeight = 297;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // White background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');

    // Logo
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "truck.jpeg");
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = logoData.toString('base64');
        pdf.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 16, 13, 22, 18);
      }
    } catch (error) {
      console.log("Logo not found");
    }

    // Colorful header text - JODHPUR BOMBAY ROAD CARRIER
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");

    // JODHPUR - Orange (#f77f00)
    pdf.setTextColor(247, 127, 0);
    pdf.text("JODHPUR", 55, 18);

    // BOMBAY - Cyan (#00b4d8)
    pdf.setTextColor(0, 180, 216);
    pdf.text("BOMBAY", 95, 18);

    // ROAD - Light blue (#8ecae6)
    pdf.setTextColor(142, 202, 230);
    pdf.text("ROAD", 133, 18);

    // CARRIER - Orange (#f77f00)
    pdf.setTextColor(247, 127, 0);
    pdf.text("CARRIER", 160, 18);

    // Black text for address and contact
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Opp. Bhagat Singh Circle, Heavy Industrial Area, Jodhpur-342003", pageWidth / 2, 26, { align: "center" });

    pdf.setFontSize(8);
    pdf.text("GSTIN: 08AABFJ2988C1ZN  |  Mobile: +91 97821-77007 , +91 93147-10568", pageWidth / 2, 32, { align: "center" });

    // CHALLAN title in black
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("CHALLAN", pageWidth / 2, 44, { align: "center" });

    // Black line separator
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(15, 48, 195, 48);

    // Info section with black borders
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");

    // Fix date formatting - handle both string and Firestore Timestamp
    let formattedDate = 'N/A';
    try {
      if (challan.date) {
        if (challan.date.toDate) {
          // Firestore Timestamp
          formattedDate = challan.date.toDate().toLocaleDateString('en-GB');
        } else if (typeof challan.date === 'string') {
          // String date
          formattedDate = new Date(challan.date).toLocaleDateString('en-GB');
        } else {
          // Direct Date object
          formattedDate = new Date(challan.date).toLocaleDateString('en-GB');
        }
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      formattedDate = 'Invalid Date';
    }

    // Info boxes with black borders
    let infoY = 53;

    // Draw info box
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(15, infoY, 180, 10);

    // Vertical dividers
    pdf.line(75, infoY, 75, infoY + 10);
    pdf.line(135, infoY, 135, infoY + 10);

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("DATE:", 18, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(formattedDate, 33, infoY + 6);

    pdf.setFont("helvetica", "bold");
    pdf.text("CHALLAN NO:", 78, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.challanNo || ''), 105, infoY + 6);

    pdf.setFont("helvetica", "bold");
    pdf.text("TRUCK NO:", 138, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.truckNo || 'N/A'), 161, infoY + 6);

    infoY += 10;

    // Secondary info row
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(15, infoY, 180, 10);

    // Vertical divider for owner name
    pdf.line(105, infoY, 105, infoY + 10);

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "bold");
    pdf.text("Driver Name:", 18, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text("_____________________", 50, infoY + 6);

    pdf.setFont("helvetica", "bold");
    pdf.text("Owner Name:", 108, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.truckOwnerName || ''), 142, infoY + 6);

    // From/To row
    infoY += 10;
    pdf.setDrawColor(0, 0, 0);
    pdf.rect(15, infoY, 180, 10);

    // Vertical divider
    pdf.line(105, infoY, 105, infoY + 10);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("FROM:", 18, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.from || 'JODHPUR'), 35, infoY + 6);

    pdf.setFont("helvetica", "bold");
    pdf.text("TO:", 108, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.to || 'N/A'), 118, infoY + 6);

    // Table design with black borders
    let yPos = 83;

    // Table header
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPos, 180, 10);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);

    // Column headers
    pdf.text("SR", 17, yPos + 6);
    pdf.text("CONSIGNOR", 28, yPos + 6);
    pdf.text("CONSIGNEE", 55, yPos + 6);
    pdf.text("BILTY", 85, yPos + 6);
    pdf.text("PARTICULARS", 105, yPos + 6);
    pdf.text("QTY", 142, yPos + 6);
    pdf.text("WEIGHT", 155, yPos + 6);
    pdf.text("TOTAL", 175, yPos + 6);

    // Vertical dividers
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(25, yPos, 25, yPos + 10);   // After SR
    pdf.line(52, yPos, 52, yPos + 10);   // After Consignor
    pdf.line(82, yPos, 82, yPos + 10);   // After Consignee
    pdf.line(100, yPos, 100, yPos + 10); // After Bilty
    pdf.line(138, yPos, 138, yPos + 10); // After Particulars
    pdf.line(150, yPos, 150, yPos + 10); // After Qty
    pdf.line(170, yPos, 170, yPos + 10); // After Weight

    yPos += 10;

    // Data rows with black borders
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);

    if (enrichedItems && enrichedItems.length > 0) {
      enrichedItems.forEach((item: any, index: number) => {
        // Draw row border
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.rect(15, yPos, 180, 12);

        // Data in black
        pdf.setTextColor(0, 0, 0);
        pdf.text(String(index + 1), 17, yPos + 7);

        // Consignor name with wrapping
        const consignorText = (item.consignorName || "").toUpperCase();
        if (consignorText.length > 11) {
          pdf.setFontSize(7);
          pdf.text(consignorText.substring(0, 11), 27, yPos + 5);
          pdf.text(consignorText.substring(11, 22), 27, yPos + 9);
          pdf.setFontSize(8);
        } else {
          pdf.text(consignorText, 27, yPos + 7);
        }

        // Consignee name with wrapping
        const consigneeText = (item.consigneeName || "").toUpperCase();
        if (consigneeText.length > 11) {
          pdf.setFontSize(7);
          pdf.text(consigneeText.substring(0, 11), 54, yPos + 5);
          pdf.text(consigneeText.substring(11, 22), 54, yPos + 9);
          pdf.setFontSize(8);
        } else {
          pdf.text(consigneeText, 54, yPos + 7);
        }

        // Bilty in black
        pdf.text(String(item.biltyNo || ""), 84, yPos + 7);

        // Particulars with wrapping
        const particularText = (item.description || "").toUpperCase();
        if (particularText.length > 14) {
          pdf.setFontSize(7);
          pdf.text(particularText.substring(0, 14), 102, yPos + 5);
          pdf.text(particularText.substring(14, 28), 102, yPos + 9);
          pdf.setFontSize(8);
        } else {
          pdf.text(particularText, 102, yPos + 7);
        }

        // Right-aligned numbers
        const qty = String(item.quantity || "1");
        const weight = parseFloat(item.weight || 0);
        const total = parseFloat(item.freight || item.total || item.amount || 0);

        pdf.text(qty, 147, yPos + 7, { align: "right" });
        pdf.text(weight.toFixed(1), 167, yPos + 7, { align: "right" });
        pdf.text(`Rs.${total.toFixed(0)}`, 192, yPos + 7, { align: "right" });

        // Vertical dividers
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(25, yPos, 25, yPos + 12);
        pdf.line(52, yPos, 52, yPos + 12);
        pdf.line(82, yPos, 82, yPos + 12);
        pdf.line(100, yPos, 100, yPos + 12);
        pdf.line(138, yPos, 138, yPos + 12);
        pdf.line(150, yPos, 150, yPos + 12);
        pdf.line(170, yPos, 170, yPos + 12);

        yPos += 12;
      });
    }

    // Total row with black borders
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPos, 180, 10);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("TOTAL", 102, yPos + 7);

    // Calculate and display totals
    const totalQty = enrichedItems.reduce((sum: number, item: any) => sum + (parseInt(item.quantity) || 0), 0) || 0;
    const totalWeight = enrichedItems.reduce((sum: number, item: any) => sum + (parseFloat(item.weight) || 0), 0) || 0;
    const totalAmount = enrichedItems.reduce((sum: number, item: any) => sum + (parseFloat(item.freight || item.total || item.amount) || 0), 0) || 0;

    pdf.text(String(totalQty), 147, yPos + 7, { align: "right" });
    pdf.text(totalWeight.toFixed(1), 167, yPos + 7, { align: "right" });
    pdf.text(`Rs.${totalAmount.toFixed(0)}`, 192, yPos + 7, { align: "right" });

    // Vertical dividers for total
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.line(25, yPos, 25, yPos + 10);
    pdf.line(52, yPos, 52, yPos + 10);
    pdf.line(82, yPos, 82, yPos + 10);
    pdf.line(100, yPos, 100, yPos + 10);
    pdf.line(138, yPos, 138, yPos + 10);
    pdf.line(150, yPos, 150, yPos + 10);
    pdf.line(170, yPos, 170, yPos + 10);

    yPos += 15;

    // Footer note with black border
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    pdf.rect(15, yPos, 180, 8);

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(8);
    pdf.text("Note: The quantity of goods mentioned in the memo has been received in safe and sound condition.", 18, yPos + 5);

    yPos += 15;

    // Signature section in black
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("For: Jodhpur Bombay Road Carrier", 18, yPos);

    // Signature
    try {
      const signaturePath = path.join(process.cwd(), "public", "images", "signature.png");
      if (fs.existsSync(signaturePath)) {
        const signatureData = fs.readFileSync(signaturePath);
        const signatureBase64 = signatureData.toString('base64');

        pdf.addImage(`data:image/png;base64,${signatureBase64}`, 'PNG', 18, yPos + 5, 35, 12);
        yPos += 20;
      } else {
        yPos += 15;
        // Signature line in black
        pdf.setDrawColor(0, 0, 0);
        pdf.setLineWidth(0.5);
        pdf.line(18, yPos, 70, yPos);
      }
    } catch (error) {
      yPos += 15;
      pdf.setDrawColor(0, 0, 0);
      pdf.setLineWidth(0.5);
      pdf.line(18, yPos, 70, yPos);
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Authorised Signatory", 18, yPos + 5);

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=challan_${challan.challanNo}.pdf`,
      },
    });

  } catch (error) {
    console.error("Error generating challan PDF:", error);
    return new Response("Error generating PDF", { status: 500 });
  }
}
