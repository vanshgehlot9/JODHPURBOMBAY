// app/api/bilty/[id]/route.ts
import { NextRequest } from "next/server";
import { getFirestore, doc, getDoc, Timestamp } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebase";
import jsPDF from "jspdf";
import fs from "fs";
import path from "path";

// Function to load logo image from public folder
async function loadLogoImage(): Promise<string | null> {
  try {
    const logoPath = path.join(process.cwd(), 'public', 'images', 'truck.jpeg');
    const imageBuffer = fs.readFileSync(logoPath);
    const base64String = imageBuffer.toString('base64');
    return `data:image/jpeg;base64,${base64String}`;
  } catch (error) {
    console.error('Error loading logo image:', error);
    return null;
  }
}

// Function to load signature image from public folder
async function loadSignatureImage(): Promise<string | null> {
  try {
    const signaturePath = path.join(process.cwd(), 'public', 'images', 'signature.png');
    const imageBuffer = fs.readFileSync(signaturePath);
    const base64String = imageBuffer.toString('base64');
    return `data:image/png;base64,${base64String}`;
  } catch (error) {
    console.error('Error loading signature image:', error);
    return null;
  }
}

// Safe text rendering function to avoid jsPDF errors
function safeText(pdf: jsPDF, text: any, x: number, y: number, options?: any) {
  try {
    // Validate coordinates
    const safeX = isFinite(x) ? x : 0;
    const safeY = isFinite(y) ? y : 0;
    
    // Handle array of strings (for multi-line text)
    if (Array.isArray(text)) {
      const safeArray = text.map(line => 
        line !== null && line !== undefined ? String(line) : ""
      );
      
      // Call the text function with validated parameters
      if (options) {
        pdf.text(safeArray, safeX, safeY, options);
      } else {
        pdf.text(safeArray, safeX, safeY);
      }
    } else {
      // Handle single string case
      const safeString = text !== null && text !== undefined ? String(text) : "";
      
      // Call the text function with validated parameters
      if (options) {
        pdf.text(safeString, safeX, safeY, options);
      } else {
        pdf.text(safeString, safeX, safeY);
      }
    }
  } catch (error) {
    console.log("Error rendering text:", text, "at position:", x, y);
    // Silently continue - don't let text errors crash the PDF generation
  }
}

