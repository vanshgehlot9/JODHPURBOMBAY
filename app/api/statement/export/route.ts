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
    const type = searchParams.get("type") || "Client Statement";
    const party = searchParams.get("party") || "";

    // Helper to filter by party
    const partyMatch = (obj: any) =>
      party === "" ||
      obj.partyName?.toLowerCase().includes(party.toLowerCase()) ||
      obj.consignorName?.toLowerCase().includes(party.toLowerCase()) ||
      obj.consigneeName?.toLowerCase().includes(party.toLowerCase());

    // Fetch all relevant data
    let biltyQ = query(collection(db, "bilties"), orderBy("biltyDate", "asc"));
    if (from && to) {
      biltyQ = query(biltyQ, where("biltyDate", ">=", from), where("biltyDate", "<=", to));
    } else if (from) {
      biltyQ = query(biltyQ, where("biltyDate", ">=", from));
    } else if (to) {
      biltyQ = query(biltyQ, where("biltyDate", "<=", to));
    }
    const biltySnap = await getDocs(biltyQ);
    let bilties = biltySnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (party) bilties = bilties.filter(partyMatch);

    let challanQ = query(collection(db, "challans"), orderBy("challanDate", "asc"));
    if (from && to) {
      challanQ = query(challanQ, where("challanDate", ">=", from), where("challanDate", "<=", to));
    } else if (from) {
      challanQ = query(challanQ, where("challanDate", ">=", from));
    } else if (to) {
      challanQ = query(challanQ, where("challanDate", "<=", to));
    }
    const challanSnap = await getDocs(challanQ);
    let challans = challanSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (party) challans = challans.filter(partyMatch);

    let paymentQ = query(collection(db, "payments"), orderBy("date", "asc"));
    if (from && to) {
      paymentQ = query(paymentQ, where("date", ">=", from), where("date", "<=", to));
    } else if (from) {
      paymentQ = query(paymentQ, where("date", ">=", from));
    } else if (to) {
      paymentQ = query(paymentQ, where("date", "<=", to));
    }
    const paymentSnap = await getDocs(paymentQ);
    let payments = paymentSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    if (party) payments = payments.filter(partyMatch);

    // Build statement rows based on type
    let rows: any[] = [];
    if (type === "Client Statement") {
      rows = [
        ...bilties.map((b: any) => ({
          date: b.biltyDate instanceof Timestamp ? b.biltyDate.toDate() : new Date(b.biltyDate),
          particulars: b.consignorName || b.consigneeName || b.truckNo || '',
          debit: b.charges?.grandTotal || 0,
          credit: 0,
        })),
        ...challans.map((c: any) => ({
          date: c.challanDate instanceof Timestamp ? c.challanDate.toDate() : new Date(c.challanDate),
          particulars: c.partyName || c.truckNo || '',
          debit: 0,
          credit: c.amount || 0,
        })),
        ...payments.map((p: any) => ({
          date: p.date instanceof Timestamp ? p.date.toDate() : new Date(p.date),
          particulars: p.partyName || '',
          debit: 0,
          credit: p.amount || 0,
        })),
      ];
    } else if (type === "Cartage Paid Bilty") {
      rows = bilties.filter((b: any) => b.charges?.cartagePaid).map((b: any) => ({
        date: b.biltyDate instanceof Timestamp ? b.biltyDate.toDate() : new Date(b.biltyDate),
        particulars: b.consignorName || b.consigneeName || b.truckNo || '',
        debit: b.charges?.grandTotal || 0,
        credit: 0,
      }));
    } else if (type === "Receipt List") {
      rows = payments.map((p: any) => ({
        date: p.date instanceof Timestamp ? p.date.toDate() : new Date(p.date),
        particulars: p.partyName || '',
        debit: 0,
        credit: p.amount || 0,
      }));
    } else if (type === "Delivery Receipt (GST-wise)") {
      rows = challans.filter((c: any) => c.gstNo).map((c: any) => ({
        date: c.challanDate instanceof Timestamp ? c.challanDate.toDate() : new Date(c.challanDate),
        particulars: c.partyName || c.truckNo || '',
        debit: 0,
        credit: c.amount || 0,
      }));
    } else if (type === "Cash Delivery") {
      rows = challans.filter((c: any) => c.cashDelivery).map((c: any) => ({
        date: c.challanDate instanceof Timestamp ? c.challanDate.toDate() : new Date(c.challanDate),
        particulars: c.partyName || c.truckNo || '',
        debit: 0,
        credit: c.amount || 0,
      }));
    } else if (type === "Party Report") {
      // Party report: summary for each party
      const partyMap: Record<string, { debit: number; credit: number }> = {};
      bilties.forEach((b: any) => {
        const key = b.consignorName || b.consigneeName || b.truckNo || '';
        if (!partyMap[key]) partyMap[key] = { debit: 0, credit: 0 };
        partyMap[key].debit += b.charges?.grandTotal || 0;
      });
      challans.forEach((c: any) => {
        const key = c.partyName || c.truckNo || '';
        if (!partyMap[key]) partyMap[key] = { debit: 0, credit: 0 };
        partyMap[key].credit += c.amount || 0;
      });
      payments.forEach((p: any) => {
        const key = p.partyName || '';
        if (!partyMap[key]) partyMap[key] = { debit: 0, credit: 0 };
        partyMap[key].credit += p.amount || 0;
      });
      rows = Object.entries(partyMap).map(([particulars, { debit, credit }]) => ({
        date: null,
        particulars,
        debit,
        credit,
      }));
    }

    // Sort by date (if present)
    rows = rows.filter(r => r.date !== undefined).sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date.getTime() - b.date.getTime();
    });

    // Calculate running balance and summary
    let balance = 0;
    let totalDebit = 0;
    let totalCredit = 0;
    const statementRows = rows.map((row) => {
      totalDebit += row.debit;
      totalCredit += row.credit;
      balance += row.credit - row.debit;
      return {
        ...row,
        balance,
      };
    });
    const netBalance = totalCredit - totalDebit;

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(type);

    // Company Header
    worksheet.mergeCells("A1:F1");
    worksheet.getCell("A1").value = "Jodhpur Bombay Road Carrier";
    worksheet.getCell("A1").font = { bold: true, size: 14 };
    worksheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A2:F2");
    worksheet.getCell("A2").value = "P.No. 69, Transport Nagar, IInd PHASE BASANI, JODHPUR    08AAAHL5963P1ZK";
    worksheet.getCell("A2").font = { size: 12 };
    worksheet.getCell("A2").alignment = { vertical: "middle", horizontal: "center" };

    worksheet.mergeCells("A4:F4");
    worksheet.getCell("A4").value = type.toUpperCase();
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

    // Table Header
    if (type === "Party Report") {
      worksheet.addRow(["Party Name", "Debit", "Credit", "Balance"]);
    } else {
      worksheet.addRow(["Date", "Particulars", "Debit", "Credit", "Balance"]);
    }
    const headerRowObj = worksheet.lastRow;
    if (headerRowObj) {
      headerRowObj.font = { bold: true };
      headerRowObj.alignment = { horizontal: "center" };
    }

    // Data Rows
    statementRows.forEach((row) => {
      if (type === "Party Report") {
        worksheet.addRow([
          row.particulars,
          row.debit,
          row.credit,
          row.balance,
        ]);
      } else {
        worksheet.addRow([
          row.date ? new Date(row.date).toLocaleDateString("en-GB") : "",
          row.particulars,
          row.debit,
          row.credit,
          row.balance,
        ]);
      }
    });

    // Summary Row
    worksheet.addRow([]);
    const summaryRow = worksheet.addRow([
      "TOTAL",
      "",
      totalDebit,
      totalCredit,
      netBalance,
    ]);
    summaryRow.font = { bold: true };
    summaryRow.getCell(1).font = { bold: true, size: 12 };

    // Set column widths
    const widths = type === "Party Report" ? [25, 15, 15, 15] : [12, 25, 15, 15, 15];
    widths.forEach((w, i) => {
      const column = worksheet.getColumn(i + 1);
      if (column) column.width = w;
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Generate filename
    const typeSlug = type.toLowerCase().replace(/\s+/g, "_");
    const filename = `${typeSlug}_${from ? from.toISOString().split('T')[0] : 'all'}_to_${to ? to.toISOString().split('T')[0] : 'all'}.xlsx`;

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Statement Export Error:", error);
    return NextResponse.json(
      { message: "Failed to export statement.", error: String(error) },
      { status: 500 }
    );
  }
}