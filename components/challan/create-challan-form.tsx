"use client";
import React, { useState } from "react";
import { createChallan } from "@/lib/firestore";
import { useRouter } from "next/navigation";

const defaultItem = { biltyNo: "", freight: 0, weight: 0, rate: 0, total: 0 };

// Define types for item and challanData
interface ChallanItem {
  biltyNo: string;
  freight: number;
  weight: number;
  rate: number;
  total: number;
}

interface ChallanData {
  date: string;
  truckNo: string;
  from: string;
  to: string;
  ownerName: string;
  licenseNo: string;
  cashOrDue: string;
  transportName: string;
  commission: number;
  paymentMode: string;
  items: ChallanItem[];
  totalFreight: number;
  totalCommission: number;
  [key: string]: any; // for type-safe dynamic access
}

export default function CreateChallanForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    truckNo: "",
    from: "",
    to: "",
    ownerName: "",
    licenseNo: "",
    cashOrDue: "Cash",
    transportName: "",
    commission: 0,
    paymentMode: "Cash",
    items: [{ ...defaultItem }],
  });
  const [totalFreight, setTotalFreight] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);

  // Dynamic item row handlers
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { ...defaultItem }] }));
  const removeItem = (idx: number) => setForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: keyof ChallanItem, value: string | number) => {
    const items: ChallanItem[] = [...form.items];
    (items[idx][field] as string | number) = value;
    if (field === "weight" || field === "rate") {
      items[idx].total = Number(items[idx].weight) * Number(items[idx].rate);
    }
    setForm(f => ({ ...f, items }));
    setTotalFreight(items.reduce((sum, it) => sum + Number(it.total), 0));
  };

  // Update commission and totals
  const handleCommission = (val: number) => {
    setForm(f => ({ ...f, commission: val }));
    setTotalCommission(val);
  };

  // Reset form
  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      truckNo: "",
      from: "",
      to: "",
      ownerName: "",
      licenseNo: "",
      cashOrDue: "Cash",
      transportName: "",
      commission: 0,
      paymentMode: "Cash",
      items: [{ ...defaultItem }],
    });
    setTotalFreight(0);
    setTotalCommission(0);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Deep clean and validate items
      const validItems: ChallanItem[] = form.items
        .filter(item => {
          return (
            typeof item.biltyNo === 'string' && item.biltyNo.trim() !== '' &&
            typeof item.freight === 'number' && !isNaN(item.freight) && item.freight !== null &&
            typeof item.weight === 'number' && !isNaN(item.weight) && item.weight !== null &&
            typeof item.rate === 'number' && !isNaN(item.rate) && item.rate !== null &&
            typeof item.total === 'number' && !isNaN(item.total) && item.total !== null
          );
        })
        .map(item => ({
          biltyNo: String(item.biltyNo),
          freight: Number(item.freight),
          weight: Number(item.weight),
          rate: Number(item.rate),
          total: Number(item.total),
        }));

      if (validItems.length !== form.items.length) {
        alert("One or more items are invalid. Please check all item fields and try again.");
        setLoading(false);
        return;
      }

      if (validItems.length === 0) {
        alert("Please add at least one valid item with all fields filled.");
        setLoading(false);
        return;
      }

      // Clean main form fields
      const challanData: ChallanData = {
        date: form.date || new Date().toISOString().split("T")[0],
        truckNo: String(form.truckNo || ""),
        from: String(form.from || ""),
        to: String(form.to || ""),
        ownerName: String(form.ownerName || ""),
        licenseNo: String(form.licenseNo || ""),
        cashOrDue: String(form.cashOrDue || "Cash"),
        transportName: String(form.transportName || ""),
        commission: Number(form.commission) || 0,
        paymentMode: String(form.paymentMode || "Cash"),
        items: validItems,
        totalFreight: Number(totalFreight) || 0,
        totalCommission: Number(totalCommission) || 0,
      };

      // Remove any undefined or NaN values (type-safe)
      (Object.keys(challanData) as (keyof ChallanData)[]).forEach(key => {
        const value = challanData[key];
        if (value === undefined || (typeof value === 'number' && isNaN(value))) {
          (challanData as any)[key] = null;
        }
      });

      // Log the actual data being sent to Firestore for debugging
      console.log("REAL SUBMIT DATA:", challanData);

      await createChallan(challanData);
      handleReset();
      alert("Challan created successfully!");
      router.push("/challan/create");
    } catch (err) {
      console.error("Firestore error details:", err);
      alert("Failed to create challan: " + String((err as any)?.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label>Date</label>
          <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>Truck Number</label>
          <input value={form.truckNo} onChange={e => setForm(f => ({ ...f, truckNo: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>From (City)</label>
          <input value={form.from} onChange={e => setForm(f => ({ ...f, from: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>To (City)</label>
          <input value={form.to} onChange={e => setForm(f => ({ ...f, to: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>Owner Name</label>
          <input value={form.ownerName} onChange={e => setForm(f => ({ ...f, ownerName: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>License Number</label>
          <input value={form.licenseNo} onChange={e => setForm(f => ({ ...f, licenseNo: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>Cash / Due</label>
          <select value={form.cashOrDue} onChange={e => setForm(f => ({ ...f, cashOrDue: e.target.value }))} className="border rounded px-2 py-1 w-full">
            <option value="Cash">Cash</option>
            <option value="Due">Due</option>
          </select>
        </div>
      </div>
      <hr />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label>Transport Name</label>
          <input value={form.transportName} onChange={e => setForm(f => ({ ...f, transportName: e.target.value }))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>Commission</label>
          <input type="number" value={form.commission} onChange={e => handleCommission(Number(e.target.value))} required className="border rounded px-2 py-1 w-full" />
        </div>
        <div>
          <label>Payment Mode</label>
          <select value={form.paymentMode} onChange={e => setForm(f => ({ ...f, paymentMode: e.target.value }))} className="border rounded px-2 py-1 w-full">
            <option value="Cash">Cash</option>
            <option value="Bank">Bank</option>
            <option value="UPI">UPI</option>
          </select>
        </div>
      </div>
      <hr />
      <div>
        <label className="font-bold">Items</label>
        <table className="w-full border mt-2 mb-4">
          <thead>
            <tr>
              <th>S.No</th>
              <th>Bilty No.</th>
              <th>Freight</th>
              <th>Weight</th>
              <th>Rate</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {form.items.map((item, idx) => (
              <tr key={idx}>
                <td>{idx + 1}</td>
                <td><input value={item.biltyNo} onChange={e => updateItem(idx, "biltyNo", e.target.value)} className="border rounded px-2 py-1 w-20" /></td>
                <td><input type="number" value={item.freight} onChange={e => updateItem(idx, "freight", Number(e.target.value))} className="border rounded px-2 py-1 w-20" /></td>
                <td><input type="number" value={item.weight} onChange={e => updateItem(idx, "weight", Number(e.target.value))} className="border rounded px-2 py-1 w-20" /></td>
                <td><input type="number" value={item.rate} onChange={e => updateItem(idx, "rate", Number(e.target.value))} className="border rounded px-2 py-1 w-20" /></td>
                <td>{item.total}</td>
                <td>{form.items.length > 1 && <button type="button" onClick={() => removeItem(idx)} className="text-red-600">Remove</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <button type="button" onClick={addItem} className="px-3 py-1 bg-blue-500 text-white rounded">Add Item</button>
      </div>
      <div className="flex justify-between mt-4">
        <div><b>Total Freight:</b> {totalFreight}</div>
        <div><b>Total Commission:</b> {totalCommission}</div>
      </div>
      <div className="flex gap-4 mt-6">
        <button type="submit" disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">{loading ? "Submitting..." : "Submit"}</button>
        <button type="button" onClick={handleReset} className="px-4 py-2 bg-gray-400 text-white rounded">Reset</button>
        <button type="button" onClick={() => router.push("/")} className="px-4 py-2 bg-red-600 text-white rounded">Cancel</button>
      </div>
    </form>
  );
} 