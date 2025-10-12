import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  increment,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore"
import { db } from "./firebase"

export interface Party {
  id?: string
  name: string
  gstin: string
  type?: 'consignor' | 'consignee' | 'both'
  address?: string
  contactPerson?: string
  phone?: string
  email?: string
  createdAt: Date | Timestamp
  updatedAt: Date | Timestamp
}

export interface BiltyItem {
  quantity: number
  goodsDescription: string
  hsnCode: string
  weight: number
  chargedWeight: number
  rate: string
}

export interface BiltyCharges {
  freight: number
  pf: number
  lc: number
  bc: number
  total: number
  cgst: number
  sgst: number
  igst: number
  advance: number
  grandTotal: number
}

export interface Bilty {
  id?: string
  biltyNo: number
  biltyDate: Date | Timestamp
  truckNo: string
  from: string
  to: string
  consignorName: string
  consignorGst?: string
  consigneeName: string
  consigneeGst?: string
  transporterId?: string
  invoiceNo?: string
  ewayNo?: string
  ewayDate?: string
  grossValue?: number
  items: BiltyItem[]
  charges: BiltyCharges
  specialInstruction?: string
  totalPackages?: string
  status?: string
  createdAt: Date | Timestamp
}

// Get next bilty number
export async function getNextBiltyNumber(): Promise<number> {
  const counterRef = doc(db, "counters", "biltyNo")
  const counterDoc = await getDoc(counterRef)

  if (!counterDoc.exists()) {
    // Initialize counter if it doesn't exist
    await updateDoc(counterRef, { value: 1 })
    return 1
  }

  const currentValue = counterDoc.data().value || 0
  const nextValue = currentValue + 1

  await updateDoc(counterRef, { value: increment(1) })
  return nextValue
}

// Create a new bilty
export async function createBilty(
  biltyData: Omit<Bilty, "id" | "biltyNo" | "createdAt">,
): Promise<{ id: string; biltyNo: number }> {
  const biltyNo = await getNextBiltyNumber()

  const newBilty = {
    ...biltyData,
    biltyNo,
    createdAt: serverTimestamp(),
    status: biltyData.status || "pending",
  }

  const docRef = await addDoc(collection(db, "bilties"), newBilty)
  return { id: docRef.id, biltyNo }
}

// Get all bilties with optional filters
export async function getBilties(filters?: {
  search?: string
  status?: string
  dateFrom?: Date
  dateTo?: Date
  limit?: number
}): Promise<Bilty[]> {
  let q = query(collection(db, "bilties"))

  // Apply status filter first if provided
  if (filters?.status) {
    q = query(q, where("status", "==", filters.status))
  }

  // Apply date range filter if provided
  if (filters?.dateFrom && filters?.dateTo) {
    q = query(q, where("biltyDate", ">=", filters.dateFrom), where("biltyDate", "<=", filters.dateTo), orderBy("biltyDate", "desc"))
  } else {
    // Only order by createdAt if no date range filter is applied
    q = query(q, orderBy("createdAt", "desc"))
  }

  if (filters?.limit) {
    q = query(q, limit(filters.limit))
  }

  const querySnapshot = await getDocs(q)
  const bilties = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Bilty[]

  // Client-side search filtering (Firestore doesn't support full-text search)
  if (filters?.search) {
    const searchTerm = filters.search.toLowerCase()
    return bilties.filter(
      (bilty) =>
        bilty.biltyNo.toString().includes(searchTerm) ||
        bilty.consignorName.toLowerCase().includes(searchTerm) ||
        bilty.consigneeName.toLowerCase().includes(searchTerm) ||
        bilty.from.toLowerCase().includes(searchTerm) ||
        bilty.to.toLowerCase().includes(searchTerm),
    )
  }

  return bilties
}

// Get a single bilty by ID
export async function getBiltyById(id: string): Promise<Bilty | null> {
  const docRef = doc(db, "bilties", id)
  const docSnap = await getDoc(docRef)

  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as Bilty
  }

  return null
}

// Update a bilty
export async function updateBilty(id: string, updates: Partial<Bilty>): Promise<void> {
  const docRef = doc(db, "bilties", id)
  await updateDoc(docRef, updates)
}

// Delete a bilty
export async function deleteBilty(id: string): Promise<void> {
  const docRef = doc(db, "bilties", id)
  await deleteDoc(docRef)
}

// Delete a challan
export async function deleteChallan(id: string): Promise<void> {
  const docRef = doc(db, "challans", id)
  await deleteDoc(docRef)
}

