import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { customerName, whatsappNumber, invoiceNumber, dueAmount, dueDate, reminderMessage } = await request.json()

    // Only customerName, whatsappNumber, dueAmount, and reminderMessage are strictly required
    if (!customerName || !whatsappNumber || !dueAmount || !reminderMessage) {
      return NextResponse.json({ message: "Customer Name, WhatsApp Number, Due Amount, and Message are required." }, { status: 400 })
    }

    // Format WhatsApp number (remove non-digits, ensure country code)
    let number = whatsappNumber.replace(/\D/g, "")
    if (!number.startsWith("91") && number.length === 10) {
      number = "91" + number // Default to India country code
    }

    // Compose message
    let message =
      `Dear ${customerName},%0A%0A` +
      `This is a payment reminder.%0A` +
      `${reminderMessage}%0A%0A`

    if (invoiceNumber) {
      message += `Invoice Ref: ${invoiceNumber}%0A`
    }
    if (dueDate) {
      message += `Due Date: ${dueDate}%0A`
    }
    message += `Due Amount: ₹${Number(dueAmount).toLocaleString('en-IN')}%0A%0A`
    message += `- Jodhpur Bombay Road Carrier`

    // WhatsApp Click-to-Chat link
    const waLink = `https://wa.me/${number}?text=${message}`

    return NextResponse.json({ waLink })
  } catch (error) {
    console.error("Error sending payment reminder:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
