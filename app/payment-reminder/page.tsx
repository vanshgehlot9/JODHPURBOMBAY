"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PaymentReminderForm } from "@/components/payment/payment-reminder-form"

export default function PaymentReminderPage() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Payment Reminders" subtitle="Manage payment reminders" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8">
          <PaymentReminderForm />
        </main>
      </div>
    </div>
  )
}
