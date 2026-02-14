
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { EditBiltyForm } from "@/components/bilty/edit-bilty-form"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { Bilty } from "@/lib/firestore"

export default async function EditBiltyPage({ params }: { params: { id: string } }) {
  const biltyId = params.id
  let bilty: Bilty | null = null

  try {
    const docRef = doc(db, "bilties", biltyId)
    const docSnap = await getDoc(docRef)
    if (docSnap.exists()) {
      const data = docSnap.data()
      bilty = {
        id: docSnap.id,
        ...data,
        biltyDate: data.biltyDate?.toDate?.() ? data.biltyDate.toDate() : data.biltyDate,
        createdAt: data.createdAt?.toDate?.() ? data.createdAt.toDate() : data.createdAt,
        // Ensure other potential Timestamps are converted if necessary
      } as Bilty
    }
  } catch (error) {
    console.error("Error fetching bilty:", error)
  }

  if (!bilty) {
    return (
      <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Bilty Not Found" subtitle="The requested bilty could not be found" />
          <main className="flex-1 p-6">
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Bilty Not Found</h2>
              <p className="text-gray-600">The bilty you're looking for doesn't exist or has been deleted.</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title={`Edit Bilty #${bilty.biltyNo || bilty.id}`} subtitle="Update bilty details" />
        <main className="flex-1 p-6">
          <EditBiltyForm bilty={bilty} />
        </main>
      </div>
    </div>
  )
}