async function drawBiltyCopy(
  bilty: any,
  pdf: jsPDF,
  layout: any,
  pageWidth: number,
  copyHeight: number,
  pageHeight: number,
  Timestamp: typeof import("firebase/firestore").Timestamp,
  yOffset: number
) {
  // Light background for form
  pdf.setFillColor(252, 252, 252);
  pdf.rect(5, yOffset + 5, pageWidth - 10, copyHeight - 10, "F");
  
  // Draw the form layout (now async)
  await drawBiltyForm(pdf, pageWidth, copyHeight, yOffset, layout);
  
  // Format bilty date
  const biltyDate = bilty.biltyDate instanceof Timestamp
    ? bilty.biltyDate.toDate()
    : new Date(bilty.biltyDate);
    
  const formattedDate = biltyDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit", 
    year: "numeric",
  });
  
  // Prepare data - ensure correct mapping with validation
  const biltyNo = bilty.biltyNo ? String(bilty.biltyNo) : "";
  const from = bilty.from ? String(bilty.from) : "";
  const to = bilty.to ? String(bilty.to) : "";
  const consignorName = bilty.consignorName ? String(bilty.consignorName) : "";
  const consigneeName = bilty.consigneeName ? String(bilty.consigneeName) : "";
  const consignorGst = bilty.consignorGst ? String(bilty.consignorGst) : "";
  const consigneeGst = bilty.consigneeGst ? String(bilty.consigneeGst) : "";
  
  // Debug: Log the data to ensure correct assignment
  console.log("PDF Generation - Data validation:");
  console.log("Consignor Name:", consignorName, "Consignor GST:", consignorGst);
  console.log("Consignee Name:", consigneeName, "Consignee GST:", consigneeGst);
  
  // Fill header data in right box - ALIGNED WITH NEW LAYOUT
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 0, 0);  // Black for data values
  
  // Calculate right box positions (updated for new layout)
  const rightBoxWidth = 50; // Match the new width
  const rightBoxX = pageWidth - rightBoxWidth - 8; // Match the new position
  const rightBoxY = yOffset + 7;
  const dataX = rightBoxX + (rightBoxWidth - 2) / 2 + 2; // Position in right half of box
  
  safeText(pdf, biltyNo, dataX, rightBoxY + 3);
  safeText(pdf, formattedDate, dataX, rightBoxY + 7);
  safeText(pdf, from, dataX, rightBoxY + 11);
  safeText(pdf, to, dataX, rightBoxY + 15);
  
  // Add truck number field (aligned with new layout)
  const truckNo = bilty.truckNo ? String(bilty.truckNo) : "";
  safeText(pdf, truckNo, dataX, rightBoxY + 19);
  
  // Fill data in the unified party information section
  pdf.setFontSize(7);  // Increased font size for better readability
  pdf.setFont("helvetica", "normal");
  
  // Define table coordinates based on yOffset - using layout from drawBiltyForm
  const tableX = 5;  // Match the table definition in drawBiltyForm
  const tableY = yOffset + 39;  
  const centerX = tableX + ((pageWidth - 10) / 2);  // Exact center based on full table width
  const partyInfoHeight = 15;  
  
  // Fill consignor information - PROFESSIONAL STYLING
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 32, 96);  // Professional blue
  if (consignorName) {
    safeText(pdf, `CONSIGNOR: ${consignorName}`, tableX + 2, tableY + 5);
  }
  if (consignorGst) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(64, 64, 64);  // Gray for GSTIN
    safeText(pdf, `GSTIN: ${consignorGst}`, tableX + 2, tableY + 10);
  }
  
  // Fill consignee information - PROFESSIONAL STYLING
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 32, 96);  // Professional blue
  if (consigneeName) {
    safeText(pdf, `CONSIGNEE: ${consigneeName}`, centerX + 2, tableY + 5);
  }
  if (consigneeGst) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(64, 64, 64);  // Gray for GSTIN
    safeText(pdf, `GSTIN: ${consigneeGst}`, centerX + 2, tableY + 10);
  }
  
  // Reset text color and font for subsequent elements
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  
  // Fill items data
  const itemsDataStartY = tableY + partyInfoHeight + 12;  // Increased from 8 to 12 for better spacing between headers and data
  let currentY = itemsDataStartY;
  
  if (bilty.items && bilty.items.length > 0) {
    bilty.items.forEach((item: any, index: number) => {
      if (currentY > yOffset + 80) return; // More restrictive boundary to make room for new fields
      
      pdf.setFontSize(7);  // Increased font size from 6 to 7
      
      const quantity = item.quantity ? String(item.quantity) : "0";
      const description = item.goodsDescription ? String(item.goodsDescription).substring(0, 30) : "";
      const weight = item.weight ? String(item.weight) : "0";
      const chargedWeight = item.chargedWeight ? String(item.chargedWeight) : weight;
      const rate = item.rate ? String(item.rate) : "";
      
      // Fill items with positioning matching table definition (tableX = 5, full 200mm width)
      safeText(pdf, quantity, tableX + 8, currentY, { align: "center" });         // Pkgs 
      safeText(pdf, description, tableX + 18, currentY);                          // Description
      safeText(pdf, weight, tableX + 74, currentY, { align: "center" });          // Act.Wt
      safeText(pdf, chargedWeight, tableX + 92, currentY, { align: "center" });   // Chg.Wt  
      safeText(pdf, rate, tableX + 110, currentY, { align: "center" });           // Rate
      
      currentY += 10; // Increased line spacing from 7 to 10 for much better visibility
    });
  }

  // Add Invoice No., E-Way No., and G.V. after items (like in the image)
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "normal");
  
  // Add Invoice No. with boundary check
  if (bilty.invoiceNo && currentY <= yOffset + 85) {
    safeText(pdf, `Inv. No. ${bilty.invoiceNo}`, tableX + 18, currentY);
    currentY += 4;
  }
  
  // Add E-Way No. with boundary check
  if (bilty.ewayNo && currentY <= yOffset + 85) {
    safeText(pdf, `EWay No. ${bilty.ewayNo}`, tableX + 18, currentY);
    currentY += 4;
  }
  
  // Add G.V. (Gross Value) with boundary check
  if (bilty.grossValue && currentY <= yOffset + 85) {
    safeText(pdf, `G.V. ${bilty.grossValue}`, tableX + 18, currentY);
    currentY += 4;
  }
  
  // Fill G.V. section in the unified bottom section
  if (bilty.goodsValue) {
    pdf.setFontSize(5);  // Font size for G.V. section
    // Position G.V. value in the unified section
    const unifiedSectionY = yOffset + 77; // Calculated position for unified section
    safeText(pdf, bilty.goodsValue.toString(), tableX + 25, unifiedSectionY + 4);
  }
  
    // Fill charges section
  if (bilty.charges) {
    const charges = bilty.charges;
    pdf.setFontSize(6);  // Increased font size from 5 to 6
    
    const formatAmount = (value: number | string | undefined) => {
      if (value === null || value === undefined) return "0.00";
      try {
        const numValue = parseFloat(String(value));
        return isNaN(numValue) ? "0.00" : numValue.toFixed(2);
      } catch (error) {
        return "0.00";
      }
    };
    
    // Fill charge values directly from charges object - no calculations
    const chargesValueX = pageWidth - 10; // Right edge matches header section
    
    const chargesValues = [
      charges.freight || 0, charges.pf || 0, charges.lc || 0, charges.bc || 0,
      charges.total || 0, charges.cgst || 0, charges.sgst || 0, charges.grandTotal || 0
    ];
    
    // Position charges values - PROFESSIONAL STYLING - Match labels positioning
    // Calculate headerY to match the table layout (from drawBiltyForm)
    const partyInfoHeight = 15;
    const itemsHeaderHeight = 6;
    const headerY = tableY + partyInfoHeight + itemsHeaderHeight;
    
    chargesValues.forEach((value, i) => {
      const yPos = headerY + 2 + (i * 3.5);  // Optimized spacing from 3.5 to 2.2 to fit within table boundaries
      const isBold = i === 4 || i === 7; // Total and G.Total
      
      if (isBold) {
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 32, 96);  // Blue for totals
      } else {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);  // Black for regular values
      }
      
      safeText(pdf, formatAmount(value), chargesValueX, yPos, { align: "right" });
    });
    
    // Reset font and color
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(0, 0, 0);
  }
}

