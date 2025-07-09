import { NextRequest } from "next/server";
import PDFDocument from "pdfkit";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app as firebaseApp } from "@/lib/firebase";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const biltyId = params.id;
  const db = getFirestore(firebaseApp);
  const biltyRef = doc(db, "bilties", biltyId);
  const biltySnap = await getDoc(biltyRef);

  if (!biltySnap.exists()) {
    return new Response("Bilty not found", { status: 404 });
  }

  const bilty = biltySnap.data();

  // Path to the custom font
  const fontPath = path.join(process.cwd(), "jbrc_fixed_ui_and_css", "public", "fonts", "NotoSansDevanagari-Regular.ttf");
  if (!fs.existsSync(fontPath)) {
    return new Response("Font file not found", { status: 500 });
  }

  // Generate PDF using pdfkit
  const docPdf = new PDFDocument({ font: fontPath });
  let buffers: Buffer[] = [];
  docPdf.on("data", buffers.push.bind(buffers));
  docPdf.registerFont("Custom", fontPath);
  docPdf.font("Custom").fontSize(20).text(`Bilty #${bilty.biltyNo}`, { align: "center" });
  docPdf.moveDown();
  docPdf.font("Custom").fontSize(12).text(`Truck No: ${bilty.truckNo}`);
  docPdf.font("Custom").text(`From: ${bilty.from}`);
  docPdf.font("Custom").text(`To: ${bilty.to}`);
  docPdf.font("Custom").text(`Consignor: ${bilty.consignorName}`);
  docPdf.font("Custom").text(`Consignee: ${bilty.consigneeName}`);
  docPdf.font("Custom").text(`Date: ${bilty.biltyDate}`);
  // Add more fields as needed, always using .font("Custom")
  docPdf.end();

  await new Promise((resolve) => docPdf.on("end", resolve));
  const pdfBuffer = Buffer.concat(buffers);

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline; filename=bilty.pdf",
    },
  });
} 