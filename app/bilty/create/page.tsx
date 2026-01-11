"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { CreateBiltyForm } from "@/components/bilty/create-bilty-form"
import { BulkBiltyImport } from "@/components/bilty/bulk-import"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload } from "lucide-react"

export default function CreateBiltyPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-10 relative">
          <Tabs defaultValue="single" className="w-full space-y-6">
            <div className="flex justify-end mb-4">
              <TabsList className="bg-white border border-gray-200 shadow-sm">
                <TabsTrigger value="single" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Single Bilty
                </TabsTrigger>
                <TabsTrigger value="bulk" className="px-4 py-2 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Import
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="single" className="m-0 focus-visible:ring-0 outline-none">
              <CreateBiltyForm />
            </TabsContent>

            <TabsContent value="bulk" className="m-0 focus-visible:ring-0 outline-none">
              <div className="max-w-5xl mx-auto bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Bulk Import</h2>
                  <p className="text-sm text-gray-500">Upload multiple bilties via Excel/CSV</p>
                </div>
                <BulkBiltyImport />
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