// Function to draw the pre-printed form layout with boxes, headers, etc.
async function drawBiltyForm(
  pdf: jsPDF,
  pageWidth: number,
  copyHeight: number,
  yOffset: number,
  layout: any
) {
  // Set colors for the form
  pdf.setDrawColor(0, 0, 0);
  pdf.setFillColor(255, 255, 255);
  pdf.setTextColor(0, 0, 0);
  
  // Header box - PROFESSIONAL sizing
  pdf.setLineWidth(0.3);
  pdf.rect(5, yOffset + 5, pageWidth - 10, 32);
  
  // TRUE CENTER POSITIONING - Center everything on the full page width
  const trueCenterX = pageWidth / 2; // True center of the page
  const rightBoxWidth = 50;
  const rightBoxX = pageWidth - rightBoxWidth - 8; // Right box positioned from right edge
  
  // Add the truck logo loaded from public/images - MOVED FURTHER LEFT
  try {
    const logoBase64 = await loadLogoImage();
    if (logoBase64) {
      const logoWidth = 30;
      const logoHeight = 22;
      const logoX = 8; // Moved further left from 15 to 8
      pdf.addImage(
        logoBase64,
        'JPEG',
        logoX,
        yOffset + 8,
        logoWidth,
        logoHeight
      );
      console.log("Truck logo loaded and added successfully from public/images/truck.jpeg");
    } else {
      throw new Error("Could not load logo from public/images/truck.jpeg");
    }
  } catch (error) {
    console.error("Logo could not be loaded from public folder:", error);
    // Fallback: Text logo positioned further left
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(51, 122, 183);
    safeText(pdf, "JBRC", 8, yOffset + 18); // Moved from 15 to 8
    pdf.setTextColor(0, 0, 0);
  }
  
  // Jurisdiction text - POSITIONED PROPERLY WITHIN HEADER BOX (NO LINE)
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "italic");
  pdf.setTextColor(64, 64, 64);
  safeText(pdf, "All disputes Subject to JODHPUR Jurisdiction", pageWidth/2, yOffset + 8, { align: "center" });
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  
  // Company name header - WITH MORE SPACING FROM JURISDICTION TEXT
  pdf.setFontSize(17);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 32, 96);
  const headerX = trueCenterX - 10;
  safeText(pdf, "JODHPUR BOMBAY ROAD CARRIER", headerX, yOffset + 16, { align: "center" });
  
  // Company address - ALIGNED WITH HEADER AND PROPER SPACING
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(64, 64, 64);
  safeText(pdf, "P.No. 69, Transport Nagar, IInd Phase Basni, JODHPUR", headerX, yOffset + 23, { align: "center" }); // Adjusted from +21 to +23
  
  // Contact numbers - ALIGNED WITH HEADER
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(180, 0, 0);
  
  // Multiple contact numbers in compact layout
  safeText(pdf, "Office: 0291-3150177, 0291-2747679", headerX - 45, yOffset + 29);
  safeText(pdf, "Mobile: +91 97821-77007 , +91 93147-10568" , headerX - 1, yOffset + 29);
  
  pdf.setTextColor(0, 0, 0);  // Reset to black
  
  // GSTIN - PROFESSIONAL FORMATTING AND POSITIONING
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 32, 96);
  safeText(pdf, "GSTIN: 08AAAHL5963P1ZK", 8, yOffset + 35); // Adjusted from +33 to +35
  
  // Right side information box - POSITIONED INDEPENDENTLY OF HEADER
  const rightBoxY = yOffset + 7;
  const rightBoxHeight = 20;
  pdf.rect(rightBoxX, rightBoxY, rightBoxWidth - 2, rightBoxHeight);
  pdf.setLineWidth(0.1);
  
  // Vertical dividers in right box
  const dividerX = rightBoxX + (rightBoxWidth - 2) / 2;
  pdf.line(dividerX, rightBoxY, dividerX, rightBoxY + rightBoxHeight);
  pdf.line(rightBoxX, rightBoxY + 4, rightBoxX + rightBoxWidth - 2, rightBoxY + 4);
  pdf.line(rightBoxX, rightBoxY + 8, rightBoxX + rightBoxWidth - 2, rightBoxY + 8);
  pdf.line(rightBoxX, rightBoxY + 12, rightBoxX + rightBoxWidth - 2, rightBoxY + 12);
  pdf.line(rightBoxX, rightBoxY + 16, rightBoxX + rightBoxWidth - 2, rightBoxY + 16);
  
  // Labels in right box
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 32, 96);
  safeText(pdf, "Bilty No.", rightBoxX + 2, rightBoxY + 3);
  safeText(pdf, "Date", rightBoxX + 2, rightBoxY + 7);
  safeText(pdf, "From", rightBoxX + 2, rightBoxY + 11);
  safeText(pdf, "To", rightBoxX + 2, rightBoxY + 15);
  safeText(pdf, "Truck No.", rightBoxX + 2, rightBoxY + 19);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  

  
  // Main form sections - COMPACT LAYOUT THAT FITS A4
  pdf.setLineWidth(0.2);
  
  // Define table dimensions - match header section exactly
  const tableX = 5; // Same as header section
  const tableWidth = pageWidth - 10; // Exactly match header: pageWidth - 10 = 200mm
  const tableY = yOffset + 39;  // Adjusted for expanded header
  
  // Row heights - merged party information section with balanced space
  const partyInfoHeight = 15;  // Single merged section for consignor/consignee + GSTIN
  const itemsHeaderHeight = 6;
  const itemsDataHeight = 28; // Increased from 25 to 28 to accommodate charges section properly
  
  // STEP 1: Draw the complete table outline first
  const totalTableHeight = partyInfoHeight + itemsHeaderHeight + itemsDataHeight;
  pdf.rect(tableX, tableY, tableWidth, totalTableHeight);
  
  // STEP 2: Draw horizontal dividers
  let currentY = tableY;
  
  // After merged party information section
  currentY += partyInfoHeight;
  pdf.line(tableX, currentY, tableX + tableWidth, currentY);
  
  // After items header row
  currentY += itemsHeaderHeight;
  pdf.line(tableX, currentY, tableX + tableWidth, currentY);
  
  // STEP 3: Draw vertical dividers
  
  // Main center divider for merged party information section only
  const centerX = tableX + (tableWidth / 2); // Exact center of the table
  pdf.line(centerX, tableY, centerX, tableY + partyInfoHeight);
  
  // Items table column dividers - proportional to full table width
  const itemsStartY = tableY + partyInfoHeight;
  
  // Column positions (relative to tableX) - proportional to 200mm width
  const col1 = tableX + 16;   // After Pkgs (16mm wide)
  const col2 = tableX + 150;   // After Description (49mm wide - much larger)  
  const col3 = tableX + 83;   // After Act.Wt (18mm wide)
  const col4 = tableX + 101;  // After Chg.Wt (18mm wide)
  const col5 = tableX + 60;  // After Rate (18mm wide)
  // Charges section: remaining 81mm wide (from col5 to table end)
  
  // Draw vertical lines for items columns
  pdf.line(col1, itemsStartY, col1, itemsStartY + itemsHeaderHeight + itemsDataHeight);
  pdf.line(col2, itemsStartY, col2, itemsStartY + itemsHeaderHeight + itemsDataHeight);
  pdf.line(col3, itemsStartY, col3, itemsStartY + itemsHeaderHeight + itemsDataHeight);
  pdf.line(col4, itemsStartY, col4, itemsStartY + itemsHeaderHeight + itemsDataHeight);
  pdf.line(col5, itemsStartY, col5, itemsStartY + itemsHeaderHeight + itemsDataHeight);
  
  // STEP 4: Add labels
  pdf.setFontSize(7);  // Increased font size for better readability
  pdf.setFont("helvetica", "bold");
  
  // Labels are now included with the data, so no separate labels needed
  pdf.setFontSize(7); // Reset font size for items table
  
  // Items table headers - PROFESSIONAL STYLING
  const headerY = itemsStartY + itemsHeaderHeight;
  pdf.setFontSize(8);  // Increased for better readability
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 32, 96);  // Professional blue
  
  safeText(pdf, "Pkgs", tableX + 8, headerY - 2, { align: "center" });
  safeText(pdf, "DESCRIPTION", tableX + 40, headerY - 2, { align: "center" });
  safeText(pdf, "Act.Wt", tableX + 74, headerY - 2, { align: "center" });
  safeText(pdf, "Chg.Wt", tableX + 92, headerY - 2, { align: "center" });
  safeText(pdf, "Rate", tableX + 110, headerY - 2, { align: "center" });
  safeText(pdf, "CHARGES", tableX + 150, headerY - 2, { align: "center" });
  
  // Reset color and font
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  
  // Charges breakdown - PROFESSIONAL STYLING
  const chargeItems = ["Freight", "P.F.", "L.C.", "B.C.", "Total", "CGST", "SGST", "G.Total"];
  pdf.setFontSize(7);  // Increased for better readability
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(64, 64, 64);  // Professional gray
  
  chargeItems.forEach((label, i) => {
    const yPos = headerY + 2 + (i * 3.5);  // Optimized spacing from 3.5 to 2.2 to fit within table boundaries
    const isBold = label === "Total" || label === "G.Total";
    if (isBold) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(0, 32, 96);  // Blue for totals
    } else {
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(64, 64, 64);  // Gray for regular items
    }
    safeText(pdf, label, tableX + 125, yPos);
  });
  
  // Reset color and font
  pdf.setTextColor(0, 0, 0);
  pdf.setFont("helvetica", "normal");
  
  // Unified bottom section for, Terms, and Signature
  const unifiedSectionY = tableY + totalTableHeight + 1;
  const unifiedSectionHeight = 12; // Reduced height to fit within 99mm limit
  pdf.rect(tableX, unifiedSectionY, pageWidth - 10, unifiedSectionHeight); // Full width unified section
  
  // Terms & Conditions - PROFESSIONAL STYLING
  pdf.setFontSize(6);  // Slightly larger for better readability
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(64, 64, 64);  // Professional gray
  safeText(pdf, "Terms & Conditions: Any leakage and breaking goods are not responsible and no claim for this.", tableX + 3, unifiedSectionY + 6);
  
  // Special Instructions - PROFESSIONAL STYLING
  pdf.setFontSize(6);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(64, 64, 64);
  safeText(pdf, "Special Instruction: Goods to be Insured by party", tableX + 3, unifiedSectionY + 9);
  
  // Signature area - PROFESSIONAL STYLING
  pdf.setFontSize(7);  // Increased for better visibility
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(0, 32, 96);  // Professional blue
  safeText(pdf, "For: Jodhpur Bombay Road Carrier", pageWidth - 75, unifiedSectionY + 3);
  
  // Add signature image in proper position - NATURAL SIGNATURE PROPORTIONS
  try {
    const signatureBase64 = await loadSignatureImage();
    if (signatureBase64) {
      pdf.addImage(
        signatureBase64,
        'PNG',
        pageWidth - 60, // X position - adjusted for natural signature size
        unifiedSectionY + 4.5, // Y position - positioned between text and line
        20, // Width - reduced for natural signature proportions
        8   // Height - increased for natural handwritten signature look
      );
      console.log("Signature image added successfully");
    }
  } catch (error) {
    console.error("Could not add signature image:", error);
  }
  
  // Signature line within the unified section - PROPERLY POSITIONED AND EXTENDED
  pdf.setLineWidth(0.5);
  pdf.setDrawColor(0, 0, 0); // Black color for signature line
  // Create a proper signature line that's long enough and well positioned
  const signatureLineY = unifiedSectionY + 12; // Position below signature image
  const signatureLineStartX = pageWidth - 90; // Start further left for longer line
  const signatureLineEndX = pageWidth - 15; // End closer to edge
  pdf.line(signatureLineStartX, signatureLineY, signatureLineEndX, signatureLineY);
  
}

