import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import Link from "next/link"

export default async function ViewSingleBiltyPage({ params }: { params: { id: string } }) {
  const biltyId = params.id
  let bilty = null
  try {
    const docRef = doc(db, "bilties", biltyId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      bilty = { id: docSnap.id, ...docSnap.data() }
    }
  } catch (error) {
    // handle error or show not found
  }

  if (!bilty) {
    return <div className="p-8">Bilty not found.</div>
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={`Bilty #${bilty.biltyNo || bilty.id}`} subtitle="View Bilty Details" />
        <main className="flex-1 p-6 space-y-4">
          <div className="bg-white rounded shadow p-6">
            <h2 className="text-xl font-bold mb-2">Bilty Details</h2>
            <div className="mb-2">Truck No: {bilty.truckNo}</div>
            <div className="mb-2">From: {bilty.from}</div>
            <div className="mb-2">To: {bilty.to}</div>
            <div className="mb-2">Consignor: {bilty.consignorName} ({bilty.consignorGst})</div>
            <div className="mb-2">Consignee: {bilty.consigneeName} ({bilty.consigneeGst})</div>
            <div className="mb-2">Transporter ID: {bilty.transporterId}</div>
            <div className="mb-2">Invoice No: {bilty.invoiceNo}</div>
            <div className="mb-2">Eway No: {bilty.ewayNo}</div>
            <div className="mb-2">Gross Value: {bilty.grossValue}</div>
            <div className="mb-2">Total Packages: {bilty.totalPackages}</div>
            <div className="mb-2">Special Instruction: {bilty.specialInstruction}</div>
            <div className="mb-2">Status: {bilty.status}</div>
            <h3 className="font-semibold mt-4">Items</h3>
            <table className="w-full border mt-2 mb-4">
              <thead>
                <tr>
                  <th>Qty</th><th>Description</th><th>HSN</th><th>Weight</th><th>Charged Weight</th><th>Rate</th>
                </tr>
              </thead>
              <tbody>
                {bilty.items && bilty.items.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.quantity}</td>
                    <td>{item.goodsDescription}</td>
                    <td>{item.hsnCode}</td>
                    <td>{item.weight}</td>
                    <td>{item.chargedWeight}</td>
                    <td>{item.rate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <h3 className="font-semibold mt-4">Charges</h3>
            <ul className="mb-4">
              <li>Freight: {bilty.charges?.freight}</li>
              <li>P.F.: {bilty.charges?.pf}</li>
              <li>L.C.: {bilty.charges?.lc}</li>
              <li>B.C.: {bilty.charges?.bc}</li>
              <li>Total: {bilty.charges?.total}</li>
              <li>CGST: {bilty.charges?.cgst}</li>
              <li>SGST: {bilty.charges?.sgst}</li>
              <li>IGST: {bilty.charges?.igst}</li>
              <li>Advance: {bilty.charges?.advance}</li>
              <li>Grand Total: {bilty.charges?.grandTotal}</li>
            </ul>
            <Link href={`/bilty/edit/${bilty.id}`}>
              <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded mr-2">Edit</button>
            </Link>
            <a
              href={`http://localhost:3000/api/bilty/${bilty.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <button className="mt-4 px-4 py-2 bg-green-600 text-white rounded mr-2">View PDF</button>
            </a>
            <button
              className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded"
              onClick={() => {
                const win = window.open(`http://localhost:3000/api/bilty/${bilty.id}/pdf`, '_blank');
                if (win) {
                  win.onload = () => win.print();
                }
              }}
            >
              Print PDF
            </button>
          </div>
        </main>
      </div>
    </div>
  )
} 