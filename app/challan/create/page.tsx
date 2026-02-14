"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import CreateChallanForm from "@/components/challan/create-challan-form"

export default function CreateChallanPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Create Challan" subtitle="Generate delivery challan documents" />
        <main className="flex-1 p-3 sm:p-6">
          <CreateChallanForm />
        </main>
      </div>
    </div>
  )
} 