"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function ChallanListPage() {
  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchChallans() {
      const q = query(collection(db, "challans"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      setChallans(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchChallans();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <h1 className="text-2xl font-bold mb-6">Challan List</h1>
      <div className="bg-white rounded shadow p-6">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="w-full border">
            <thead>
              <tr>
                <th>Challan No.</th>
                <th>Date</th>
                <th>Truck No.</th>
                <th>From</th>
                <th>To</th>
                <th>Owner</th>
                <th>Total Freight</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {challans.map((challan) => (
                <tr key={challan.id}>
                  <td>{challan.challanNo}</td>
                  <td>{challan.date}</td>
                  <td>{challan.truckNo}</td>
                  <td>{challan.from}</td>
                  <td>{challan.to}</td>
                  <td>{challan.ownerName}</td>
                  <td>{challan.totalFreight}</td>
                  <td>
                    <Link href={`/challan/view/${challan.id}`} className="text-blue-600 underline">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="mt-6">
        <Link href="/challan/create">
          <button className="px-4 py-2 bg-green-600 text-white rounded">Create New Challan</button>
        </Link>
      </div>
    </div>
  );
} 