import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
    collection,
    getDocs,
    Timestamp
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

        // Fetch Data
        const [biltySnap, challanSnap, paymentSnap] = await Promise.all([
            getDocs(collection(db, "bilties")),
            getDocs(collection(db, "challans")),
            getDocs(collection(db, "payments")),
        ]);

        const bilties = biltySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const challans = challanSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const payments = paymentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        // --- Calculate Opening Balance ---
        let openingDebit = 0;
        let openingCredit = 0;

        // Filter for Opening Balance
        for (const b of bilties) {
            const bDate = toDate(b.biltyDate);
            if (!bDate) continue;
            if (party && !(b.consignorName?.toLowerCase().includes(party) || b.consigneeName?.toLowerCase().includes(party) || b.truckNo?.toLowerCase().includes(party))) continue;
            if (bDate < from) openingDebit += (Number(b.charges?.grandTotal) || 0);
        }

        for (const c of challans) {
            const cDate = toDate(c.challanDate);
            if (!cDate) continue;
            if (party && !(c.partyName?.toLowerCase().includes(party) || c.truckNo?.toLowerCase().includes(party))) continue;
            if (cDate < from) openingCredit += (Number(c.amount) || 0);
        }

        for (const p of payments) {
            const pDate = toDate(p.date);
            if (!pDate) continue;
            if (party && !p.partyName?.toLowerCase().includes(party)) continue;
            if (pDate < from) openingCredit += (Number(p.amount) || 0);
        }

        const openingBalance = openingDebit - openingCredit;

        // --- Calculate Period Transactions ---
        const transactions: any[] = [];
        const paymentTransactions: any[] = []; // Track payments separately

        for (const b of bilties) {
            const bDate = toDate(b.biltyDate);
            if (!bDate) continue;
            if (party && !(b.consignorName?.toLowerCase().includes(party) || b.consigneeName?.toLowerCase().includes(party) || b.truckNo?.toLowerCase().includes(party))) continue;
            if (bDate >= from && bDate <= to) {
                transactions.push({
                    date: bDate,
                    voucherType: "Bilty",
                    particulars: b.consignorName || b.consigneeName || b.truckNo || "Bilty #" + b.biltyNo,
                    debit: Number(b.charges?.grandTotal) || 0,
                    credit: 0
                });
            }
        }

        for (const c of challans) {
            const cDate = toDate(c.challanDate);
            if (!cDate) continue;
            if (party && !(c.partyName?.toLowerCase().includes(party) || c.truckNo?.toLowerCase().includes(party))) continue;
            if (cDate >= from && cDate <= to) {
                transactions.push({
                    date: cDate,
                    voucherType: "Challan",
                    particulars: c.partyName || c.truckNo || "Challan",
                    debit: 0,
                    credit: Number(c.amount) || 0
                });
            }
        }

        // Process Payments (Credit) - Track separately for balance calculation
        for (const p of payments) {
            const pDate = toDate(p.date);
            if (!pDate) continue;
            if (party && !p.partyName?.toLowerCase().includes(party)) continue;
            if (pDate >= from && pDate <= to) {
                paymentTransactions.push({
                    date: pDate,
                    voucherType: "Payment",
                    particulars: p.partyName || "Payment",
                    debit: 0,
                    credit: Number(p.amount) || 0
                });
            }
        }

        // Combine all transactions for balance calculation
        const allTransactions = [...transactions, ...paymentTransactions];
        allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

        // --- Generate Excel ---
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Ledger");

        // Styles
        const boldFont = { bold: true };
        const centerAlign = { horizontal: "center" as const, vertical: "middle" as const };

        // Header
        worksheet.mergeCells("A1:E1");
        worksheet.getCell("A1").value = "Jodhpur Bombay Road Carrier";
        worksheet.getCell("A1").font = { bold: true, size: 16 };
        worksheet.getCell("A1").alignment = centerAlign;

        worksheet.mergeCells("A2:E2");
        worksheet.getCell("A2").value = "Ledger Account (Dues)";
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
        headerRow.values = ["Date", "Voucher Type", "Particulars", "Debit", "Balance"];
        headerRow.font = boldFont;
        headerRow.alignment = { horizontal: "center" };

        // Column Widths
        worksheet.columns = [
            { width: 15 }, // Date
            { width: 15 }, // Voucher
            { width: 40 }, // Particulars
            { width: 15 }, // Debit
            { width: 15 }, // Balance
        ];

        // Opening Balance Row
        let currentRowIdx = headerRowIdx + 1;
        const openingRow = worksheet.getRow(currentRowIdx);
        openingRow.values = [
            "",
            "",
            "Opening Balance",
            openingDebit,
            openingBalance
        ];
        openingRow.font = { italic: true };
        currentRowIdx++;

        // Transaction Rows - Calculate balance with all transactions
        let runningBalance = openingBalance;
        let totalDebitAll = 0;
        let totalCreditAll = 0;

        // First, calculate running balance for all transactions (including payments)
        const transactionsWithBalance = allTransactions.map(t => {
            totalDebitAll += t.debit;
            totalCreditAll += t.credit;
            runningBalance = runningBalance + t.debit - t.credit;
            return { ...t, balance: runningBalance };
        });

        // Only display non-payment transactions
        const displayTransactions = transactionsWithBalance.filter(t => t.voucherType !== 'Payment');

        // Calculate totals for displayed transactions only
        let displayDebitTotal = 0;
        displayTransactions.forEach(t => {
            displayDebitTotal += t.debit;
            const row = worksheet.getRow(currentRowIdx);
            row.values = [
                t.date,
                t.voucherType,
                t.particulars,
                t.debit || "",
                t.balance
            ];
            currentRowIdx++;
        });

        // Closing Balance Row - show only displayed debit total
        const closingRow = worksheet.getRow(currentRowIdx);
        closingRow.values = [
            "",
            "",
            "Total / Closing Balance",
            displayDebitTotal,
            runningBalance
        ];
        closingRow.font = boldFont;

        // Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Add timestamp to filename to prevent caching
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `Ledger_${party || 'General'}_${timestamp}.xlsx`;

        return new NextResponse(buffer, {
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache",
                "Expires": "0"
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
