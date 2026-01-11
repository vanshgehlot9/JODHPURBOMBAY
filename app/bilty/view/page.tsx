import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { ViewBiltiesTable } from "@/components/bilty/view-bilties-table"

export default function ViewBiltiesPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Bilty Registry" subtitle="Active and archived transport documents" />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <ViewBiltiesTable />
        </main>
      </div>
    </div>
  )
}
