import { NextRequest } from "next/server";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebase";
import { Timestamp } from "firebase/firestore";
import jsPDF from "jspdf";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const biltyId = params.id;
  const db = getFirestore(firebaseApp);
  const biltyRef = doc(db, "bilties", biltyId);
  const biltySnap = await getDoc(biltyRef);

  if (!biltySnap.exists()) {
    return new Response("Bilty not found", { status: 404 });
  }

  const bilty = biltySnap.data();

  // A4 dimensions in millimeters (jsPDF uses mm by default)
  const pageWidth = 210; // A4 width in mm
  const pageHeight = 297; // A4 height in mm
  const copyHeight = pageHeight / 3; // Each copy takes 1/3 of the page

  // Layout configuration - positions in mm (easier to work with for alignment)
  const layout = {
    // Header positioning
    companyHeaderY: 10,
    truckNoX: 160,
    biltyNoX: 160,
    biltyNoY: 18,
    dateX: 160,
    dateY: 25,
    
    // From/To positioning
    fromX: 30,
    fromToY: 35,
    toX: 120,
    
    // Consignor/Consignee positioning
    consignorX: 20,
    consignorY: 45,
    consigneeX: 110,
    consigneeY: 45,
    
    // Items table positioning
    itemsStartY: 65,
    packagesX: 20,
    descriptionX: 40,
    weightX: 100,
    chargedWeightX: 120,
    rateX: 140,
    amountX: 160,
    
    // Charges positioning (from bottom of copy)
    chargesFromBottom: 35,
    chargesValueX: 170,
  };

  // Create PDF with A4 size
  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  // Function to draw a single bilty copy
  function drawBiltyCopy(yOffset: number) {
    // Format date
    const biltyDate = bilty.biltyDate instanceof Timestamp 
      ? bilty.biltyDate.toDate() 
      : new Date(bilty.biltyDate);
    const formattedDate = biltyDate.toLocaleDateString('en-GB');

    // Company Header (centered, top)
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold");
    pdf.text('JODHPUR BOMBAY ROAD CARRIER', pageWidth / 2, yOffset + layout.companyHeaderY, { align: 'center' });
    
    // Truck No (right side of header)
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${bilty.truckNo}`, layout.truckNoX, yOffset + layout.companyHeaderY);

    // Bilty No (top right box) - more prominent
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.text(`${bilty.biltyNo}`, layout.biltyNoX, yOffset + layout.biltyNoY);
    
    // Date (top right box, below bilty no)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${formattedDate}`, layout.dateX, yOffset + layout.dateY);

    // From / To (below date section)
    pdf.setFontSize(11);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${bilty.from}`, layout.fromX, yOffset + layout.fromToY);
    pdf.text(`${bilty.to}`, layout.toX, yOffset + layout.fromToY);

    // Consignor (left side boxes)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(bilty.consignorName || '', layout.consignorX, yOffset + layout.consignorY);
    if (bilty.consignorGst) {
      pdf.setFontSize(9);
      pdf.text(`${bilty.consignorGst}`, layout.consignorX, yOffset + layout.consignorY + 5);
    }

    // Consignee (right side boxes)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(bilty.consigneeName || '', layout.consigneeX, yOffset + layout.consigneeY);
    if (bilty.consigneeGst) {
      pdf.setFontSize(9);
      pdf.text(`${bilty.consigneeGst}`, layout.consigneeX, yOffset + layout.consigneeY + 5);
    }

    // Items data (no header, just data to align with pre-printed)
    let itemY = yOffset + layout.itemsStartY;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    
    if (bilty.items && bilty.items.length > 0) {
      bilty.items.forEach((item: any, index: number) => {
        if (itemY > yOffset + copyHeight - 40) return; // Prevent overflow
        
        // Packages (left column)
        pdf.text((item.quantity || '').toString(), layout.packagesX, itemY);
        
        // Description (middle wide column) - truncate if too long
        const description = (item.goodsDescription || '').substring(0, 25);
        pdf.text(description, layout.descriptionX, itemY);
        
        // Actual Weight
        pdf.text((item.weight || '').toString(), layout.weightX, itemY);
        
        // Charged Weight
        pdf.text((item.chargedWeight || '').toString(), layout.chargedWeightX, itemY);
        
        // Rate
        pdf.text(item.rate || '', layout.rateX, itemY);
        
        // Amount (calculated)
        const amount = (parseFloat(item.rate || '0') * parseFloat(item.chargedWeight || '0')) / 100;
        pdf.text(amount.toFixed(2), layout.amountX, itemY);
        
        itemY += 4;
      });
    }

    // Total packages (if specified)
    if (bilty.totalPackages) {
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${bilty.totalPackages}`, layout.packagesX, itemY + 2);
    }

    // Charges section (bottom right) - aligned for pre-printed charges box
    const chargesY = yOffset + copyHeight - layout.chargesFromBottom;
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    
    if (bilty.charges) {
      const charges = bilty.charges;
      
      // Freight
      pdf.text(`${charges.freight || 0}`, layout.chargesValueX, chargesY, { align: 'right' });
      
      // P.F.
      pdf.text(`${charges.pf || 0}`, layout.chargesValueX, chargesY + 4, { align: 'right' });
      
      // L.C.
      pdf.text(`${charges.lc || 0}`, layout.chargesValueX, chargesY + 8, { align: 'right' });
      
      // B.C.
      pdf.text(`${charges.bc || 0}`, layout.chargesValueX, chargesY + 12, { align: 'right' });
      
      // Total (before GST)
      pdf.text(`${charges.total || 0}`, layout.chargesValueX, chargesY + 16, { align: 'right' });
      
      // GST
      if (charges.cgst || charges.sgst || charges.igst) {
        const totalGst = (charges.cgst || 0) + (charges.sgst || 0) + (charges.igst || 0);
        pdf.text(`${totalGst}`, layout.chargesValueX, chargesY + 20, { align: 'right' });
      }
      
      // Grand Total (most prominent)
      pdf.setFontSize(12);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${charges.grandTotal || 0}`, layout.chargesValueX, chargesY + 25, { align: 'right' });
    }

    // Additional info (invoice, eway bill) - small text at bottom
    if (bilty.invoiceNo || bilty.ewayNo) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      const infoY = yOffset + copyHeight - 5;
      if (bilty.invoiceNo) {
        pdf.text(`Inv: ${bilty.invoiceNo}`, 20, infoY);
      }
      if (bilty.ewayNo) {
        pdf.text(`E-Way: ${bilty.ewayNo}`, 70, infoY);
      }
    }
  }

  // Draw 3 identical copies
  drawBiltyCopy(0);           // Top copy
  drawBiltyCopy(copyHeight);  // Middle copy  
  drawBiltyCopy(copyHeight * 2); // Bottom copy

  // Add subtle dividing lines between copies (optional - comment out if not needed)
  pdf.setDrawColor(224, 224, 224); // Light gray
  pdf.setLineWidth(0.1);
  pdf.line(0, copyHeight, pageWidth, copyHeight);
  pdf.line(0, copyHeight * 2, pageWidth, copyHeight * 2);

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=bilty_${bilty.biltyNo}_3copies.pdf`,
    },
  });
}
