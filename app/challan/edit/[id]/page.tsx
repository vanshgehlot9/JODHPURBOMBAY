"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import EditChallanForm from "@/components/challan/edit-challan-form";
import { Loader2 } from "lucide-react";

export default function EditChallanPage({ params }: { params: { id: string } }) {
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChallan = async () => {
      try {
        const response = await fetch(`/api/challan/${params.id}`);
        
        if (!response.ok) {
          throw new Error("Challan not found");
        }
        
        const data = await response.json();
        
        // Convert Firestore timestamp to date string if needed
        if (data.date?.seconds) {
          data.date = new Date(data.date.seconds * 1000).toISOString().split("T")[0];
        } else if (data.date && typeof data.date === "string") {
          data.date = new Date(data.date).toISOString().split("T")[0];
        }
        
        setChallan(data);
      } catch (err) {
        console.error("Error fetching challan:", err);
        setError(err instanceof Error ? err.message : "Failed to load challan");
      } finally {
        setLoading(false);
      }
    };

    fetchChallan();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Edit Challan" subtitle="Loading challan details..." />
          <main className="flex-1 p-6 flex items-center justify-center">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading challan...</span>
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !challan) {
    return (
      <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Challan Not Found" subtitle="The requested challan could not be found" />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Challan Not Found</h2>
              <p className="text-gray-600">{error || "The challan you're looking for doesn't exist or has been deleted."}</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header 
          title={`Edit Challan #${challan.challanNo || challan.id}`} 
          subtitle="Update challan details" 
        />
        <main className="flex-1 p-3 sm:p-6">
          <EditChallanForm challan={challan} />
        </main>
      </div>
    </div>
  );
}
