'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const STATEMENT_TYPES = [
  'Client Statement',
  'Cartage Paid Bilty',
  'Receipt List',
  'Delivery Receipt (GST-wise)',
  'Cash Delivery',
  'Party Report',
];

interface StatementRow {
  date: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

interface StatementSummary {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

const StatementPage = () => {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState(STATEMENT_TYPES[0]);
  const [party, setParty] = useState('');
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const router = useRouter();

  const fetchStatement = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (type) params.append('type', type);
      if (party) params.append('party', party);
      const res = await fetch(`/api/statement?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch statement');
      const data = await res.json();
      setRows(
        (data.data || []).map((row: any) => ({
          ...row,
          date: row.date ? new Date(row.date).toLocaleDateString() : '',
        }))
      );
      setSummary(data.summary);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchStatement();
    // eslint-disable-next-line
  }, [from, to, type, party]);

  const handleCancel = () => {
    router.push('/');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = async () => {
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (type) params.append('type', type);
      if (party) params.append('party', party);
      const res = await fetch(`/api/statement/export?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to export statement');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'statement.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'Failed to export statement');
    }
  };

  const handleExportPDF = async () => {
    if (typeof window === 'undefined') return;
    const jsPDF = (await import('jspdf')).default;
    const doc = new jsPDF();
    doc.text('Statement', 10, 10);
    let y = 20;
    doc.text(['Date', 'Particulars', 'Debit', 'Credit', 'Balance'].join(' | '), 10, y);
    y += 8;
    rows.forEach((row) => {
      doc.text([
        row.date,
        row.particulars,
        row.debit ? `₹${row.debit.toFixed(2)}` : '',
        row.credit ? `₹${row.credit.toFixed(2)}` : '',
        `₹${row.balance.toFixed(2)}`
      ].join(' | '), 10, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
    y += 8;
    doc.text(`Total Debit: ₹${summary?.totalDebit.toFixed(2) || '0.00'}`, 10, y);
    y += 8;
    doc.text(`Total Credit: ₹${summary?.totalCredit.toFixed(2) || '0.00'}`, 10, y);
    y += 8;
    doc.text(`Net Balance: ₹${summary?.netBalance.toFixed(2) || '0.00'}`, 10, y);
    doc.save('statement.pdf');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Statement</h1>
        <button
          className="bg-gray-500 text-white px-4 py-1 rounded"
          onClick={handleCancel}
        >
          Cancel
        </button>
      </div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={from}
          onChange={e => setFrom(e.target.value)}
          placeholder="From Date"
        />
        <input
          type="date"
          className="border rounded px-2 py-1"
          value={to}
          onChange={e => setTo(e.target.value)}
          placeholder="To Date"
        />
        <input
          type="text"
          className="border rounded px-2 py-1"
          value={party}
          onChange={e => setParty(e.target.value)}
          placeholder="Party (optional)"
        />
        {/* Statement Type Tabs */}
        <div className="flex gap-2">
          {STATEMENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`px-3 py-1 rounded border ${type === t ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => setType(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      {/* Export/Print Dropdown */}
      <div className="mb-4 flex gap-2 print:hidden relative">
        <button
          className="bg-green-600 text-white px-4 py-1 rounded"
          onClick={() => setExportOpen((v) => !v)}
          type="button"
        >
          Export ▼
        </button>
        {exportOpen && (
          <div className="absolute z-20 bg-white border rounded shadow mt-10 left-0 min-w-[120px]">
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => { setExportOpen(false); handleExportExcel(); }}
              type="button"
            >
              Excel
            </button>
            <button
              className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              onClick={() => { setExportOpen(false); handleExportPDF(); }}
              type="button"
            >
              PDF
            </button>
          </div>
        )}
        <button
          className="bg-gray-700 text-white px-4 py-1 rounded"
          onClick={handlePrint}
        >
          Print
        </button>
      </div>
      {/* Loading/Error/Empty */}
      {loading ? (
        <div className="mb-4">
          <div className="animate-pulse h-8 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="animate-pulse h-8 bg-gray-200 rounded w-full mb-2" />
          <div className="animate-pulse h-8 bg-gray-200 rounded w-full mb-2" />
        </div>
      ) : error ? (
        <div className="mb-4 text-red-600">{error}</div>
      ) : rows.length === 0 ? (
        <div className="mb-4 text-gray-500 flex flex-col items-center">
          <span className="text-4xl mb-2">📄</span>
          No data found for the selected filters.
        </div>
      ) : null}
      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Date</th>
              <th className="px-4 py-2 border">Particulars</th>
              <th className="px-4 py-2 border">Debit</th>
              <th className="px-4 py-2 border">Credit</th>
              <th className="px-4 py-2 border">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx}>
                <td className="px-4 py-2 border">{row.date}</td>
                <td className="px-4 py-2 border">{row.particulars}</td>
                <td className="px-4 py-2 border text-right">{row.debit ? `₹${row.debit.toFixed(2)}` : ''}</td>
                <td className="px-4 py-2 border text-right">{row.credit ? `₹${row.credit.toFixed(2)}` : ''}</td>
                <td className="px-4 py-2 border text-right">₹{row.balance.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Summary Totals */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Total Debit</div>
          <div className="font-bold">₹{summary ? summary.totalDebit.toFixed(2) : '0.00'}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Total Credit</div>
          <div className="font-bold">₹{summary ? summary.totalCredit.toFixed(2) : '0.00'}</div>
        </div>
        <div className="bg-gray-50 p-4 rounded shadow">
          <div className="text-gray-500">Net Balance</div>
          <div className="font-bold">₹{summary ? summary.netBalance.toFixed(2) : '0.00'}</div>
        </div>
      </div>
    </div>
  );
};

export default StatementPage;
