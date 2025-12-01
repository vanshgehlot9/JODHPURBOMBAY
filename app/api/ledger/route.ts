import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentData,
  QueryDocumentSnapshot
} from "firebase/firestore";

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

    // Validate dates
    if (!from || !to) {
      return NextResponse.json(
        { message: "Please provide valid 'from' and 'to' dates." },
        { status: 400 }
      );
    }

    // Set 'to' date to end of day to include all transactions on that day
    to.setHours(23, 59, 59, 999);

    // --- 1. Calculate Opening Balance (Transactions BEFORE 'from' date) ---
    let openingDebit = 0;
    let openingCredit = 0;

    // 1a. Bilties (Debit) - Before 'from'
    const biltyRef = collection(db, "bilties");
    const biltyQBefore = query(biltyRef, where("biltyDate", "<", fromStr)); // Using string comparison for stability if stored as string, or convert if needed. 
    // Note: If dates are stored as strings in format YYYY-MM-DD, string comparison works. 
    // If stored as Timestamps, we need to pass Date objects. 
    // Assuming mixed or string based on previous code, but let's try to be robust.
    // Ideally we fetch all and filter in memory if the dataset isn't huge, 
    // or use proper Firestore indexes. For now, let's fetch based on date if possible, 
    // but to be safe against format mismatches, fetching a wider range or all might be safer if volume allows.
    // Let's stick to the previous pattern but refine it.

    // Actually, to avoid "Invalid state" issues, let's fetch collections in parallel and process in memory 
    // if the dataset is reasonable ( < few thousand docs). If it's large, we need indexes.
    // Let's assume reasonable size for this "JBRC" app.

    const [biltySnap, challanSnap, paymentSnap] = await Promise.all([
      getDocs(collection(db, "bilties")),
      getDocs(collection(db, "challans")),
      getDocs(collection(db, "payments")),
    ]);

    const bilties = biltySnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    const challans = challanSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
    const payments = paymentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

    // Filter and Calculate Opening Balance
    // Rules:
    // - Date < from
    // - Matches Party (if provided)

    for (const b of bilties) {
      const bDate = toDate(b.biltyDate);
      if (!bDate) continue;

      // Filter by Party
      if (party) {
        const match =
          b.consignorName?.toLowerCase().includes(party) ||
          b.consigneeName?.toLowerCase().includes(party) ||
          b.truckNo?.toLowerCase().includes(party);
        if (!match) continue;
      }

      if (bDate < from) {
        openingDebit += (Number(b.charges?.grandTotal) || 0);
      }
    }

    for (const c of challans) {
      const cDate = toDate(c.challanDate);
      if (!cDate) continue;

      if (party) {
        const match =
          c.partyName?.toLowerCase().includes(party) ||
          c.truckNo?.toLowerCase().includes(party);
        if (!match) continue;
      }

      if (cDate < from) {
        openingCredit += (Number(c.amount) || 0);
      }
    }

    for (const p of payments) {
      const pDate = toDate(p.date);
      if (!pDate) continue;

      if (party) {
        const match = p.partyName?.toLowerCase().includes(party);
        if (!match) continue;
      }

      if (pDate < from) {
        openingCredit += (Number(p.amount) || 0);
      }
    }

    // Opening Balance = Debit - Credit (Asset/Receivable nature)
    // If Debit > Credit, positive balance (Receivable)
    const openingBalance = openingDebit - openingCredit;


    // --- 2. Calculate Period Transactions (Between 'from' and 'to') ---
    const transactions: any[] = [];
    const paymentTransactions: any[] = []; // Track payments separately for balance calculation


    // Process Bilties (Debit)
    for (const b of bilties) {
      const bDate = toDate(b.biltyDate);
      if (!bDate) continue;

      if (party) {
        const match =
          b.consignorName?.toLowerCase().includes(party) ||
          b.consigneeName?.toLowerCase().includes(party) ||
          b.truckNo?.toLowerCase().includes(party);
        if (!match) continue;
      }

      if (bDate >= from && bDate <= to) {
        transactions.push({
          id: b.id,
          date: bDate,
          voucherType: "Bilty",
          particulars: b.consignorName || b.consigneeName || b.truckNo || "Bilty #" + b.biltyNo,
          debit: Number(b.charges?.grandTotal) || 0,
          credit: 0
        });
      }
    }

    // Process Challans (Credit)
    for (const c of challans) {
      const cDate = toDate(c.challanDate);
      if (!cDate) continue;

      if (party) {
        const match =
          c.partyName?.toLowerCase().includes(party) ||
          c.truckNo?.toLowerCase().includes(party);
        if (!match) continue;
      }

      if (cDate >= from && cDate <= to) {
        transactions.push({
          id: c.id,
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

      if (party) {
        const match = p.partyName?.toLowerCase().includes(party);
        if (!match) continue;
      }

      if (pDate >= from && pDate <= to) {
        paymentTransactions.push({
          id: p.id,
          date: pDate,
          voucherType: "Payment",
          particulars: p.partyName || "Payment",
          debit: 0,
          credit: Number(p.amount) || 0
        });
      }
    }

    // Combine all transactions (bilties, challans, payments) for proper balance calculation
    const allTransactions = [...transactions, ...paymentTransactions];
    allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // --- 3. Calculate Running Balance ---
    let runningBalance = openingBalance;
    let totalDebit = 0;
    let totalCredit = 0;

    // Calculate balance with all transactions
    const ledgerRows = allTransactions.map(t => {
      totalDebit += t.debit;
      totalCredit += t.credit;

      // Balance = Previous Balance + Debit - Credit
      runningBalance = runningBalance + t.debit - t.credit;

      return {
        ...t,
        balance: runningBalance
      };
    });

    // Filter out payments from display (but they were used in balance calculation)
    const displayRows = ledgerRows.filter(t => t.voucherType !== 'Payment');

    const closingBalance = openingBalance + totalDebit - totalCredit;

    return NextResponse.json({
      data: displayRows,
      summary: {
        openingBalance,
        totalDebit,
        totalCredit,
        closingBalance
      }
    });

  } catch (error: any) {
    console.error("Ledger API Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: error.message },
      { status: 500 }
    );
  }
}
