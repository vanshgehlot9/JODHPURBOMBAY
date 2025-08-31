import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CreateBiltyForm } from "@/components/bilty/create-bilty-form"

export default function CreateBiltyPage() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Create Bilty" subtitle="Generate a new bilty document" />
        <main className="flex-1 p-3 sm:p-6">
          <CreateBiltyForm />
        </main>
      </div>
    </div>
  )
}
