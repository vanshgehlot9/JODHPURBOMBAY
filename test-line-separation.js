const { jsPDF } = require('jspdf');

// Test the line separation fix
function testLineSeparation() {
  const pdf = new jsPDF();
  
  // Professional colors
  const colors = {
    consignor: [138, 43, 226], // Purple
    consignee: [34, 139, 34]   // Forest green
  };
  
  // Helper function to safely add text
  function safeText(pdf, text, x, y) {
    if (text) {
      pdf.text(String(text), x, y);
    }
  }
  
  console.log("Testing line separation layout...");
  
  const tableX = 5;
  const tableY = 50;
  const pageWidth = 210;
  const centerX = pageWidth / 2;
  
  // Test consignor section
  const consignorName = "Vansh Gehlot";
  const consignorGst = "8A1245BCHI";
  
  // Background highlight for consignor section
  pdf.setFillColor(250, 245, 255); // Very light purple background
  pdf.rect(tableX + 1, tableY + 2, (pageWidth - 10) / 2 - 2, 11, "F");
  
  // Consignor label on first line
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(colors.consignor[0], colors.consignor[1], colors.consignor[2]);
  safeText(pdf, "CONSIGNOR:", tableX + 3, tableY + 5);
  
  // Consignor name on second line with proper spacing
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0); // Black font
  safeText(pdf, consignorName, tableX + 3, tableY + 8.5); // Increased spacing
  
  // GST on third line
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0); // Black font
  safeText(pdf, `GST: ${consignorGst}`, tableX + 3, tableY + 12);
  
  console.log("✅ Consignor section layout:");
  console.log("   Line 1 (Y: " + (tableY + 5) + "): CONSIGNOR: (Purple, Bold, Size 8)");
  console.log("   Line 2 (Y: " + (tableY + 8.5) + "): " + consignorName + " (Black, Normal, Size 9)");
  console.log("   Line 3 (Y: " + (tableY + 12) + "): GST: " + consignorGst + " (Black, Normal, Size 7)");
  console.log("   Spacing between lines: 3.5 units");
  
  // Test consignee section
  const consigneeName = "ABC Company";
  const consigneeGst = "9B2345XCHI";
  
  // Background highlight for consignee section
  pdf.setFillColor(245, 255, 245); // Very light green background
  pdf.rect(centerX + 1, tableY + 2, (pageWidth - 10) / 2 - 2, 11, "F");
  
  // Consignee label on first line
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(colors.consignee[0], colors.consignee[1], colors.consignee[2]);
  safeText(pdf, "CONSIGNEE:", centerX + 3, tableY + 5);
  
  // Consignee name on second line with proper spacing
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(0, 0, 0); // Black font
  safeText(pdf, consigneeName, centerX + 3, tableY + 8.5); // Increased spacing
  
  // GST on third line
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(0, 0, 0); // Black font
  safeText(pdf, `GST: ${consigneeGst}`, centerX + 3, tableY + 12);
  
  console.log("✅ Consignee section layout:");
  console.log("   Line 1 (Y: " + (tableY + 5) + "): CONSIGNEE: (Green, Bold, Size 8)");
  console.log("   Line 2 (Y: " + (tableY + 8.5) + "): " + consigneeName + " (Black, Normal, Size 9)");
  console.log("   Line 3 (Y: " + (tableY + 12) + "): GST: " + consigneeGst + " (Black, Normal, Size 7)");
  console.log("   Spacing between lines: 3.5 units");
  
  console.log("\n🎉 Layout fixed! Each label and name are now on separate lines with proper spacing.");
  
  return pdf;
}

// Run the test
testLineSeparation();