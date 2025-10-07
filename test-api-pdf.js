// Test script to validate the enhanced PDF API route works
const fetch = require('node-fetch');
const fs = require('fs');

async function testPdfGeneration() {
  try {
    console.log('🧪 Testing enhanced PDF generation API...');
    
    // You can replace this with an actual bilty ID from your database
    const testBiltyId = 'test-bilty-001';
    const apiUrl = `http://localhost:3000/api/bilty/${testBiltyId}/pdf`;
    
    console.log(`📡 Making request to: ${apiUrl}`);
    
    const response = await fetch(apiUrl);
    
    if (response.ok) {
      const pdfBuffer = await response.buffer();
      const filename = 'test-enhanced-api-pdf.pdf';
      
      fs.writeFileSync(filename, pdfBuffer);
      
      console.log('✅ Enhanced PDF API test successful!');
      console.log(`📄 PDF saved as: ${filename}`);
      console.log(`📊 PDF size: ${pdfBuffer.length} bytes`);
      console.log('🎨 Enhanced features should include:');
      console.log('   • Professional blue headers');
      console.log('   • Color-coded consignor (red) and consignee (green)');
      console.log('   • GST information highlighted in amber');
      console.log('   • Enhanced table formatting');
      console.log('   • Professional borders and styling');
    } else {
      console.log(`❌ API test failed with status: ${response.status}`);
      console.log(`Error: ${await response.text()}`);
    }
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
    console.log('💡 Make sure your Next.js development server is running (npm run dev)');
  }
}

testPdfGeneration();