import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ViewBiltiesTable } from "@/components/bilty/view-bilties-table"

export default function ViewBiltiesPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="View Bilties" subtitle="Manage and view all bilty documents" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <ViewBiltiesTable />
        </main>
      </div>
    </div>
  )
}
