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

  // Layout configuration - positions in mm (adjusted for your pre-printed pad)
  const layout = {
    // Header section
    companyHeaderY: 8,
    
    // Top right fields
    biltyNoX: 170,
    biltyNoY: 8,
    dateX: 170,
    dateY: 15,
    truckNoX: 170,
    truckNoY: 22,
    fromX: 170,
    fromY: 29,
    toX: 170,
    toY: 36,
    
    // Consignor/Consignee section
    consignorX: 15,
    consignorY: 45,
    consigneeX: 105,
    consigneeY: 45,
    
    // GST Numbers
    consignorGstX: 15,
    consignorGstY: 52,
    consigneeGstX: 105,
    consigneeGstY: 52,
    
    // Table headers and items
    itemsStartY: 62,
    packagesX: 15,
    descriptionX: 35,
    weightActualX: 135,
    weightChargedX: 155,
    rateX: 170,
    freightToX: 185,
    
    // Charges section (right side)
    chargesStartY: 62,
    chargesValueX: 185,
    freightY: 62,
    pfY: 68,
    lcY: 74,
    bcY: 80,
    totalY: 86,
    cgstY: 92,
    sgstY: 98,
    advAmtY: 104,
    grandTotalY: 110,
    
    // Bottom section
    gvY: 85,
    termsY: 95,
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
    const formattedDate = biltyDate.toLocaleDateString('en-GB');

    // Company header removed - already printed on pad
    
    // Top right fields (Bilty No, Date, etc.)
    pdf.setFontSize(10);
    pdf.setFont("helvetica", "normal");
    pdf.text(`${bilty.biltyNo || ''}`, layout.biltyNoX, yOffset + layout.biltyNoY);
    pdf.text(`${formattedDate}`, layout.dateX, yOffset + layout.dateY);
    pdf.text(`${bilty.truckNo || ''}`, layout.truckNoX, yOffset + layout.truckNoY);
    pdf.text(`${bilty.from || ''}`, layout.fromX, yOffset + layout.fromY);
    pdf.text(`${bilty.to || ''}`, layout.toX, yOffset + layout.toY);

    // Consignor section (left side)
    pdf.setFontSize(9);
    pdf.text(bilty.consignorName || '', layout.consignorX, yOffset + layout.consignorY);
    if (bilty.consignorGst) {
      pdf.text(`${bilty.consignorGst}`, layout.consignorGstX, yOffset + layout.consignorGstY);
    }

    // Consignee section (right side)
    pdf.text(bilty.consigneeName || '', layout.consigneeX, yOffset + layout.consigneeY);
    if (bilty.consigneeGst) {
      pdf.text(`${bilty.consigneeGst}`, layout.consigneeGstX, yOffset + layout.consigneeGstY);
    }

    // Items table
    let itemY = yOffset + layout.itemsStartY;
    pdf.setFontSize(8);
    
    if (bilty.items && bilty.items.length > 0) {
      bilty.items.forEach((item: any) => {
        if (itemY > yOffset + copyHeight - 30) return;
        
        // Packages
        pdf.text((item.quantity || '').toString(), layout.packagesX, itemY);
        
        // Description
        const description = (item.goodsDescription || '').substring(0, 20);
        pdf.text(description, layout.descriptionX, itemY);
        
        // Weight Actual
        pdf.text((item.weight || '').toString(), layout.weightActualX, itemY);
        
        // Weight Charged
        pdf.text((item.chargedWeight || '').toString(), layout.weightChargedX, itemY);
        
        // Rate
        pdf.text(item.rate || '', layout.rateX, itemY);
        
        // Freight To (calculated)
        const freightAmount = (parseFloat(item.rate || '0') * parseFloat(item.chargedWeight || '0')) / 100;
        pdf.text(freightAmount.toFixed(0), layout.freightToX, itemY);
        
        itemY += 4;
      });
    }

    // Total packages
    if (bilty.totalPackages) {
      pdf.setFont("helvetica", "bold");
      pdf.text(`${bilty.totalPackages}`, layout.packagesX, itemY + 2);
      pdf.setFont("helvetica", "normal");
    }

    // Charges section (right side vertical list)
    pdf.setFontSize(9);
    
    if (bilty.charges) {
      const charges = bilty.charges;
      
      // Right-align all charge values
      pdf.text(`${charges.freight || 0}`, layout.chargesValueX, yOffset + layout.freightY, { align: 'right' });
      pdf.text(`${charges.pf || 0}`, layout.chargesValueX, yOffset + layout.pfY, { align: 'right' });
      pdf.text(`${charges.lc || 0}`, layout.chargesValueX, yOffset + layout.lcY, { align: 'right' });
      pdf.text(`${charges.bc || 0}`, layout.chargesValueX, yOffset + layout.bcY, { align: 'right' });
      pdf.text(`${charges.total || 0}`, layout.chargesValueX, yOffset + layout.totalY, { align: 'right' });
      
      // GST
      if (charges.cgst || charges.sgst) {
        pdf.text(`${charges.cgst || 0}`, layout.chargesValueX, yOffset + layout.cgstY, { align: 'right' });
        pdf.text(`${charges.sgst || 0}`, layout.chargesValueX, yOffset + layout.sgstY, { align: 'right' });
      }
      
      // Advance Amount (if any)
      if (charges.advance) {
        pdf.text(`${charges.advance}`, layout.chargesValueX, yOffset + layout.advAmtY, { align: 'right' });
      }
      
      // Grand Total
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text(`${charges.grandTotal || 0}`, layout.chargesValueX, yOffset + layout.grandTotalY, { align: 'right' });
      pdf.setFont("helvetica", "normal");
    }

    // G.V. (Goods Value) if available
    if (bilty.goodsValue) {
      pdf.setFontSize(8);
      pdf.text(`${bilty.goodsValue}`, pageWidth / 2, yOffset + layout.gvY, { align: 'center' });
    }

    // Invoice and E-way numbers at bottom if available
    if (bilty.invoiceNo || bilty.ewayNo) {
      pdf.setFontSize(7);
      const bottomY = yOffset + copyHeight - 8;
      let infoText = '';
      if (bilty.invoiceNo) infoText += `Inv: ${bilty.invoiceNo}`;
      if (bilty.ewayNo) infoText += (infoText ? ' | ' : '') + `E-Way: ${bilty.ewayNo}`;
      pdf.text(infoText, 15, bottomY);
    }
  }

  drawBiltyCopy(0);
  drawBiltyCopy(copyHeight);
  drawBiltyCopy(copyHeight * 2);

  pdf.setDrawColor(224, 224, 224);
  pdf.setLineWidth(0.1);
  pdf.line(0, copyHeight, pageWidth, copyHeight);
  pdf.line(0, copyHeight * 2, pageWidth, copyHeight * 2);

  const pdfBuffer = Buffer.from(pdf.output('arraybuffer'));

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename=bilty_${bilty.biltyNo}_3copies.pdf`,
    },
  });
}