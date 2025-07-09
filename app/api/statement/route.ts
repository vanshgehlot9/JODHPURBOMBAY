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
        date: row.date ? row.date.toISOString() : '',
        balance,
      };
    });
    const netBalance = totalCredit - totalDebit;

    return NextResponse.json({
      data: statementRows,
      summary: {
        totalDebit,
        totalCredit,
        netBalance,
      },
    });
  } catch (error) {
    console.error('Statement API error:', error);
    return NextResponse.json({ message: "Failed to fetch statement.", error: String(error) }, { status: 500 });
  }
} 