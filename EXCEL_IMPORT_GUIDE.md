# Excel Import Guide for Bulk Bilty Import

## Overview
You can now import multiple bilties using Excel files (.xlsx, .xls) or CSV files. After importing, you can export the results to a PDF document for record-keeping.

## ⚠️ GSTIN Missing? 
If your GSTIN fields are not importing correctly, see the **[GSTIN Troubleshooting Guide](./GSTIN_TROUBLESHOOTING.md)** for detailed solutions.

## Excel File Format

### Important: Separate GSTIN Columns!
**CRITICAL**: Consignor GSTIN and Consignee GSTIN must be in SEPARATE columns from the names!

❌ **Wrong** (merged):
```
| Consignor                                    |
| DAULAT INDUSTRIES 08AABFD6109L1ZF           |
```

✅ **Correct** (separate columns):
```
| Consignor         | Consignor GSTIN    |
| DAULAT INDUSTRIES | 08AABFD6109L1ZF    |
```

### Required Columns:
**Note**: Columns can be in ANY order, but headers must contain these keywords:

1. **Date** - Format: DD-MM-YYYY (e.g., 07-01-2025)
2. **G.R..NO.** or **G.R.NO** or **GR NO** - Bilty/GR Number (e.g., 2165)
3. **Consignor** - Consignor Name (separate from GSTIN!)
4. **Consignor GSTIN** - 15-character GSTIN (e.g., 08AABFD6109L1ZF)
5. **Consignee** - Consignee Name (separate from GSTIN!)
6. **Consignee GSTIN** - 15-character GSTIN (e.g., 37ABYPM0832H1ZA)
7. **Tot. Amt.** or **Amount** - Total Amount (numeric)
8. **SGST** - SGST Amount (numeric)
9. **CGST** - CGST Amount (numeric)
10. **Paid by** or **Paid** - Payment type (e.g., EXEMPTED, TO PAY, PAID)

### Example Excel Data:

| Date       | G.R..NO. | Consignor          | Consignor GSTIN  | Consignee                    | Consignee GSTIN  | Tot. Amt. | SGST | CGST | Paid by  |
|------------|----------|--------------------|------------------|------------------------------|------------------|-----------|------|------|----------|
| 07-01-2025 | 2165     | DAULAT INDUSTRIES  | 08AABFD6109L1ZF  | APARNA METAL INDUSTRIES      | 37ABYPM0832H1ZA  | 45946.00  | 0    | 0    | EXEMPTED |
| 07-01-2025 | 2166     | DAULAT INDUSTRIES  | 08AABFD6109L1ZF  | GURUDEVA INDUSTRIES          | 37AKKPM0063F1ZA  | 45121.00  | 0    | 0    | EXEMPTED |
| 07-01-2025 | 2167     | RIDHI SIDHI STEELS | 08ABSPJ2841B1ZR  | APARNA METAL INDUSTRIES      | 37ABYPM0832H1ZA  | 26479.00  | 0    | 0    | EXEMPTED |

## How to Use

### Method 1: Upload Excel File
1. Go to Bilty → Create → Bulk Import
2. Click on the "Upload Excel" tab
3. Click "Choose File" and select your Excel file (.xlsx, .xls, or .csv)
4. The system will parse the file and show the data in the text area
5. Review the parsed data
6. Click "Import Bilties"

### Method 2: Paste Text Data
1. Go to Bilty → Create → Bulk Import
2. Stay on the "Paste Text" tab
3. Copy data from Excel (select cells and Ctrl+C / Cmd+C)
4. Paste directly into the text area
5. Click "Import Bilties"

## Important Notes

1. **Date Format**: Must be DD-MM-YYYY (e.g., 07-01-2025)
2. **GSTIN Format**: Must be exactly 15 characters starting with 2 digits
3. **GSTIN Columns**: Must be SEPARATE from name columns (see examples above)
4. **Header Row**: The system automatically detects and skips header rows
5. **Column Order**: Doesn't matter - columns detected by header names
6. **Numeric Values**: Amounts should be numeric (decimals allowed)
7. **Default Values**: 
   - From: JODHPUR (auto-filled)
   - To: HYDERABAD (auto-filled)
   - Status: pending (auto-filled)

## Debugging GSTIN Import

After uploading your Excel file:

1. **Open Browser Console** (Press F12)
2. **Look for logs** like:
   ```
   Parsed Bilty 2165: {
     consignor: "DAULAT INDUSTRIES",
     consignorGSTIN: "08AABFD6109L1ZF" or "MISSING",
     ...
   }
   ```
3. **If you see "MISSING"**: Your GSTIN columns aren't being detected
4. **Solution**: Check [GSTIN Troubleshooting Guide](./GSTIN_TROUBLESHOOTING.md)

## Supported File Types
- `.xlsx` - Excel 2007 and later (Recommended)
- `.xls` - Excel 97-2003
- `.csv` - Comma Separated Values

## Error Handling
- The system validates each row before importing
- Invalid dates will be skipped with an error message
- Missing required fields will be reported
- GSTIN format validation (15 characters)
- Successfully imported bilties will be listed separately from errors

## Tips for Best Results

1. **Clean Your Data**: Remove any extra spaces or special characters
2. **Consistent Format**: Ensure all dates follow DD-MM-YYYY format
3. **Valid GSTIN**: Verify GSTIN numbers are exactly 15 characters
4. **Test First**: Try importing a few rows first to verify the format
5. **Check Results**: Review the import results summary for any errors
6. **Export Results**: Use the "Export to PDF" button to save import results

## Export to PDF

After importing your bilties, you can export the results to a PDF document for record-keeping and reporting.

### What's Included in the PDF Export:
- **Summary Information**:
  - Import date
  - Total bilties processed
  - Number of successful imports
  - Number of failed imports

- **Successful Imports Table**:
  - Bilty numbers
  - Document IDs

- **Failed Imports Table** (if any):
  - Bilty numbers that failed
  - Specific error messages for each failure

### How to Export Results to PDF:
1. Complete the import process (upload Excel or paste data)
2. Review the import results summary
3. Click the "Export to PDF" button (appears after import completes)
4. The PDF will automatically download with filename: `bulk-import-results-YYYY-MM-DD.pdf`

### Benefits of PDF Export:
- **Documentation**: Keep records of all import operations
- **Audit Trail**: Track which bilties were imported successfully
- **Error Analysis**: Review all errors in a printable format
- **Sharing**: Easy to share results with team members or management
- **Compliance**: Maintain import logs for compliance purposes

## Troubleshooting

### "Invalid Time" Error
- Check that dates are in DD-MM-YYYY format
- Ensure dates are valid (e.g., not 32-01-2025)

### "Missing Fields" Error  
- Verify all required columns are present
- Check for empty cells in required fields

### "Invalid GSTIN" Error
- GSTIN must be exactly 15 characters
- Format: 2 digits + 13 alphanumeric characters

### File Not Recognized
- Ensure file has .xlsx, .xls, or .csv extension
- Try saving as .xlsx if using older Excel formats

## Need Help?
If you encounter issues, check the error messages in the import results panel. Each error will specify the bilty number and the issue found.
