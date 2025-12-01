import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    Timestamp,
    query,
    where,
    orderBy
} from "firebase/firestore";
import ExcelJS from "exceljs";

// Helper to safely parse dates
function parseDate(dateStr: string | null): Date | null {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
}

// Helper to convert Firestore timestamp or string to Date object
function toDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Timestamp) return val.toDate();
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const fromStr = searchParams.get("from");
        const toStr = searchParams.get("to");
        const party = searchParams.get("party")?.toLowerCase().trim();

        const from = parseDate(fromStr);
        const to = parseDate(toStr);

        if (!from || !to) {
            return NextResponse.json(
                { message: "Please provide valid 'from' and 'to' dates." },
                { status: 400 }
            );
        }

        to.setHours(23, 59, 59, 999);

        // Fetch Payments
        let q = query(collection(db, "payments"));

        // Note: Firestore filtering by date here would be efficient, but we'll do in-memory 
        // to match the pattern and ensure robust date handling as seen in other files
        // unless the dataset is huge.
        const paymentSnap = await getDocs(q);
        const payments = paymentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // Filter Payments
        const filteredPayments = payments.filter(p => {
            const pDate = toDate(p.date);
            if (!pDate) return false;

            if (pDate < from || pDate > to) return false;

            if (party && !p.partyName?.toLowerCase().includes(party)) return false;

            return true;
        });

        // Sort by date
        filteredPayments.sort((a, b) => {
            const dateA = toDate(a.date);
            const dateB = toDate(b.date);
            return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
        });

        // --- Generate Excel ---
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Credit Report");

        // Styles
        const boldFont = { bold: true };
        const centerAlign = { horizontal: "center" as const, vertical: "middle" as const };

        // Header
        worksheet.mergeCells("A1:E1");
        worksheet.getCell("A1").value = "Jodhpur Bombay Road Carrier";
        worksheet.getCell("A1").font = { bold: true, size: 16 };
        worksheet.getCell("A1").alignment = centerAlign;

        worksheet.mergeCells("A2:E2");
        worksheet.getCell("A2").value = "Credit / Payment Report";
        worksheet.getCell("A2").font = { size: 12 };
        worksheet.getCell("A2").alignment = centerAlign;

        worksheet.mergeCells("A3:E3");
        worksheet.getCell("A3").value = `From: ${from.toLocaleDateString()}   To: ${to.toLocaleDateString()}`;
        worksheet.getCell("A3").alignment = centerAlign;

        if (party) {
            worksheet.mergeCells("A4:E4");
            worksheet.getCell("A4").value = `Party: ${party.toUpperCase()}`;
            worksheet.getCell("A4").font = boldFont;
            worksheet.getCell("A4").alignment = centerAlign;
        }

        // Table Header
        const headerRowIdx = party ? 6 : 5;
        const headerRow = worksheet.getRow(headerRowIdx);
        headerRow.values = ["Date", "Party Name", "Payment Mode", "Reference / Remarks", "Amount (₹)"];
        headerRow.font = boldFont;
        headerRow.alignment = { horizontal: "center" };

        // Column Widths
        worksheet.columns = [
            { width: 15 }, // Date
            { width: 30 }, // Party Name
            { width: 15 }, // Mode
            { width: 30 }, // Reference
            { width: 15 }, // Amount
        ];

        // Transaction Rows
        let currentRowIdx = headerRowIdx + 1;
        let totalAmount = 0;

        filteredPayments.forEach(p => {
            const amount = Number(p.amount) || 0;
            totalAmount += amount;
            const pDate = toDate(p.date);

            const row = worksheet.getRow(currentRowIdx);
            row.values = [
                pDate,
                p.partyName,
                p.paymentMode,
                [p.referenceNo, p.remarks].filter(Boolean).join(" - "),
                amount
            ];
            currentRowIdx++;
        });

        // Total Row
        const totalRow = worksheet.getRow(currentRowIdx);
        totalRow.values = [
            "",
            "",
            "",
            "Total Credit:",
            totalAmount
        ];
        totalRow.font = boldFont;
        totalRow.getCell(5).font = { bold: true, color: { argb: 'FF0000' } }; // Red color for credit? Or Green? Usually credit is good in this context (received money). Let's keep it standard.

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="Credit_Report_${party || 'All'}.xlsx"`,
            },
        });

    } catch (error: any) {
        console.error("Export API Error:", error);
        return NextResponse.json(
            { message: "Export failed", error: error.message },
            { status: 500 }
        );
    }
}
