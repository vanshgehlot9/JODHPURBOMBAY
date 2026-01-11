"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PaymentReminderForm } from "@/components/payment/payment-reminder-form"
import { ScheduledReminderPanel } from "@/components/payment/scheduled-reminder-panel"
import { ReminderHistoryPanel } from "@/components/payment/reminder-history-panel"
import { BulkReminderPanel } from "@/components/payment/bulk-reminder-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calculator, CalendarClock, History, Layers } from "lucide-react"

export default function PaymentReminderPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50 text-slate-900 font-body">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Payment Control" subtitle="Reminders & Collections Automation" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8">

          <Tabs defaultValue="manual" className="w-full space-y-6">
            <div className="flex items-center justify-between overflow-x-auto pb-2">
              <TabsList className="bg-white border border-slate-200 p-1 h-12 rounded-xl shadow-sm min-w-max">
                <TabsTrigger value="manual" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 h-10 transition-all">
                  <Calculator className="w-4 h-4 mr-2" /> Manual
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 h-10 transition-all">
                  <CalendarClock className="w-4 h-4 mr-2" /> Scheduled
                </TabsTrigger>
                <TabsTrigger value="bulk" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 h-10 transition-all">
                  <Layers className="w-4 h-4 mr-2" /> Bulk Ops
                </TabsTrigger>
                <TabsTrigger value="history" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700 rounded-lg px-4 h-10 transition-all">
                  <History className="w-4 h-4 mr-2" /> Logs
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="manual" className="focus-visible:outline-none animate-in fade-in-50 duration-500">
              <PaymentReminderForm />
            </TabsContent>

            <TabsContent value="scheduled" className="focus-visible:outline-none animate-in fade-in-50 duration-500">
              <ScheduledReminderPanel />
            </TabsContent>

            <TabsContent value="bulk" className="focus-visible:outline-none animate-in fade-in-50 duration-500">
              <BulkReminderPanel />
            </TabsContent>

            <TabsContent value="history" className="focus-visible:outline-none animate-in fade-in-50 duration-500">
              <ReminderHistoryPanel />
            </TabsContent>
          </Tabs>

        </main>
      </div>
    </div>
  )
}
