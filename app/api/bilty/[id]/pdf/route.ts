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

  // A4 dimensions in millimeters
  const pageWidth = 210;
  const pageHeight = 297;
  const copyHeight = pageHeight / 3;

  // Layout configuration - positions in mm (precisely matched to old software)
  const layout = {
    // Copy specific adjustments
    firstCopyYOffset: 0,
    secondCopyYOffset: 99, // 1/3 of page
    thirdCopyYOffset: 198, // 2/3 of page
    copyHeight: 99, // 297/3 = 99mm per copy
    
    // Top right fields (Bilty No, Date, Truck No, From, To)
    biltyNoX: 175, biltyNoY: 13.5,
    dateX: 175, dateY: 20.5,
    truckNoX: 175, truckNoY: 27.5,
    fromX: 175, fromY: 34.5,
    toX: 175, toY: 41.5,
    
    // Consignor/Consignee section (exact positions from old software)
    consignorX: 15, consignorY: 42,
    consigneeX: 105, consigneeY: 42,
    
    // GST Numbers (positioned precisely below names)
    consignorGstX: 15, consignorGstY: 49,
    consigneeGstX: 105, consigneeGstY: 49,
    
    // Table headers and items (precise columns from image)
    itemsStartY: 60,
    packagesX: 15,
    descriptionX: 35,
    weightActualX: 135,
    weightChargedX: 155,
    rateX: 170,
    freightToX: 185,
    
    // Charges section (right side vertical, exact spacing from image)
    chargesValueX: 185,
    freightY: 60,
    pfY: 66,
    lcY: 72,
    bcY: 78,
    totalY: 84,
    cgstY: 90,
    sgstY: 96,
    advAmtY: 102,
    grandTotalY: 108,
    
    // Bottom section
    gvY: 84,
    invoiceNoX: 15,
    ewayNoX: 85,
    bottomTextY: 93,
  };

  const pdf = new jsPDF({
    unit: 'mm',
    format: 'a4',
    orientation: 'portrait'
  });

  function drawBiltyCopy(yOffset: number) {
    const biltyDate = bilty.biltyDate instanceof Timestamp 
      ? bilty.biltyDate.toDate() 
      : new Date(bilty.biltyDate);
    const formattedDate = biltyDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    // Company header already printed on pad - no need to add it
    
    // Top right fields (Bilty No, Date, etc.) - positioned precisely
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    // Right align bilty number, date, truck number etc.
    pdf.text(`${bilty.biltyNo || ''}`, layout.biltyNoX, yOffset + layout.biltyNoY, { align: 'right' });
    pdf.text(`${formattedDate}`, layout.dateX, yOffset + layout.dateY, { align: 'right' });
    pdf.text(`${bilty.truckNo || ''}`, layout.truckNoX, yOffset + layout.truckNoY, { align: 'right' });
    pdf.text(`${bilty.from || ''}`, layout.fromX, yOffset + layout.fromY, { align: 'right' });
    pdf.text(`${bilty.to || ''}`, layout.toX, yOffset + layout.toY, { align: 'right' });

    // Consignor section (left box)
    pdf.setFontSize(9);
    const consignorName = (bilty.consignorName || '').toUpperCase();
    pdf.text(consignorName, layout.consignorX, yOffset + layout.consignorY);
    
    if (bilty.consignorGst) {
      pdf.setFontSize(8);
      pdf.text(`GSTIN: ${bilty.consignorGst}`, layout.consignorGstX, yOffset + layout.consignorGstY);
    }

    // Consignee section (right box)
    pdf.setFontSize(9);
    const consigneeName = (bilty.consigneeName || '').toUpperCase();
    pdf.text(consigneeName, layout.consigneeX, yOffset + layout.consigneeY);
    
    if (bilty.consigneeGst) {
      pdf.setFontSize(8);
      pdf.text(`GSTIN: ${bilty.consigneeGst}`, layout.consigneeGstX, yOffset + layout.consigneeGstY);
    }

    // Items table - precise alignment
    let itemY = yOffset + layout.itemsStartY;
    pdf.setFontSize(8);
    
    if (bilty.items && bilty.items.length > 0) {
      bilty.items.forEach((item: any) => {
        // Don't print items beyond copy area
        if (itemY > yOffset + layout.copyHeight - 20) return;
        
        // Packages
        pdf.text((item.quantity || '').toString(), layout.packagesX, itemY);
        
        // Description - wrap if needed
        const description = item.goodsDescription || '';
        pdf.text(description.substring(0, 25), layout.descriptionX, itemY);
        
        // Weight Actual - right aligned
        pdf.text((item.weight || '').toString(), layout.weightActualX, itemY, { align: 'right' });
        
        // Weight Charged - right aligned
        pdf.text((item.chargedWeight || '').toString(), layout.weightChargedX, itemY, { align: 'right' });
        
        // Rate - right aligned
        pdf.text((item.rate || '').toString(), layout.rateX, itemY, { align: 'right' });
        
        // Freight - right aligned with proper calculation
        const freightAmount = ((parseFloat(item.rate || '0') * parseFloat(item.chargedWeight || '0')) / 100).toFixed(2);
        pdf.text(freightAmount, layout.freightToX, itemY, { align: 'right' });
        
        itemY += 5; // Spacing between items
      });
    }

    // Total packages in bold at the bottom of packages column
    if (bilty.totalPackages) {
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "bold");
      pdf.text(`Total: ${bilty.totalPackages}`, layout.packagesX, itemY + 3);
      pdf.setFont("helvetica", "normal");
    }

    // Charges section - precisely right-aligned
    if (bilty.charges) {
      const charges = bilty.charges;
      pdf.setFontSize(8);
      
      // Format numbers with 2 decimal places and right-align
      const formatAmount = (value: number | string) => {
        return parseFloat(value?.toString() || '0').toFixed(2);
      };
      
      // Right-align all charge values
      pdf.text(`${formatAmount(charges.freight || 0)}`, layout.chargesValueX, yOffset + layout.freightY, { align: 'right' });
      pdf.text(`${formatAmount(charges.pf || 0)}`, layout.chargesValueX, yOffset + layout.pfY, { align: 'right' });
      pdf.text(`${formatAmount(charges.lc || 0)}`, layout.chargesValueX, yOffset + layout.lcY, { align: 'right' });
      pdf.text(`${formatAmount(charges.bc || 0)}`, layout.chargesValueX, yOffset + layout.bcY, { align: 'right' });
      
      // Total with bold
      pdf.setFont("helvetica", "bold");
      pdf.text(`${formatAmount(charges.total || 0)}`, layout.chargesValueX, yOffset + layout.totalY, { align: 'right' });
      pdf.setFont("helvetica", "normal");
      
      // GST
      if (charges.cgst || charges.sgst) {
        pdf.text(`${formatAmount(charges.cgst || 0)}`, layout.chargesValueX, yOffset + layout.cgstY, { align: 'right' });
        pdf.text(`${formatAmount(charges.sgst || 0)}`, layout.chargesValueX, yOffset + layout.sgstY, { align: 'right' });
      }
      
      // Advance Amount
      if (charges.advance) {
        pdf.text(`${formatAmount(charges.advance)}`, layout.chargesValueX, yOffset + layout.advAmtY, { align: 'right' });
      }
      
      // Grand Total in bold and slightly larger
      pdf.setFontSize(9);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${formatAmount(charges.grandTotal || 0)}`, layout.chargesValueX, yOffset + layout.grandTotalY, { align: 'right' });
      pdf.setFont("helvetica", "normal");
    }

    // G.V. (Goods Value) centered
    if (bilty.goodsValue) {
      pdf.setFontSize(8);
      pdf.text(`G.V.: ${bilty.goodsValue}`, pageWidth / 2, yOffset + layout.gvY, { align: 'center' });
    }

    // Invoice and E-way numbers at bottom
    pdf.setFontSize(7);
    if (bilty.invoiceNo) {
      pdf.text(`Inv. No: ${bilty.invoiceNo}`, layout.invoiceNoX, yOffset + layout.bottomTextY);
    }
    
    if (bilty.ewayNo) {
      pdf.text(`E-Way: ${bilty.ewayNo}`, layout.ewayNoX, yOffset + layout.bottomTextY);
    }
  }

  // Draw the three copies with precise offsets
  drawBiltyCopy(layout.firstCopyYOffset);
  drawBiltyCopy(layout.secondCopyYOffset);
  drawBiltyCopy(layout.thirdCopyYOffset);

  // Add clear copy separation lines
  pdf.setDrawColor(160, 160, 160);  // Darker gray for better visibility
  pdf.setLineWidth(0.3);            // Slightly thicker line
  
  // Add dotted/dashed line between copies for easy tearing
  const dashLength = 2;
  const gapLength = 1;
  
  // First separator line (between copy 1 and 2)
  for (let x = 0; x < pageWidth; x += (dashLength + gapLength)) {
    pdf.line(x, layout.copyHeight, x + dashLength, layout.copyHeight);
  }
  
  // Second separator line (between copy 2 and 3)
  for (let x = 0; x < pageWidth; x += (dashLength + gapLength)) {
    pdf.line(x, layout.copyHeight * 2, x + dashLength, layout.copyHeight * 2);
  }
  
  // Add copy labels in the margins
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "italic");
  pdf.text("CONSIGNOR'S COPY", 5, layout.copyHeight - 2);
  pdf.text("CONSIGNEE'S COPY", 5, layout.copyHeight * 2 - 2);
  pdf.text("CARRIER'S COPY", 5, pageHeight - 2);

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=bilty_${bilty.biltyNo}_3copies.pdf`,
    },
  });
}