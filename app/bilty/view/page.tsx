import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ViewBiltiesTable } from "@/components/bilty/view-bilties-table"

export default function ViewBiltiesPage() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="View Bilties" subtitle="Manage and view all bilty documents" />
        <main className="flex-1 p-6">
          <ViewBiltiesTable />
        </main>
      </div>
    </div>
  )
}
