import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import ExcelJS from "exceljs";

function parseDate(dateStr: string | null) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const from = parseDate(searchParams.get("from"));
    const to = parseDate(searchParams.get("to"));
    const party = searchParams.get("party");

    // --- Opening Balance Calculation ---
    let openingDebit = 0;
    let openingCredit = 0;
    if (from) {
      // Bilties before 'from'
      let biltyQ = query(collection(db, "bilties"), orderBy("biltyDate", "asc"), where("biltyDate", "<", from));
      const biltySnap = await getDocs(biltyQ);
      let bilties = biltySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (party) {
        bilties = bilties.filter(
          (b: any) =>
            b.consignorName?.toLowerCase().includes(party.toLowerCase()) ||
            b.consigneeName?.toLowerCase().includes(party.toLowerCase()) ||
            b.truckNo?.toLowerCase().includes(party.toLowerCase())
        );
      }
      openingDebit += bilties.reduce((sum, b: any) => sum + (b.charges?.grandTotal || 0), 0);
      // Challans before 'from'
      let challanQ = query(collection(db, "challans"), orderBy("challanDate", "asc"), where("challanDate", "<", from));
      const challanSnap = await getDocs(challanQ);
      let challans = challanSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (party) {
        challans = challans.filter(
          (c: any) =>
            c.partyName?.toLowerCase().includes(party.toLowerCase()) ||
            c.truckNo?.toLowerCase().includes(party.toLowerCase())
        );
      }
      openingCredit += challans.reduce((sum, c: any) => sum + (c.amount || 0), 0);
      // Payments before 'from'
      let paymentQ = query(collection(db, "payments"), orderBy("date", "asc"), where("date", "<", from));
      const paymentSnap = await getDocs(paymentQ);
      let payments = paymentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      if (party) {
        payments = payments.filter(
          (p: any) =>
            p.partyName?.toLowerCase().includes(party.toLowerCase())
        );
      }
      openingCredit += payments.reduce((sum, p: any) => sum + (p.amount || 0), 0);
    }
    const openingBalance = openingCredit - openingDebit;

    // --- Main Ledger Entries ---
    // Fetch bilties
    let biltyQ = query(collection(db, "bilties"), orderBy("biltyDate", "asc"));
    if (from && to) {
      biltyQ = query(biltyQ, where("biltyDate", ">=", from), where("biltyDate", "<=", to));
    } else if (from) {
      biltyQ = query(biltyQ, where("biltyDate", ">=", from));
    } else if (to) {
      biltyQ = query(biltyQ, where("biltyDate", "<=", to));
    }
    const biltySnap = await getDocs(biltyQ);
    let bilties = biltySnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), voucherType: "Bilty" }));
    if (party) {
      bilties = bilties.filter(
        (b: any) =>
          b.consignorName?.toLowerCase().includes(party.toLowerCase()) ||
          b.consigneeName?.toLowerCase().includes(party.toLowerCase()) ||
          b.truckNo?.toLowerCase().includes(party.toLowerCase())
      );
    }

    // Fetch challans
    let challanQ = query(collection(db, "challans"), orderBy("challanDate", "asc"));
    if (from && to) {
      challanQ = query(challanQ, where("challanDate", ">=", from), where("challanDate", "<=", to));
    } else if (from) {
      challanQ = query(challanQ, where("challanDate", ">=", from));
    } else if (to) {
      challanQ = query(challanQ, where("challanDate", "<=", to));
    }
    const challanSnap = await getDocs(challanQ);
    let challans = challanSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), voucherType: "Challan" }));
    if (party) {
      challans = challans.filter(
        (c: any) =>
          c.partyName?.toLowerCase().includes(party.toLowerCase()) ||
          c.truckNo?.toLowerCase().includes(party.toLowerCase())
      );
    }

    // Fetch payments
    let paymentQ = query(collection(db, "payments"), orderBy("date", "asc"));
    if (from && to) {
      paymentQ = query(paymentQ, where("date", ">=", from), where("date", "<=", to));
    } else if (from) {
      paymentQ = query(paymentQ, where("date", ">=", from));
    } else if (to) {
      paymentQ = query(paymentQ, where("date", "<=", to));
    }
    const paymentSnap = await getDocs(paymentQ);
    let payments = paymentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data(), voucherType: "Payment" }));
    if (party) {
      payments = payments.filter(
        (p: any) =>
          p.partyName?.toLowerCase().includes(party.toLowerCase())
      );
    }

    // Combine and sort all entries by date, with defensive checks
    const allEntries = [
      ...bilties.map((b: any) => ({
        date: b.biltyDate
          ? (b.biltyDate instanceof Timestamp ? b.biltyDate.toDate() : new Date(b.biltyDate))
          : null,
        voucherType: b.voucherType || "Bilty",
        particulars: b.consignorName || b.consigneeName || b.truckNo || '',
        debit: b.charges?.grandTotal || 0,
        credit: 0,
      })),
      ...challans.map((c: any) => ({
        date: c.challanDate
          ? (c.challanDate instanceof Timestamp ? c.challanDate.toDate() : new Date(c.challanDate))
          : null,
        voucherType: c.voucherType || "Challan",
        particulars: c.partyName || c.truckNo || '',
        debit: 0,
        credit: c.amount || 0,
      })),
      ...payments.map((p: any) => ({
        date: p.date
          ? (p.date instanceof Timestamp ? p.date.toDate() : new Date(p.date))
          : null,
        voucherType: p.voucherType || "Payment",
        particulars: p.partyName || '',
        debit: 0,
        credit: p.amount || 0,
      })),
    ].filter(e => e.date).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate running balance and summary totals
    let balance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;
    const ledgerRows = allEntries.map((entry) => {
      totalDebit += entry.debit;
      totalCredit += entry.credit;
      balance += entry.credit - entry.debit;
      return {
        ...entry,
        balance,
      };
    });
    const closingBalance = openingBalance + totalCredit - totalDebit;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Ledger");

    // Company Header
    worksheet.mergeCells("A1:G1");
    worksheet.getCell("A1").value = "Jodhpur Bombay Road Carrier";
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:G2");
    worksheet.getCell("A2").value = "P.No. 69, Transport Nagar, IInd PHASE BASANI, JODHPUR    08AAAHL5963P1ZK";
    worksheet.getCell("A2").font = { size: 12 };
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A4:G4");
    worksheet.getCell("A4").value = "LEDGER REPORT";
    worksheet.getCell("A4").font = { bold: true, size: 12 };
    worksheet.getCell("A4").alignment = { vertical: "middle", horizontal: "center" };

    // Date Range Row
    if (from || to) {
      worksheet.mergeCells("A5:B5");
      worksheet.getCell("A5").value = "Date From";
      worksheet.getCell("A5").font = { bold: true };
      worksheet.getCell("C5").value = from ? from.toLocaleDateString("en-GB") : "";
      worksheet.getCell("D5").value = "To";
      worksheet.getCell("E5").value = to ? to.toLocaleDateString("en-GB") : "";
    }

    // Party filter row
    if (party) {
      const partyRow = from || to ? 6 : 5;
      worksheet.mergeCells(`A${partyRow}:B${partyRow}`);
      worksheet.getCell(`A${partyRow}`).value = "Party";
      worksheet.getCell(`A${partyRow}`).font = { bold: true };
      worksheet.getCell(`C${partyRow}`).value = party;
    }

    // Determine header row
    let headerRow = 7;
    if (!from && !to) headerRow -= 1;
    if (!party) headerRow -= 1;

    // Opening Balance Row
    if (from) {
      const openingRow = worksheet.addRow([
        "",
        "",
        "Opening Balance",
        openingBalance >= 0 ? 0 : Math.abs(openingBalance),
        openingBalance >= 0 ? openingBalance : 0,
        openingBalance,
      ]);
      openingRow.font = { bold: true };
      openingRow.getCell(3).font = { bold: true, italic: true };
    }

    // Table Header
    worksheet.addRow(["Date", "Voucher Type", "Particulars", "Debit", "Credit", "Balance"]);
    const headerRowObj = worksheet.lastRow;
    if (headerRowObj) {
      headerRowObj.font = { bold: true };
      headerRowObj.alignment = { horizontal: "center" };
    }

    // Data Rows
    ledgerRows.forEach((row) => {
      worksheet.addRow([
        row.date ? row.date.toLocaleDateString("en-GB") : "",
        row.voucherType,
        row.particulars,
        row.debit,
        row.credit,
        row.balance,
      ]);
    });

    // Summary Row
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      "",
      "",
      "CLOSING BALANCE",
      totalDebit,
      totalCredit,
      closingBalance,
    ]);
    summaryRow.font = { bold: true };
    summaryRow.getCell(3).font = { bold: true, size: 12 };

    // Set column widths
    const widths = [12, 15, 25, 15, 15, 15];
    widths.forEach((w, i) => {
      const column = worksheet.getColumn(i + 1);
      if (column) column.width = w;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename
    const filename = `ledger_${party ? party.replace(/\s+/g, "_") + "_" : ""}${from ? from.toISOString().split('T')[0] : 'all'}_to_${to ? to.toISOString().split('T')[0] : 'all'}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Ledger Export Error:", error);
    return NextResponse.json(
      { message: "Failed to export ledger.", error: String(error) },
      { status: 500 }
    );
  }
}