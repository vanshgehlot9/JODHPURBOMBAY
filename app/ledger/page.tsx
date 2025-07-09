'use client';

import React, { useEffect, useState } from "react";

interface LedgerRow {
  date: string;
  voucherType: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerSummary {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

const LedgerPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [party, setParty] = useState("");
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLedger = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (party) params.append("party", party);
      const res = await fetch(`/api/ledger?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch ledger");
      const data = await res.json();
      setRows(
        (data.data || []).map((row: any) => ({
          ...row,
          date: row.date ? new Date(row.date).toLocaleDateString() : "",
        }))
      );
      setSummary(data.summary);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
    // eslint-disable-next-line
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedger();
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (party) params.append("party", party);
      const res = await fetch(`/api/ledger/export?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to export ledger");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ledger.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || "Failed to export ledger");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 print:text-center">Ledger</h1>
      {/* Filters, Export, and Print */}
      <form className="mb-6 flex flex-wrap gap-4 items-center print:hidden" onSubmit={handleFilter}>
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={from}
          onChange={e => setFrom(e.target.value)}
          placeholder="Start Date"
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="End Date"
        />
        <input
          type="text"
          className="border rounded px-2 py-1"
          value={party}
          onChange={e => setParty(e.target.value)}
          placeholder="Party or Truck Owner"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-1 rounded">
          Filter
        </button>
        <button
          type="button"
          className="bg-green-600 text-white px-4 py-1 rounded ml-2"
          onClick={handleExport}
        >
          Export
        </button>
        <button
          type="button"
          className="bg-gray-700 text-white px-4 py-1 rounded ml-2"
          onClick={handlePrint}
        >
          Print
        </button>
      </form>
      {/* Loading/Error */}
      {loading && <div className="mb-4 text-blue-600">Loading...</div>}
      {error && <div className="mb-4 text-red-600">{error}</div>}
      {/* Ledger Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Voucher Type</th>
              <th className="px-4 py-2 border">Particulars</th>
              <th className="px-4 py-2 border">Debit</th>
              <th className="px-4 py-2 border">Credit</th>
              <th className="px-4 py-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-2 border" colSpan={6}>
                  No data found.
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => (
                <tr key={idx}>
                  <td className="px-4 py-2 border">{row.date}</td>
                  <td className="px-4 py-2 border">{row.voucherType}</td>
                  <td className="px-4 py-2 border">{row.particulars}</td>
                  <td className="px-4 py-2 border text-right">{row.debit ? `₹${row.debit.toFixed(2)}` : ""}</td>
                  <td className="px-4 py-2 border text-right">{row.credit ? `₹${row.credit.toFixed(2)}` : ""}</td>
                  <td className="px-4 py-2 border text-right">₹{row.balance.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Summary Totals */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Opening Balance</div>
          <div className="font-bold">₹{summary ? summary.openingBalance.toFixed(2) : "0.00"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Total Debit</div>
          <div className="font-bold">₹{summary ? summary.totalDebit.toFixed(2) : "0.00"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Total Credit</div>
          <div className="font-bold">₹{summary ? summary.totalCredit.toFixed(2) : "0.00"}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Closing Balance</div>
          <div className="font-bold">₹{summary ? summary.closingBalance.toFixed(2) : "0.00"}</div>
        </div>
      </div>
    </div>
  );
};

export default LedgerPage; 