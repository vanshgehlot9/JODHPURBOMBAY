import React, { Suspense } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

async function fetchChallan(id: string) {
  const docRef = doc(db, "challans", id);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() };
}

async function ChallanView({ id }: { id: string }) {
  const challan = await fetchChallan(id);
  if (!challan) return <div className="p-8">Challan not found.</div>;
  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <h1 className="text-2xl font-bold mb-6">Challan #{challan.challanNo}</h1>
      <div className="bg-white rounded shadow p-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div><b>Date:</b> {challan.date}</div>
          <div><b>Truck No.:</b> {challan.truckNo}</div>
          <div><b>From:</b> {challan.from}</div>
          <div><b>To:</b> {challan.to}</div>
          <div><b>Owner Name:</b> {challan.ownerName}</div>
          <div><b>License No.:</b> {challan.licenseNo}</div>
          <div><b>Cash/Due:</b> {challan.cashOrDue}</div>
        </div>
        <div className="mb-4">
          <b>Transport Name:</b> {challan.transportName} <br />
          <b>Commission:</b> {challan.commission} <br />
          <b>Payment Mode:</b> {challan.paymentMode}
        </div>
        <div className="mb-4">
          <b>Items:</b>
          <table className="w-full border mt-2 mb-4">
            <thead>
              <tr>
                <th>S.No</th>
                <th>Bilty No.</th>
                <th>Freight</th>
                <th>Weight</th>
                <th>Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {challan.items && challan.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.biltyNo}</td>
                  <td>{item.freight}</td>
                  <td>{item.weight}</td>
                  <td>{item.rate}</td>
                  <td>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex justify-between mt-4">
          <div><b>Total Freight:</b> {challan.totalFreight}</div>
          <div><b>Total Commission:</b> {challan.totalCommission}</div>
        </div>
      </div>
    </div>
  );
}

export default function ChallanViewPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div className="p-8">Loading...</div>}>
      {/* @ts-expect-error Async Server Component */}
      <ChallanView id={params.id} />
    </Suspense>
  );
} 