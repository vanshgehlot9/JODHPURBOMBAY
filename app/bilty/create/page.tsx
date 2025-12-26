"use client"

import { useState } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { CreateBiltyForm } from "@/components/bilty/create-bilty-form"
import { BulkBiltyImport } from "@/components/bilty/bulk-import"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Upload } from "lucide-react"

export default function CreateBiltyPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Create Bilty" subtitle="Generate a new transport document" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Single Bilty
              </TabsTrigger>
              <TabsTrigger value="bulk" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Bulk Import
              </TabsTrigger>
            </TabsList>
            <TabsContent value="single" className="mt-6">
              <CreateBiltyForm />
            </TabsContent>
            <TabsContent value="bulk" className="mt-6">
              <BulkBiltyImport />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
