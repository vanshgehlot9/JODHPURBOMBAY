import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { PaymentReminderForm } from "@/components/payment/payment-reminder-form"

export default function PaymentReminderPage() {
  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Payment Reminder" subtitle="Send payment reminders via WhatsApp" />
        <main className="flex-1 p-6">
          <PaymentReminderForm />
        </main>
      </div>
    </div>
  )
}
