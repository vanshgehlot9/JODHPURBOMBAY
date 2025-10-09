# Autocomplete Feature Guide

## Overview
The bilty creation form now includes **intelligent autocomplete** that remembers previously entered data and suggests it when you start typing. This saves time and ensures consistency in data entry.

## Features

### 1. **Consignor Name Autocomplete**
- **When typing**: Start typing a consignor name (minimum 2 characters)
- **What appears**: A dropdown list of previously used consignor names
- **Additional info**: Each suggestion shows the associated GST number
- **Auto-fill**: When you select a suggestion, both the name and GST fields are automatically filled

**Example:**
```
Type: "van"
Suggestions appear:
  ┌─────────────────────────────────────┐
  │ Vansh Industries                    │
  │ GST: 08AABFD6109L1ZF               │
  ├─────────────────────────────────────┤
  │ Vanshu Metals                       │
  │ GST: 08XXXXX1234X1ZX               │
  └─────────────────────────────────────┘
```

### 2. **Consignee Name Autocomplete**
- **When typing**: Start typing a consignee name (minimum 2 characters)
- **What appears**: A dropdown list of previously used consignee names
- **Additional info**: Each suggestion shows the associated GST number
- **Auto-fill**: When you select a suggestion, both the name and GST fields are automatically filled

**Example:**
```
Type: "apa"
Suggestions appear:
  ┌─────────────────────────────────────┐
  │ Aparna Metal Industries             │
  │ GST: 37ABYPM0832H1ZA               │
  └─────────────────────────────────────┘
```

### 3. **Truck Number Autocomplete**
- **When typing**: Start typing a truck number (minimum 2 characters)
- **What appears**: A dropdown list of previously used truck numbers
- **Additional info**: Shows the last consignor and consignee this truck was used for
- **Auto-fill**: When you select a suggestion, the truck number field is filled

**Example:**
```
Type: "rj"
Suggestions appear:
  ┌─────────────────────────────────────┐
  │ RJ14GA1234                          │
  │ Last used: Vansh → Aparna          │
  ├─────────────────────────────────────┤
  │ RJ14GA5678                          │
  │ Last used: Daulat → Rajendra       │
  └─────────────────────────────────────┘
```

## How It Works

1. **Data Storage**: Every time you create a bilty, the system stores:
   - Consignor name + GST number
   - Consignee name + GST number
   - Truck number + last route

2. **Smart Matching**: The system searches through all previous bilties to find matches

3. **Unique Entries**: Only unique combinations are shown (no duplicates)

4. **Auto-fill**: Clicking a suggestion automatically fills related fields

## Tips for Best Results

### 1. **Consistent Naming**
- Use the same spelling and format for company names
- Example: Always use "APARNA METAL INDUSTRIES" not sometimes "Aparna Metal" or "APARNA INDUSTRIES"

### 2. **Complete Data**
- Always fill in GST numbers when available
- This ensures future autocomplete suggestions include GST information

### 3. **Uppercase for GST**
- GST numbers should be in UPPERCASE for consistency
- Example: `08AABFD6109L1ZF` not `08aabfd6109l1zf`

### 4. **Minimum Characters**
- Type at least 2 characters before suggestions appear
- More characters = more specific suggestions

## Keyboard Navigation

- **Type**: Start typing to see suggestions
- **Mouse Click**: Click on any suggestion to select it
- **Click Outside**: Click anywhere outside to close suggestions
- **ESC**: Press Escape to close suggestions (keyboard support coming soon)

## Data Privacy

- All suggestions are based on YOUR bilties only
- No data is shared between different users
- Suggestions are fetched in real-time from your Firestore database

## Troubleshooting

### "No suggestions appearing"
- **Solution**: Make sure you've typed at least 2 characters
- **Solution**: Check that you have previous bilties with matching data

### "Wrong GST number suggested"
- **Cause**: The system shows the most recently used GST for that name
- **Solution**: You can manually update the GST field after selecting

### "Suggestions won't close"
- **Solution**: Click outside the input field
- **Solution**: Start typing in another field

## Future Enhancements

Coming soon:
- ✅ Keyboard arrow navigation through suggestions
- ✅ Recently used suggestions appear first
- ✅ Fuzzy search (typo-tolerant matching)
- ✅ Bulk edit GST numbers for existing records
- ✅ Export/import common consignor/consignee data

## Technical Details

**API Endpoint**: `/api/bilty/suggestions`
**Query Parameters**:
- `type`: "consignor", "consignee", or "truck"
- `search`: The search term (minimum 2 characters)

**Response Format**:
```json
{
  "suggestions": [
    {
      "displayName": "APARNA METAL INDUSTRIES",
      "displayGst": "37ABYPM0832H1ZA"
    }
  ]
}
```

## Support

If you encounter any issues with the autocomplete feature:
1. Check your browser console for errors
2. Verify you have a stable internet connection
3. Try refreshing the page
4. Contact support if the issue persists
