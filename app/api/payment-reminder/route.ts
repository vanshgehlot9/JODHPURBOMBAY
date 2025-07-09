import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { customerName, whatsappNumber, invoiceNumber, dueAmount, dueDate, reminderMessage } = await request.json()

    if (!customerName || !whatsappNumber || !invoiceNumber || !dueAmount || !dueDate || !reminderMessage) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 })
    }

    // Format WhatsApp number (remove non-digits, ensure country code)
    let number = whatsappNumber.replace(/\D/g, "")
    if (!number.startsWith("91") && number.length === 10) {
      number = "91" + number // Default to India country code
    }

    // Compose message
    const message =
      `Dear ${customerName},%0A` +
      `This is a payment reminder for Invoice No: ${invoiceNumber}.%0A` +
      `Due Amount: ₹${dueAmount}%0A` +
      `Due Date: ${dueDate}%0A` +
      `${reminderMessage}%0A` +
      `- Jodhpur Bombay Road Carrier`

    // WhatsApp Click-to-Chat link
    const waLink = `https://wa.me/${number}?text=${message}`

    return NextResponse.json({ waLink })
  } catch (error) {
    console.error("Error sending payment reminder:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
