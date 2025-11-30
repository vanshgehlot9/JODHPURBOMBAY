"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { MessageCircle, Send, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function PaymentReminderForm() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: "",
    whatsappNumber: "",
    invoiceNumber: "",
    dueAmount: "",
    dueDate: "",
    reminderMessage: "Please clear your pending payment at the earliest. Thank you for your cooperation.",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/payment-reminder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok && result.waLink) {
        window.open(result.waLink, "_blank")
        toast({
          title: "Success",
          description: "WhatsApp reminder opened successfully!",
        })

        // Reset form
        setFormData({
          customerName: "",
          whatsappNumber: "",
          invoiceNumber: "",
          dueAmount: "",
          dueDate: "",
          reminderMessage: "Please clear your pending payment at the earliest. Thank you for your cooperation.",
        })
      } else {
        throw new Error(result.message || "Failed to send reminder")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send payment reminder. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      customerName: "",
      whatsappNumber: "",
      invoiceNumber: "",
      dueAmount: "",
      dueDate: "",
      reminderMessage: "Please clear your pending payment at the earliest. Thank you for your cooperation.",
    })
  }

  return (
    <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-indigo-50/30 to-transparent border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <MessageCircle className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold text-gray-900">Send Payment Reminder</CardTitle>
            <CardDescription className="text-gray-500">Send payment reminders to customers via WhatsApp</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Customer Details */}
          <div className="bg-gradient-to-br from-gray-50/80 to-indigo-50/30 p-6 rounded-xl border border-gray-200/50">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-gray-800">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <MessageCircle className="h-4 w-4 text-indigo-600" />
              </div>
              Customer Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                  Customer Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                  placeholder="Enter customer name"
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber" className="text-sm font-medium text-gray-700">
                  WhatsApp Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="whatsappNumber"
                  value={formData.whatsappNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="91XXXXXXXXXX"
                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-gradient-to-br from-gray-50/80 to-purple-50/30 p-6 rounded-xl border border-gray-200/50">
            <h3 className="text-base font-semibold mb-5 flex items-center gap-2 text-gray-800">
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Send className="h-4 w-4 text-purple-600" />
              </div>
              Payment Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-2">
                <Label htmlFor="invoiceNumber" className="text-sm font-medium text-gray-700">
                  Invoice Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="invoiceNumber"
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                  placeholder="INV-001"
                  className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueAmount" className="text-sm font-medium text-gray-700">
                  Due Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueAmount"
                  type="number"
                  step="0.01"
                  value={formData.dueAmount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueAmount: e.target.value }))}
                  placeholder="₹ 0.00"
                  className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-sm font-medium text-gray-700">
                  Due Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
                  className="focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="reminderMessage" className="text-sm font-medium text-gray-700">
              Reminder Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reminderMessage"
              value={formData.reminderMessage}
              onChange={(e) => setFormData((prev) => ({ ...prev, reminderMessage: e.target.value }))}
              placeholder="Enter your reminder message"
              rows={5}
              className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1">This message will be sent via WhatsApp to the customer</p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <Button type="button" variant="outline" onClick={handleReset} className="px-6">
              <X className="h-4 w-4 mr-2" />
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Reminder"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
