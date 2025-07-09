import React from "react";
import CreateChallanForm from "@/components/challan/create-challan-form";

export default function CreateChallanPage() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Create Challan</h1>
        <div className="bg-white rounded shadow p-8 w-full max-w-2xl">
          <CreateChallanForm />
        </div>
      </div>
    </div>
  );
} 