// Logo is directly embedded as base64 string for better serverless compatibility
// NOTE: You will need to replace this with your new logo when you have it
// To update: 1. Convert your new logo to base64, then replace this string
// Make sure the dimensions match what's set in the addImage function (currently 25x12)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const biltyId = params.id;
    const db = getFirestore(firebaseApp);
    const biltyRef = doc(db, "bilties", biltyId);
    const biltySnap = await getDoc(biltyRef);

    if (!biltySnap.exists()) {
      return new Response("Bilty not found", { status: 404 });
    }

    const bilty = biltySnap.data();

    // Page setup
    const pageWidth = 210; // A4 width (mm)
    const pageHeight = 297; // A4 height (mm)
    const copyHeight = pageHeight / 3; // Each copy height = 99mm

    // Layout mapping - CLEAN VERSION for professional A4 3-copy layout
    const layout = {
      // Copy dimensions
      firstCopyYOffset: 0,
      secondCopyYOffset: 99,
      thirdCopyYOffset: 198,
      copyHeight: 99,
    };

    const pdf = new jsPDF({
      unit: "mm",
      format: "a4",
      orientation: "portrait",
    });

    // Create the PDF with all 3 copies exactly like your bilty pad
    await drawBiltyCopy(bilty, pdf, layout, pageWidth, copyHeight, pageHeight, Timestamp, layout.firstCopyYOffset);
    await drawBiltyCopy(bilty, pdf, layout, pageWidth, copyHeight, pageHeight, Timestamp, layout.secondCopyYOffset);
    await drawBiltyCopy(bilty, pdf, layout, pageWidth, copyHeight, pageHeight, Timestamp, layout.thirdCopyYOffset);
    
    // Separator lines between copies - CORRECTED for exact 99mm spacing
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.1);
    pdf.line(0, layout.secondCopyYOffset, pageWidth, layout.secondCopyYOffset);  // At 99mm
    pdf.line(0, layout.thirdCopyYOffset, pageWidth, layout.thirdCopyYOffset);    // At 198mm

    // Return PDF as Response
    const pdfBuffer = Buffer.from(pdf.output("arraybuffer"));
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename=bilty_${bilty.biltyNo}_3copies.pdf`,
      },
    });
  } catch (err: any) {
    console.error("Error generating bilty PDF:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
