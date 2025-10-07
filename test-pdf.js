// Simple test to generate a PDF with sample data
const { jsPDF } = require('jspdf');

const pdf = new jsPDF({
  unit: 'mm',
  format: 'a4',
  orientation: 'portrait'
});

const pageWidth = 210;
const pageHeight = 297;
const copyHeight = pageHeight / 3;

// Test with sample data
const sampleBilty = {
  biltyNo: 'TEST001',
  biltyDate: new Date(),
  truckNo: 'RJ14GA1234',
  from: 'JODHPUR',
  to: 'MUMBAI',
  consignorName: 'ABC TRADERS',
  consignorGst: '08AABCU9603R1ZM',
  consigneeName: 'XYZ COMPANY',
  consigneeGst: '27AABCX1234X1ZX',
  items: [
    {
      quantity: 10,
      goodsDescription: 'COTTON CLOTH',
      weight: 500,
      chargedWeight: 500,
      rate: '8.50'
    }
  ],
  charges: {
    freight: 4250,
    pf: 85,
    lc: 50,
    bc: 25,
    total: 4410,
    cgst: 441,
    sgst: 441,
    grandTotal: 5292
  }
};

function drawBiltyCopy(yOffset) {
  const formattedDate = sampleBilty.biltyDate.toLocaleDateString('en-GB');

  // Layout matching your pre-printed pad
  const layout = {
    companyHeaderY: 8,
    biltyNoX: 170, biltyNoY: 8,
    dateX: 170, dateY: 15,
    truckNoX: 170, truckNoY: 22,
    fromX: 170, fromY: 29,
    toX: 170, toY: 36,
    consignorX: 15, consignorY: 45,
    consigneeX: 105, consigneeY: 45,
    consignorGstX: 15, consignorGstY: 52,
    consigneeGstX: 105, consigneeGstY: 52,
    itemsStartY: 62,
    packagesX: 15, descriptionX: 35,
    weightActualX: 135, weightChargedX: 155,
    rateX: 170, freightToX: 185,
    chargesValueX: 193,  // 153 + 42 - 2 for seamless alignment with table
    freightY: 65, pfY: 67.2, lcY: 69.4, bcY: 71.6,
    totalY: 73.8, cgstY: 76, sgstY: 78.2,
    grandTotalY: 80.4
  };

  // Company header (properly centered in available space)
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  // Calculate proper center position avoiding right box (starts at X=170)
  const rightBoxX = 170;
  const leftAreaWidth = rightBoxX - 10; // Available space for header
  const headerCenterX = leftAreaWidth / 2 + 5; // True center of left area
  pdf.text('Jodhpur Bombay Road Carrier', headerCenterX, yOffset + layout.companyHeaderY, { align: 'center' });
  
  // Top right fields
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "normal");
  pdf.text(sampleBilty.biltyNo, layout.biltyNoX, yOffset + layout.biltyNoY);
  pdf.text(formattedDate, layout.dateX, yOffset + layout.dateY);
  pdf.text(sampleBilty.truckNo, layout.truckNoX, yOffset + layout.truckNoY);
  pdf.text(sampleBilty.from, layout.fromX, yOffset + layout.fromY);
  pdf.text(sampleBilty.to, layout.toX, yOffset + layout.toY);

  // Consignor/Consignee
  pdf.setFontSize(9);
  pdf.text(sampleBilty.consignorName, layout.consignorX, yOffset + layout.consignorY);
  pdf.text(sampleBilty.consignorGst, layout.consignorGstX, yOffset + layout.consignorGstY);
  pdf.text(sampleBilty.consigneeName, layout.consigneeX, yOffset + layout.consigneeY);
  pdf.text(sampleBilty.consigneeGst, layout.consigneeGstX, yOffset + layout.consigneeGstY);

  // Items
  let itemY = yOffset + layout.itemsStartY;
  pdf.setFontSize(8);
  
  sampleBilty.items.forEach((item) => {
    pdf.text(item.quantity.toString(), layout.packagesX, itemY);
    pdf.text(item.goodsDescription.substring(0, 20), layout.descriptionX, itemY);
    pdf.text(item.weight.toString(), layout.weightActualX, itemY);
    pdf.text(item.chargedWeight.toString(), layout.weightChargedX, itemY);
    pdf.text(item.rate, layout.rateX, itemY);
    
    const freightAmount = (parseFloat(item.rate) * parseFloat(item.chargedWeight)) / 100;
    pdf.text(freightAmount.toFixed(0), layout.freightToX, itemY);
    itemY += 4;
  });

  // Charges
  pdf.setFontSize(9);
  const charges = sampleBilty.charges;
  
  // Calculate freight from items
  const calculatedFreight = sampleBilty.items.reduce((total, item) => {
    return total + (parseFloat(item.rate) * parseFloat(item.chargedWeight) / 100);
  }, 0);
  
  // Calculate totals properly
  const calculatedTotal = calculatedFreight + charges.pf + charges.lc + charges.bc;
  const totalGst = charges.cgst + charges.sgst + (charges.igst || 0);
  const calculatedGrandTotal = calculatedTotal + totalGst - (charges.advance || 0);
  
  pdf.text(calculatedFreight.toFixed(2), layout.chargesValueX, yOffset + layout.freightY, { align: 'right' });
  pdf.text(charges.pf.toString(), layout.chargesValueX, yOffset + layout.pfY, { align: 'right' });
  pdf.text(charges.lc.toString(), layout.chargesValueX, yOffset + layout.lcY, { align: 'right' });
  pdf.text(charges.bc.toString(), layout.chargesValueX, yOffset + layout.bcY, { align: 'right' });
  
  pdf.setFont("helvetica", "bold");
  pdf.text(calculatedTotal.toFixed(2), layout.chargesValueX, yOffset + layout.totalY, { align: 'right' });
  pdf.setFont("helvetica", "normal");
  
  pdf.text(charges.cgst.toString(), layout.chargesValueX, yOffset + layout.cgstY, { align: 'right' });
  pdf.text(charges.sgst.toString(), layout.chargesValueX, yOffset + layout.sgstY, { align: 'right' });
  
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text(calculatedGrandTotal.toFixed(2), layout.chargesValueX, yOffset + layout.grandTotalY, { align: 'right' });
  pdf.setFont("helvetica", "normal");
}

// Draw 3 copies
drawBiltyCopy(0);
drawBiltyCopy(copyHeight);
drawBiltyCopy(copyHeight * 2);

// Add separation lines
pdf.setDrawColor(200, 200, 200);
pdf.setLineWidth(0.1);
pdf.line(0, copyHeight, pageWidth, copyHeight);
pdf.line(0, copyHeight * 2, pageWidth, copyHeight * 2);

// Save the PDF
require('fs').writeFileSync('test-bilty-3copies.pdf', pdf.output());
console.log('Test PDF generated: test-bilty-3copies.pdf');