// Get dashboard stats
export async function getDashboardStats() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const last7Days = new Date(today)
  last7Days.setDate(today.getDate() - 7)

  const last30Days = new Date(today)
  last30Days.setDate(today.getDate() - 30)

  const last90Days = new Date(today)
  last90Days.setDate(today.getDate() - 90)

  // Get all bilties (in a real app, you'd want to optimize this)
  const allBilties = await getBilties()

  const todaySales = allBilties.filter((bilty) => {
    const biltyDate = bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)
    return biltyDate >= today
  }).length

  const last7DaysSales = allBilties.filter((bilty) => {
    const biltyDate = bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)
    return biltyDate >= last7Days
  }).length

  const last30DaysSales = allBilties.filter((bilty) => {
    const biltyDate = bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)
    return biltyDate >= last30Days
  }).length

  const last90DaysSales = allBilties.filter((bilty) => {
    const biltyDate = bilty.biltyDate instanceof Timestamp ? bilty.biltyDate.toDate() : new Date(bilty.biltyDate)
    return biltyDate >= last90Days
  }).length

  return {
    todaySales,
    last7Days: last7DaysSales,
    last30Days: last30DaysSales,
    last90Days: last90DaysSales,
  }
}

// Get recent bilties for dashboard
export async function getRecentBilties(limitCount = 5): Promise<Bilty[]> {
  return getBilties({ limit: limitCount })
}

// Get next challan number
export async function getNextChallanNumber(): Promise<number> {
  const counterRef = doc(db, "counters", "challanNo");
  const counterDoc = await getDoc(counterRef);

  if (!counterDoc.exists()) {
    await setDoc(counterRef, { value: 1 });
    return 1;
  }

  const currentValue = counterDoc.data().value || 0;
  const nextValue = currentValue + 1;
  await updateDoc(counterRef, { value: increment(1) });
  return nextValue;
}

// Get a single challan by ID
export async function getChallan(id: string): Promise<any | null> {
  const docRef = doc(db, "challans", id);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
}

// Create a new challan
export async function createChallan(
  challanData: Omit<any, "id" | "challanNo" | "createdAt">,
): Promise<{ id: string; challanNo: number }> {
  const challanNo = await getNextChallanNumber();
  const newChallan = {
    ...challanData,
    challanNo,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, "challans"), newChallan);
  return { id: docRef.id, challanNo };
}

// Get all challans
export async function getAllChallans(): Promise<any[]> {
  try {
    const q = query(collection(db, "challans"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching challans:", error);
    throw error;
  }
}

// ============ PARTY MANAGEMENT ============

// Create a new party
export async function createParty(
  partyData: Omit<Party, "id" | "createdAt" | "updatedAt">
): Promise<string> {
  // Filter out undefined values
  const cleanedData: any = {
    name: partyData.name,
    gstin: partyData.gstin,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  // Only add optional fields if they have values
  if (partyData.type) cleanedData.type = partyData.type;
  if (partyData.address) cleanedData.address = partyData.address;
  if (partyData.contactPerson) cleanedData.contactPerson = partyData.contactPerson;
  if (partyData.phone) cleanedData.phone = partyData.phone;
  if (partyData.email) cleanedData.email = partyData.email;
  
  const docRef = await addDoc(collection(db, "parties"), cleanedData);
  return docRef.id;
}

// Get all parties
export async function getAllParties(): Promise<Party[]> {
  try {
    const q = query(collection(db, "parties"), orderBy("name", "asc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Party[];
  } catch (error) {
    console.error("Error fetching parties:", error);
    throw error;
  }
}

// Get party by ID
export async function getPartyById(id: string): Promise<Party | null> {
  try {
    const docRef = doc(db, "parties", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Party;
    }
    return null;
  } catch (error) {
    console.error("Error fetching party:", error);
    return null;
  }
}

// Search parties by name or GSTIN
export async function searchParties(searchTerm: string): Promise<Party[]> {
  try {
    const partiesRef = collection(db, "parties");
    const snapshot = await getDocs(partiesRef);
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Party))
      .filter(party => 
        party.name.toLowerCase().includes(searchLower) ||
        party.gstin.toLowerCase().includes(searchLower)
      );
    
    return filtered;
  } catch (error) {
    console.error("Error searching parties:", error);
    return [];
  }
}

// Update party
export async function updateParty(id: string, partyData: Partial<Party>): Promise<void> {
  const partyRef = doc(db, "parties", id);
  await updateDoc(partyRef, {
    ...partyData,
    updatedAt: serverTimestamp(),
  });
}

// Delete party
export async function deleteParty(id: string): Promise<void> {
  const partyRef = doc(db, "parties", id);
  await deleteDoc(partyRef);
}
