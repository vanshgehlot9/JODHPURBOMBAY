import { NextRequest, NextResponse } from "next/server";
import { doc, getDoc } from "firebase/firestore";
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

    const pageWidth = 210;
    const pageHeight = 297;

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Modern gradient-style header background with custom dark blue (#003049)
    pdf.setFillColor(0, 48, 73);
    pdf.rect(0, 0, pageWidth, 50, 'F');
    
    // Accent stripe with orange (#f77f00)
    pdf.setFillColor(247, 127, 0);
    pdf.rect(0, 50, pageWidth, 2, 'F');
    
    // Logo with modern circular frame
    try {
      const logoPath = path.join(process.cwd(), "public", "images", "truck.jpeg");
      if (fs.existsSync(logoPath)) {
        const logoData = fs.readFileSync(logoPath);
        const logoBase64 = logoData.toString('base64');
        
        // White circular background for logo
        pdf.setFillColor(255, 255, 255);
        
        
        pdf.addImage(`data:image/jpeg;base64,${logoBase64}`, 'JPEG', 16, 13, 22, 18);
      }
    } catch (error) {
      console.log("Logo not found");
    }

    // Modern header text with gradient color effect
    pdf.setFontSize(22);
    pdf.setFont("helvetica", "bold");
    
    // Create gradient effect by coloring each word differently
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
    
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.text("Opp. Bhagat Singh Circle, Heavy Industrial Area, Jodhpur-342003", pageWidth / 2, 26, { align: "center" });
    
    pdf.setFontSize(8);
    pdf.text("GSTIN: 08AABFJ2988C1ZN  |  Mobile: +91 97821-77007 , +91 93147-10568", pageWidth / 2, 32, { align: "center" });

    // Modern CHALLAN badge with cyan (#00b4d8)
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(pageWidth / 2 - 28, 37, 56, 10, 2, 2, 'F');
    pdf.setTextColor(0, 180, 216);
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text("CHALLAN", pageWidth / 2, 44, { align: "center" });

    // Modern card-style container with shadow effect
    pdf.setDrawColor(220, 220, 220);
    pdf.setFillColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    
    // Shadow effect
    pdf.setFillColor(240, 240, 240);
    pdf.roundedRect(16, 58, 178, 170, 3, 3, 'F');
    
    // Main white card
    pdf.setFillColor(255, 255, 255);
    pdf.roundedRect(15, 57, 178, 170, 3, 3, 'FD');

    // Modern info cards with icons-style layout
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
    
    // Modern info pills/badges with custom colors
    let infoY = 63;
    
    // Date badge - cyan (#00b4d8)
    pdf.setFillColor(0, 180, 216);
    pdf.roundedRect(20, infoY, 50, 8, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "bold");
    pdf.text("DATE", 23, infoY + 5);
    pdf.setFont("helvetica", "normal");
    pdf.text(formattedDate, 67, infoY + 5, { align: "right" });
    
    // Challan No badge - orange (#f77f00)
    pdf.setFillColor(247, 127, 0);
    pdf.roundedRect(75, infoY, 55, 8, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text("CHALLAN NO", 78, infoY + 5);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.challanNo || ''), 127, infoY + 5, { align: "right" });
    
    // Truck No badge - dark blue (#003049)
    pdf.setFillColor(0, 48, 73);
    pdf.roundedRect(135, infoY, 52, 8, 1, 1, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.text("TRUCK NO", 138, infoY + 5);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.truckNo || 'N/A'), 184, infoY + 5, { align: "right" });
    
    infoY += 12;
    
    // Secondary info row with modern style
    pdf.setFillColor(248, 249, 250);
    pdf.roundedRect(20, infoY, 167, 10, 1, 1, 'F');
    pdf.setTextColor(80, 80, 80);
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.text("Driver Name: _________________", 24, infoY + 6);
    pdf.text("Owner Name: _________________", 85, infoY + 6);
    pdf.text("Lic No: __________", 148, infoY + 6);

    // Modern From/To banner with cyan (#00b4d8)
    infoY += 14;
    pdf.setFillColor(0, 180, 216);
    pdf.roundedRect(20, infoY, 167, 10, 1, 1, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("FROM:", 24, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.from || 'JODHPUR'), 42, infoY + 6);
    
    pdf.setFont("helvetica", "bold");
    pdf.text("TO:", 110, infoY + 6);
    pdf.setFont("helvetica", "normal");
    pdf.text(String(challan.to || 'N/A'), 122, infoY + 6);

    // Modern table design with sleek styling
    let yPos = 103;
    
    // Table header with dark blue (#003049)
    pdf.setFillColor(0, 48, 73);
    pdf.roundedRect(20, yPos - 4, 167, 10, 1, 1, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(8);
    
    // Optimized column headers with perfect spacing
    pdf.text("SR", 22, yPos);
    pdf.text("CONSIGNOR", 31, yPos);
    pdf.text("CONSIGNEE", 58, yPos);
    pdf.text("BILTY", 88, yPos);
    pdf.text("PARTICULARS", 108, yPos);
    pdf.text("QTY", 144, yPos);
    pdf.text("WEIGHT", 156, yPos);
    pdf.text("TOTAL", 176, yPos);

    // Modern vertical dividers with optimized positions
    pdf.setDrawColor(255, 255, 255, 0.3);
    pdf.setLineWidth(0.5);
    pdf.line(27, yPos - 4, 27, yPos + 6);   // After SR
    pdf.line(55, yPos - 4, 55, yPos + 6);   // After Consignor
    pdf.line(85, yPos - 4, 85, yPos + 6);   // After Consignee
    pdf.line(103, yPos - 4, 103, yPos + 6); // After Bilty
    pdf.line(140, yPos - 4, 140, yPos + 6); // After Particulars
    pdf.line(151, yPos - 4, 151, yPos + 6); // After Qty
    pdf.line(170, yPos - 4, 170, yPos + 6); // After Weight

    yPos += 10;

    // Modern data rows with card-style design
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(7);
    
    if (challan.items && challan.items.length > 0) {
      challan.items.forEach((item: any, index: number) => {
        // Modern alternating rows with subtle colors
        if (index % 2 === 0) {
          pdf.setFillColor(250, 251, 252);
        } else {
          pdf.setFillColor(255, 255, 255);
        }
        pdf.roundedRect(20, yPos - 3, 167, 12, 0.5, 0.5, 'F');
        
        // Subtle row border
        pdf.setDrawColor(230, 230, 230);
        pdf.setLineWidth(0.2);
        pdf.roundedRect(20, yPos - 3, 167, 12, 0.5, 0.5, 'S');
        
        // Data with modern styling
        pdf.setTextColor(60, 60, 60);
        pdf.text(String(index + 1), 23, yPos + 2);
        
        // Full consignor name with optimized wrapping
        const consignorText = (item.consignorName || "").toUpperCase();
        if (consignorText.length > 11) {
          pdf.setFontSize(6);
          pdf.text(consignorText.substring(0, 11), 29, yPos);
          pdf.text(consignorText.substring(11, 22), 29, yPos + 4);
          pdf.setFontSize(7);
        } else {
          pdf.text(consignorText, 29, yPos + 2);
        }
        
        // Full consignee name with optimized wrapping
        const consigneeText = (item.consigneeName || "").toUpperCase();
        if (consigneeText.length > 11) {
          pdf.setFontSize(6);
          pdf.text(consigneeText.substring(0, 11), 57, yPos);
          pdf.text(consigneeText.substring(11, 22), 57, yPos + 4);
          pdf.setFontSize(7);
        } else {
          pdf.text(consigneeText, 57, yPos + 2);
        }
        
        // Bilty with cyan highlight (#00b4d8)
        pdf.setTextColor(0, 180, 216);
        pdf.setFont("helvetica", "bold");
        pdf.text(String(item.biltyNo || ""), 87, yPos + 2);
        
        pdf.setTextColor(60, 60, 60);
        pdf.setFont("helvetica", "normal");
        
        // Particulars with optimized wrapping
        const particularText = (item.description || "").toUpperCase();
        if (particularText.length > 14) {
          pdf.setFontSize(6);
          pdf.text(particularText.substring(0, 14), 105, yPos);
          pdf.text(particularText.substring(14, 28), 105, yPos + 4);
          pdf.setFontSize(7);
        } else {
          pdf.text(particularText, 105, yPos + 2);
        }
        
        // Right-aligned numbers with modern styling
        const qty = String(item.quantity || 1);
        const weight = parseFloat(item.weight || 0);
        const total = parseFloat(item.freight || item.total || item.amount || 0);
        
        pdf.text(qty, 148, yPos + 2, { align: "right" });
        pdf.text(weight.toFixed(1), 167, yPos + 2, { align: "right" });
        
        // Amount with orange accent (#f77f00)
        pdf.setTextColor(247, 127, 0);
        pdf.setFont("helvetica", "bold");
        pdf.text(`Rs.${total.toFixed(0)}`, 184, yPos + 2, { align: "right" });
        pdf.setFont("helvetica", "normal");

        // Modern subtle dividers with optimized positions
        pdf.setDrawColor(240, 240, 240);
        pdf.setLineWidth(0.2);
        pdf.line(27, yPos - 3, 27, yPos + 9);
        pdf.line(55, yPos - 3, 55, yPos + 9);
        pdf.line(85, yPos - 3, 85, yPos + 9);
        pdf.line(103, yPos - 3, 103, yPos + 9);
        pdf.line(140, yPos - 3, 140, yPos + 9);
        pdf.line(151, yPos - 3, 151, yPos + 9);
        pdf.line(170, yPos - 3, 170, yPos + 9);
        
        yPos += 12;
      });
    }

    // Modern total row with dark blue (#003049)
    yPos += 3;
    pdf.setFillColor(0, 48, 73);
    pdf.roundedRect(20, yPos - 3, 167, 12, 1, 1, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(9);
    pdf.text("TOTAL", 105, yPos + 2);
    
    // Calculate and display totals
    const totalQty = challan.items?.reduce((sum: number, item: any) => sum + (parseInt(item.quantity) || 0), 0) || 0;
    const totalWeight = challan.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.weight) || 0), 0) || 0;
    const totalAmount = challan.items?.reduce((sum: number, item: any) => sum + (parseFloat(item.freight || item.total || item.amount) || 0), 0) || 0;
    
    pdf.setFontSize(9);
    pdf.text(String(totalQty), 148, yPos + 2, { align: "right" });
    pdf.text(totalWeight.toFixed(1), 167, yPos + 2, { align: "right" });
    pdf.text(`Rs.${totalAmount.toFixed(0)}`, 184, yPos + 2, { align: "right" });

    // Modern dividers for total with optimized positions
    pdf.setDrawColor(255, 255, 255, 0.3);
    pdf.setLineWidth(0.5);
    pdf.line(27, yPos - 3, 27, yPos + 9);
    pdf.line(55, yPos - 3, 55, yPos + 9);
    pdf.line(85, yPos - 3, 85, yPos + 9);
    pdf.line(103, yPos - 3, 103, yPos + 9);
    pdf.line(140, yPos - 3, 140, yPos + 9);
    pdf.line(151, yPos - 3, 151, yPos + 9);
    pdf.line(170, yPos - 3, 170, yPos + 9);

    yPos += 20;

    // Modern footer with note badge
    pdf.setFillColor(255, 248, 220);
    pdf.roundedRect(20, yPos - 2, 167, 8, 1, 1, 'F');
    pdf.setDrawColor(255, 193, 7);
    pdf.setLineWidth(0.3);
    pdf.roundedRect(20, yPos - 2, 167, 8, 1, 1, 'S');
    
    pdf.setTextColor(120, 80, 0);
    pdf.setFont("helvetica", "italic");
    pdf.setFontSize(7);
    pdf.text(" Note: The quantity of goods mentioned in the memo has been received in safe and sound condition.", 24, yPos + 3);

    yPos += 15;
    
    // Modern signature section with cyan (#00b4d8)
    pdf.setTextColor(0, 180, 216);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.text("For: Jodhpur Bombay Road Carrier", 24, yPos);
    
    // Signature with modern styling
    try {
      const signaturePath = path.join(process.cwd(), "public", "images", "signature.png");
      if (fs.existsSync(signaturePath)) {
        const signatureData = fs.readFileSync(signaturePath);
        const signatureBase64 = signatureData.toString('base64');
        
        // White background for signature
        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(22, yPos + 4, 40, 15, 1, 1, 'F');
        
        pdf.addImage(`data:image/png;base64,${signatureBase64}`, 'PNG', 24, yPos + 5, 35, 12);
        yPos += 20;
      } else {
        yPos += 15;
        // Modern signature line with cyan
        pdf.setDrawColor(0, 180, 216);
        pdf.setLineWidth(0.5);
        pdf.line(24, yPos, 75, yPos);
      }
    } catch (error) {
      yPos += 15;
      pdf.setDrawColor(0, 180, 216);
      pdf.setLineWidth(0.5);
      pdf.line(24, yPos, 75, yPos);
    }
    
    pdf.setTextColor(80, 80, 80);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.text("Authorised Signatory", 24, yPos + 5);
    
    // Modern footer accent line with orange (#f77f00)
    pdf.setDrawColor(247, 127, 0);
    pdf.setLineWidth(1);
    pdf.line(0, pageHeight - 5, pageWidth, pageHeight - 5);

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
