import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { redirect } from "next/navigation"
import { Bilty } from "@/lib/firestore"

export default async function EditBiltyPage({ params }: { params: { id: string } }) {
  const biltyId = params.id
  let bilty: Bilty | null = null
  try {
    const docRef = doc(db, "bilties", biltyId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      bilty = { id: docSnap.id, ...docSnap.data() } as Bilty
    }
  } catch (error) {
    // handle error or show not found
  }

  if (!bilty) {
    return <div className="p-8">Bilty not found.</div>
  }

  // This is a simplified form. You can expand it as needed.
  async function handleEdit(formData: FormData) {
    "use server"
    const truckNo = formData.get("truckNo") as string
    const from = formData.get("from") as string
    const to = formData.get("to") as string
    const consignorName = formData.get("consignorName") as string
    const consignorGst = formData.get("consignorGst") as string
    const consigneeName = formData.get("consigneeName") as string
    const consigneeGst = formData.get("consigneeGst") as string
    const transporterId = formData.get("transporterId") as string
    const invoiceNo = formData.get("invoiceNo") as string
    const ewayNo = formData.get("ewayNo") as string
    const ewayDate = formData.get("ewayDate") as string
    const grossValue = formData.get("grossValue") as string
    const totalPackages = formData.get("totalPackages") as string
    const specialInstruction = formData.get("specialInstruction") as string
    
    await updateDoc(doc(db, "bilties", biltyId), {
      truckNo,
      from,
      to,
      consignorName,
      consignorGst,
      consigneeName,
      consigneeGst,
      transporterId,
      invoiceNo,
      ewayNo,
      ewayDate,
      grossValue: grossValue ? Number(grossValue) : 0,
      totalPackages,
      specialInstruction,
    })
    redirect(`/bilty/view/${biltyId}`)
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={`Edit Bilty #${bilty.biltyNo || bilty.id}`} subtitle="Edit Bilty Details" />
        <main className="flex-1 p-6 space-y-4">
          <form action={handleEdit} className="bg-white rounded shadow p-6 space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Truck No</label>
                <input name="truckNo" defaultValue={bilty.truckNo} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">From</label>
                <input name="from" defaultValue={bilty.from} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">To</label>
                <input name="to" defaultValue={bilty.to} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Consignor Name</label>
                <input name="consignorName" defaultValue={bilty.consignorName} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Consignor GST</label>
                <input name="consignorGst" defaultValue={bilty.consignorGst} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Consignee Name</label>
                <input name="consigneeName" defaultValue={bilty.consigneeName} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Consignee GST</label>
                <input name="consigneeGst" defaultValue={bilty.consigneeGst} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Transporter ID</label>
                <input name="transporterId" defaultValue={bilty.transporterId} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Invoice No</label>
                <input name="invoiceNo" defaultValue={bilty.invoiceNo} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Eway No</label>
                <input name="ewayNo" defaultValue={bilty.ewayNo} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Eway Date</label>
                <input name="ewayDate" type="date" defaultValue={bilty.ewayDate} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Gross Value</label>
                <input name="grossValue" type="number" defaultValue={bilty.grossValue} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label className="block mb-1 font-medium">Total Packages</label>
                <input name="totalPackages" defaultValue={bilty.totalPackages} className="border rounded px-2 py-1 w-full" />
              </div>
              <div className="md:col-span-2">
                <label className="block mb-1 font-medium">Special Instruction</label>
                <input name="specialInstruction" defaultValue={bilty.specialInstruction} className="border rounded px-2 py-1 w-full" />
              </div>
            </div>
            <h3 className="font-semibold mt-4">Items</h3>
            <table className="w-full border mb-4">
              <thead>
                <tr>
                  <th>Qty</th><th>Description</th><th>HSN</th><th>Weight</th><th>Charged Weight</th><th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {bilty.items && bilty.items.map((item, idx) => (
                  <tr key={idx}>
                    <td><input name={`item_quantity_${idx}`} defaultValue={item.quantity} className="border rounded px-2 py-1 w-16" /></td>
                    <td><input name={`item_goodsDescription_${idx}`} defaultValue={item.goodsDescription} className="border rounded px-2 py-1 w-32" /></td>
                    <td><input name={`item_hsnCode_${idx}`} defaultValue={item.hsnCode} className="border rounded px-2 py-1 w-20" /></td>
                    <td><input name={`item_weight_${idx}`} defaultValue={item.weight} className="border rounded px-2 py-1 w-20" /></td>
                    <td><input name={`item_chargedWeight_${idx}`} defaultValue={item.chargedWeight} className="border rounded px-2 py-1 w-20" /></td>
                    <td><input name={`item_rate_${idx}`} defaultValue={item.rate} className="border rounded px-2 py-1 w-20" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="font-semibold mt-4">Charges</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label>Freight</label>
                <input name="freight" type="number" defaultValue={bilty.charges?.freight} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>P.F.</label>
                <input name="pf" type="number" defaultValue={bilty.charges?.pf} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>L.C.</label>
                <input name="lc" type="number" defaultValue={bilty.charges?.lc} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>B.C.</label>
                <input name="bc" type="number" defaultValue={bilty.charges?.bc} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Total</label>
                <input name="total" type="number" defaultValue={bilty.charges?.total} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>CGST</label>
                <input name="cgst" type="number" defaultValue={bilty.charges?.cgst} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>SGST</label>
                <input name="sgst" type="number" defaultValue={bilty.charges?.sgst} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>IGST</label>
                <input name="igst" type="number" defaultValue={bilty.charges?.igst} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Advance</label>
                <input name="advance" type="number" defaultValue={bilty.charges?.advance} className="border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label>Grand Total</label>
                <input name="grandTotal" type="number" defaultValue={bilty.charges?.grandTotal} className="border rounded px-2 py-1 w-full" />
              </div>
            </div>
            <button type="submit" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Save Changes</button>
          </form>
        </main>
      </div>
    </div>
  )
} 