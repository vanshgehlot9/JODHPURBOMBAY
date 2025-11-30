import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ExportForm } from "@/components/export/export-form"

export default function ExportPage() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Export Data" subtitle="Export bilty data to Excel format" />
        <main className="flex-1 p-6">
          <ExportForm />
        </main>
      </div>
    </div>
  )
}
