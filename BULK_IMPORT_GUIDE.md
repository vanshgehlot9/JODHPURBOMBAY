# Bulk Bilty Import Guide

## 🚀 Feature Overview
You can now import multiple bilties at once using Excel files or by pasting data! After importing, export the results to PDF for record-keeping.

## 📋 Quick Links
- 📊 [Excel Import Guide](./EXCEL_IMPORT_GUIDE.md) - How to import from Excel files
- 📥 [PDF Export Guide](./BULK_IMPORT_PDF_EXPORT.md) - Detailed PDF export documentation
- ⚡ [PDF Export Quickstart](./PDF_EXPORT_QUICKSTART.md) - Quick guide to PDF export

## 📍 How to Use

### 1. **Navigate to Create Bilty Page**
Go to `/bilty/create` and you'll see two tabs:
- **Single Bilty** - Create one bilty at a time (existing form)
- **Bulk Import** - Import multiple bilties at once

### 2. **Choose Import Method**
In the Bulk Import tab, you have two options:

#### Option A: Paste Text
- Prepare your data in the correct format (see below)
- Paste directly into the text area
- Click "Import Bilties"

#### Option B: Upload Excel
- Prepare an Excel file (.xlsx, .xls) or CSV
- Click "Upload Excel" tab
- Select your file
- Click "Import Bilties"

### 3. **Prepare Your Data**
Format your data with the following columns (space-separated):

```
Date G.R.NO Consignor ConsignorGSTIN Consignee ConsigneeGSTIN Amount SGST CGST PaidBy
```

**Example:**
```
07-01-2025 2165 DAULAT INDUSTRIES 08AABFD6109L1ZF APARNA METAL INDUSTRIES 37ABYPM0832H1ZA 45946.00 0 0 EXEMPTED
07-01-2025 2166 DAULAT INDUSTRIES 08AABFD6109L1ZF GURUDEVA INDUSTRIES 37AKKPM0063F1ZA 45121.00 0 0 EXEMPTED
```

### 4. **Import & Export Process**
1. Choose your import method (Paste Text or Upload Excel)
2. Paste data or upload file
3. Click **"Import Bilties"** button
4. Wait for the import to complete
5. Review the results showing:
   - ✅ Successfully imported bilties
   - ❌ Failed imports with error messages
6. **NEW!** Click **"Export to PDF"** to download a complete report

### 5. **PDF Export (NEW!) 📥**
After importing, you can export the results to a professional PDF report:
- **What's included:**
  - Summary statistics (total, succeeded, failed)
  - Table of all successful imports with document IDs
  - Table of all failed imports with error messages
  - Date-stamped for record-keeping
  
- **How to use:**
  - Click the "Export to PDF" button in the results section
  - PDF automatically downloads as `bulk-import-results-YYYY-MM-DD.pdf`
  - Keep for audit trail and documentation

- **Benefits:**
  - Easy record-keeping
  - Share results with team
  - Track import history
  - Identify patterns in errors

See [PDF Export Quickstart](./PDF_EXPORT_QUICKSTART.md) for detailed instructions.

## 📊 Data Format Details

### Column Breakdown:
1. **Date** - Format: DD-MM-YYYY (e.g., 07-01-2025)
2. **G.R.NO** - Bilty number (e.g., 2165)
3. **Consignor** - Sender's name (can have spaces)
4. **Consignor GSTIN** - Sender's GST number (e.g., 08AABFD6109L1ZF)
5. **Consignee** - Receiver's name (can have spaces)
6. **Consignee GSTIN** - Receiver's GST number (e.g., 37ABYPM0832H1ZA)
7. **Amount** - Total amount (e.g., 45946.00)
8. **SGST** - State GST (e.g., 0)
9. **CGST** - Central GST (e.g., 0)
10. **Paid By** - Payment status (e.g., EXEMPTED)

### Auto-Filled Fields:
- **From**: JODHPUR (default)
- **To**: HYDERABAD (default)
- **Status**: pending
- **Items**: Auto-created with amount as freight

## ✨ Features

### Smart Parsing
- Automatically detects GSTIN patterns (starts with 2 digits + alphanumeric)
- Handles multi-word company names
- Converts dates to proper format
- Creates items array automatically

### Error Handling
- Shows which bilties succeeded
- Lists failed imports with specific error messages
- Validates required fields before import

### Results Display
- **Success Count** - Number of successfully imported bilties
- **Error Count** - Number of failed imports
- **Detailed List** - Shows each bilty's status with ID
- **Error Details** - Explains why each failed import occurred

## 🎯 Sample Data (Your Export)

You can copy-paste this entire block:

```
07-01-2025 2165 DAULAT INDUSTRIES 08AABFD6109L1ZF APARNA METAL INDUSTRIES 37ABYPM0832H1ZA 45946.00 0 0 EXEMPTED
07-01-2025 2166 DAULAT INDUSTRIES 08AABFD6109L1ZF GURUDEVA INDUSTRIES 37AKKPM0063F1ZA 45121.00 0 0 EXEMPTED
07-01-2025 2167 RIDHI SIDHI STEELS 08ABSPJ2841B1ZR APARNA METAL INDUSTRIES 37ABYPM0832H1ZA 26479.00 0 0 EXEMPTED
08-01-2025 2168 SAMDARI STRIPS PRIVATE LIMITED 08AAACS5814R1ZT GAYATRI METALS 37AJZPP4951H1ZD 37015.00 0 0 EXEMPTED
08-01-2025 2169 ABDUL KAYUM ENTERPRISES 08AYYPS5961Q1ZV B.B.TRADING 37EFCPS5901F1ZE 47930.00 0 0 EXEMPTED
```

## 🔧 API Endpoint

**POST** `/api/bilty/bulk-import`

**Request Body:**
```json
{
  "bilties": [
    {
      "biltyNo": "2165",
      "biltyDate": "2025-01-07T00:00:00.000Z",
      "consignorName": "DAULAT INDUSTRIES",
      "consignorGSTIN": "08AABFD6109L1ZF",
      "consigneeName": "APARNA METAL INDUSTRIES",
      "consigneeGSTIN": "37ABYPM0832H1ZA",
      "totalAmount": 45946,
      "sgst": 0,
      "cgst": 0,
      "paidBy": "EXEMPTED",
      "from": "JODHPUR",
      "to": "HYDERABAD"
    }
  ]
}
```

**Response:**
```json
{
  "message": "Bulk import completed. 5 succeeded, 0 failed.",
  "results": [...],
  "errors": [],
  "total": 5,
  "succeeded": 5,
  "failed": 0
}
```

## 📝 Notes

- Each line represents one bilty
- Empty lines are automatically skipped
- Total/summary lines are ignored
- GSTIN format is auto-detected (2 digits + alphanumeric)
- Invalid data will be reported in errors with specific reasons

## 🎉 Benefits

1. **Save Time** - Import 100s of bilties in seconds
2. **Accuracy** - Automated parsing reduces manual errors
3. **Validation** - Checks data before import
4. **Feedback** - Shows exactly what succeeded/failed
5. **Easy** - Just copy-paste your data!

Enjoy the bulk import feature! 🚀
