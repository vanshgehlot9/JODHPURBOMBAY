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
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Send Payment Reminder
        </CardTitle>
        <CardDescription>Send payment reminders to customers via WhatsApp</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div>
              <Label htmlFor="whatsappNumber">WhatsApp Number</Label>
              <Input
                id="whatsappNumber"
                value={formData.whatsappNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                placeholder="91XXXXXXXXXX"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="invoiceNumber">Invoice Number</Label>
              <Input
                id="invoiceNumber"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                placeholder="Enter invoice number"
                required
              />
            </div>
            <div>
              <Label htmlFor="dueAmount">Due Amount</Label>
              <Input
                id="dueAmount"
                type="number"
                step="0.01"
                value={formData.dueAmount}
                onChange={(e) => setFormData((prev) => ({ ...prev, dueAmount: e.target.value }))}
                placeholder="Enter due amount"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="reminderMessage">Reminder Message</Label>
            <Textarea
              id="reminderMessage"
              value={formData.reminderMessage}
              onChange={(e) => setFormData((prev) => ({ ...prev, reminderMessage: e.target.value }))}
              placeholder="Enter your reminder message"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={handleReset}>
              <X className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button type="submit" disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Sending..." : "Send Reminder"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
