'use client';
import React, { useEffect, useState } from 'react';

interface Payment {
  id?: string;
  date: string;
  partyName: string;
  amount: number;
  particulars: string;
}

const PaymentsPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    date: '',
    partyName: '',
    amount: '',
    particulars: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchPayments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/payments');
      if (!res.ok) throw new Error('Failed to fetch payments');
      const data = await res.json();
      setPayments(data);
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });
      if (!res.ok) throw new Error('Failed to add payment');
      setForm({ date: '', partyName: '', amount: '', particulars: '' });
      fetchPayments();
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Payments</h1>
      <form className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4" onSubmit={handleSubmit}>
        <input
          type="date"
          name="date"
          className="border rounded px-2 py-1"
          value={form.date}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="partyName"
          className="border rounded px-2 py-1"
          placeholder="Party Name"
          value={form.partyName}
          onChange={handleChange}
          required
        />
        <input
          type="number"
          name="amount"
          className="border rounded px-2 py-1"
          placeholder="Amount"
          value={form.amount}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="particulars"
          className="border rounded px-2 py-1"
          placeholder="Particulars"
          value={form.particulars}
          onChange={handleChange}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-1 rounded col-span-1 md:col-span-4"
          disabled={submitting}
        >
          {submitting ? 'Adding...' : 'Add Payment'}
        </button>
      </form>
      {loading ? (
        <div className="mb-4 text-blue-600">Loading payments...</div>
      ) : error ? (
        <div className="mb-4 text-red-600">{error}</div>
      ) : payments.length === 0 ? (
        <div className="mb-4 text-gray-500">No payments found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Party Name</th>
                <th className="px-4 py-2 border">Amount</th>
                <th className="px-4 py-2 border">Particulars</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p, idx) => (
                <tr key={p.id || idx}>
                  <td className="px-4 py-2 border">{p.date ? new Date(p.date).toLocaleDateString() : ''}</td>
                  <td className="px-4 py-2 border">{p.partyName}</td>
                  <td className="px-4 py-2 border text-right">₹{p.amount.toFixed(2)}</td>
                  <td className="px-4 py-2 border">{p.particulars}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PaymentsPage; 