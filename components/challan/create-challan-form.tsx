"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Truck, MapPin, User, Save, Calendar, Search } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Define types for item and challanData
interface ChallanItem {
  biltyNo: string;
  consignorName?: string;
  consigneeName?: string;
  description?: string;
  quantity?: number;
  weight: number;
  freight: number;
  rate: number;
  total: number;
}

interface ChallanData {
  date: string;
  truckNo: string;
  truckOwnerName: string;
  from: string;
  to: string;
  items: ChallanItem[];
  totalFreight: number;
  [key: string]: any; // for type-safe dynamic access
}

const defaultItem: ChallanItem = {
  biltyNo: "",
  consignorName: "",
  consigneeName: "",
  description: "",
  quantity: 0,
  weight: 0,
  freight: 0,
  rate: 0,
  total: 0,
};

export default function CreateChallanForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    truckNo: "",
    truckOwnerName: "",
    from: "",
    to: "",
    items: [{ ...defaultItem }],
  });
  const [totalFreight, setTotalFreight] = useState(0);
  const [dateBiltyCount, setDateBiltyCount] = useState<number>(0);
  const [loadingBilties, setLoadingBilties] = useState(false);

  // Autocomplete states
  const [truckSuggestions, setTruckSuggestions] = useState<string[]>([]);
  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const truckDropdownRef = useRef<HTMLDivElement>(null);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const biltyFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions for autocomplete
  const fetchSuggestions = async (type: 'truck' | 'owner', searchTerm: string) => {
    if (searchTerm.length < 2) {
      if (type === 'truck') setTruckSuggestions([]);
      else setOwnerSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/bilty/suggestions?type=${type}&search=${encodeURIComponent(searchTerm)}`);
      if (response.ok) {
        const data = await response.json();
        if (type === 'truck') {
          setTruckSuggestions(data.suggestions || []);
          setShowTruckDropdown(true);
        } else {
          setOwnerSuggestions(data.suggestions || []);
          setShowOwnerDropdown(true);
        }
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  // Handle click outside for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (truckDropdownRef.current && !truckDropdownRef.current.contains(event.target as Node)) {
        setShowTruckDropdown(false);
      }
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setShowOwnerDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (biltyFetchTimeoutRef.current) {
        clearTimeout(biltyFetchTimeoutRef.current);
      }
    };
  }, []);

  // Fetch bilties by date - reusable function
  const fetchBiltiesByDate = async (selectedDate: string, autoPopulate: boolean = true) => {
    if (!selectedDate) return;

    setLoadingBilties(true);
    try {
      const response = await fetch('/api/bilty');
      if (response.ok) {
        const bilties = await response.json();

        // Filter bilties by selected date
        const filteredBilties = bilties.filter((bilty: any) => {
          const biltyDate = bilty.biltyDate?.toDate
            ? bilty.biltyDate.toDate().toISOString().split("T")[0]
            : new Date(bilty.biltyDate).toISOString().split("T")[0];
          return biltyDate === selectedDate;
        });

        // Update bilty count for selected date
        setDateBiltyCount(filteredBilties.length);

        if (autoPopulate && filteredBilties.length > 0) {
          // Auto-populate items with filtered bilties
          const autoItems = filteredBilties.map((bilty: any) => {
            const firstItem = bilty.items && bilty.items[0];
            return {
              biltyNo: bilty.biltyNo.toString(),
              consignorName: bilty.consignorName || "",
              consigneeName: bilty.consigneeName || "",
              description: firstItem?.goodsDescription || "",
              quantity: firstItem?.quantity || 0,
              weight: firstItem?.weight || 0,
              freight: bilty.charges?.freight || 0,
              rate: firstItem?.rate ? parseFloat(firstItem.rate) : 0,
              total: bilty.charges?.freight || 0,
            };
          });

          setForm(f => ({ ...f, items: autoItems }));

          // Calculate total freight
          const newTotal = autoItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
          setTotalFreight(newTotal);

          const dateLabel = selectedDate === new Date().toISOString().split("T")[0] ? "today" : selectedDate;
          toast({
            title: "Bilties Loaded",
            description: `Found ${filteredBilties.length} bilty(s) for ${dateLabel}`,
          });
        } else if (autoPopulate && filteredBilties.length === 0) {
          // Reset to default if no bilties found
          setForm(f => ({ ...f, items: [{ ...defaultItem }] }));
          setTotalFreight(0);
        }
      }
    } catch (error) {
      console.error("Error fetching bilties by date:", error);
    } finally {
      setLoadingBilties(false);
    }
  };

  // Handle date change - auto-detect bilties for selected date
  const handleDateChange = (newDate: string) => {
    setForm(f => ({ ...f, date: newDate }));
    fetchBiltiesByDate(newDate, true);
  };

  // Auto-fetch today's bilties when form loads
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    fetchBiltiesByDate(today, true);
  }, []);

  // Auto-fetch bilty details when bilty number is entered
  const fetchBiltyDetails = async (biltyNo: string, itemIndex: number) => {
    if (!biltyNo) return;

    try {
      // First try to get all bilties and find the matching one
      const response = await fetch('/api/bilty');
      if (response.ok) {
        const bilties = await response.json();
        const bilty = bilties.find((b: any) => b.biltyNo.toString() === biltyNo.toString());

        if (bilty) {
          const updated = [...form.items];
          // Get first item details if available
          const firstItem = bilty.items && bilty.items[0];

          updated[itemIndex] = {
            ...updated[itemIndex],
            biltyNo: biltyNo,
            consignorName: bilty.consignorName || "",
            consigneeName: bilty.consigneeName || "",
            description: firstItem?.goodsDescription || "",
            quantity: firstItem?.quantity || 0,
            weight: firstItem?.weight || 0,
            freight: bilty.charges?.freight || 0,
            rate: firstItem?.rate ? parseFloat(firstItem.rate) : 0,
            total: bilty.charges?.freight || 0,
          };

          setForm(f => ({ ...f, items: updated }));

          // Update total freight
          const newTotal = updated.reduce((sum, item) => sum + (item.total || 0), 0);
          setTotalFreight(newTotal);

          toast({
            title: "Bilty Details Loaded",
            description: `Successfully loaded details for bilty #${biltyNo}`,
          });
        } else {
          toast({
            title: "Bilty Not Found",
            description: `No bilty found with number ${biltyNo}`,
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching bilty details:", error);
      toast({
        title: "Error",
        description: "Failed to fetch bilty details",
        variant: "destructive",
      });
    }
  };

  // Update items in the form
  const updateItem = (idx: number, field: keyof ChallanItem, value: string | number) => {
    const items: ChallanItem[] = [...form.items];
    (items[idx][field] as string | number) = value;
    if (field === "weight" || field === "rate") {
      items[idx].total = Number(items[idx].weight) * Number(items[idx].rate);
    }
    setForm(f => ({ ...f, items }));
    setTotalFreight(items.reduce((sum, it) => sum + Number(it.total), 0));
  };

  // Add bilty number auto-fetch to updateItem with debouncing
  const handleBiltyNumberChange = (idx: number, biltyNo: string) => {
    updateItem(idx, "biltyNo", biltyNo);

    // Clear any pending timeout
    if (biltyFetchTimeoutRef.current) {
      clearTimeout(biltyFetchTimeoutRef.current);
    }

    // Only fetch if bilty number is not empty
    if (biltyNo.trim()) {
      // Debounce: wait 500ms after user stops typing before fetching
      biltyFetchTimeoutRef.current = setTimeout(() => {
        fetchBiltyDetails(biltyNo, idx);
      }, 500);
    }
  };

  // Reset form
  const handleReset = () => {
    setForm({
      date: new Date().toISOString().split("T")[0],
      truckNo: "",
      truckOwnerName: "",
      from: "",
      to: "",
      items: [{ ...defaultItem }],
    });
    setTotalFreight(0);
  };

  // Add new item
  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { ...defaultItem }] }));
  };

  // Remove item
  const removeItem = (index: number) => {
    const updated = form.items.filter((_, i) => i !== index);
    setForm(f => ({ ...f, items: updated }));
    const newTotal = updated.reduce((sum, item) => sum + (item.total || 0), 0);
    setTotalFreight(newTotal);
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!form.truckNo || !form.from || !form.to || !form.truckOwnerName) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate and clean items
      const validItems = form.items
        .filter(item => {
          return (
            item.biltyNo &&
            typeof item.freight === 'number' && !isNaN(item.freight) && item.freight !== null
          );
        })
        .map(item => ({
          biltyNo: String(item.biltyNo),
          consignorName: String(item.consignorName || ""),
          consigneeName: String(item.consigneeName || ""),
          description: String(item.description || ""),
          quantity: Number(item.quantity || 0),
          freight: Number(item.freight),
          weight: Number(item.weight),
          rate: Number(item.rate),
          total: Number(item.total),
        }));

      if (validItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one valid item.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const challanData: ChallanData = {
        date: form.date || new Date().toISOString().split("T")[0],
        truckNo: String(form.truckNo || ""),
        truckOwnerName: String(form.truckOwnerName || ""),
        from: String(form.from || ""),
        to: String(form.to || ""),
        items: validItems,
        totalFreight: Number(totalFreight) || 0,
      };

      const response = await fetch('/api/challan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create challan');
      }

      const result = await response.json();

      toast({
        title: "Success",
        description: `Challan #${result.challanNo} created successfully!`,
      });

      handleReset();
      router.push("/challan");
      router.refresh();
    } catch (err) {
      console.error("Error creating challan:", err);
      toast({
        title: "Error",
        description: "Failed to create challan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-8 pb-32">

      {/* Main Form Integrated Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">

        {/* Section 1: Manifest Details */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-5 w-5 text-indigo-900" />
            <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Manifest Details</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">

            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Date</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={form.date}
                  onChange={e => handleDateChange(e.target.value)}
                  className="font-medium border-gray-200 focus:border-indigo-500 bg-gray-50/50"
                />
                {dateBiltyCount > 0 && (
                  <div className="absolute -bottom-5 left-0 text-[10px] text-green-600 font-medium">
                    {dateBiltyCount} documents found
                  </div>
                )}
              </div>
            </div>

            {/* Truck No */}
            <div className="space-y-1.5 relative" ref={truckDropdownRef}>
              <Label className="text-xs font-bold text-gray-500 uppercase">Truck No</Label>
              <Input
                value={form.truckNo}
                onChange={e => {
                  const val = e.target.value.toUpperCase();
                  setForm(f => ({ ...f, truckNo: val }));
                  fetchSuggestions('truck', val);
                }}
                placeholder="RJ..."
                className="font-bold border-gray-200 focus:border-indigo-500"
              />
              {showTruckDropdown && truckSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {truckSuggestions.map((s, i) => (
                    <div key={i} onClick={() => { setForm(f => ({ ...f, truckNo: s })); setShowTruckDropdown(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer font-bold">{s}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Owner */}
            <div className="space-y-1.5 relative" ref={ownerDropdownRef}>
              <Label className="text-xs font-bold text-gray-500 uppercase">Owner</Label>
              <Input
                value={form.truckOwnerName}
                onChange={e => {
                  const val = e.target.value;
                  setForm(f => ({ ...f, truckOwnerName: val }));
                  fetchSuggestions('owner', val);
                }}
                placeholder="Name..."
                className="font-medium border-gray-200 focus:border-indigo-500"
              />
              {showOwnerDropdown && ownerSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-lg max-h-48 overflow-auto">
                  {ownerSuggestions.map((s, i) => (
                    <div key={i} onClick={() => { setForm(f => ({ ...f, truckOwnerName: s })); setShowOwnerDropdown(false); }} className="px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">{s}</div>
                  ))}
                </div>
              )}
            </div>

            {/* Route */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Origin</Label>
              <Input
                value={form.from}
                onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                placeholder="City..."
                className="font-medium border-gray-200 focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-gray-500 uppercase">Destination</Label>
              <Input
                value={form.to}
                onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                placeholder="City..."
                className="font-medium border-gray-200 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        <Separator className="bg-gray-100" />

        {/* Section 2: Consignment Details (Items) */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-indigo-900" />
              <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Consignment Details</h2>
            </div>
            <Button onClick={addItem} size="sm" variant="outline" className="text-indigo-900 border-indigo-200 hover:bg-indigo-50">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

// ... (previous code)

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-[80px_1.5fr_1.5fr_1.5fr_80px_80px_100px_40px] gap-0 bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              <div className="p-3 border-r border-gray-200">Bilty #</div>
              <div className="p-3 border-r border-gray-200">Consignor</div>
              <div className="p-3 border-r border-gray-200">Consignee</div>
              <div className="p-3 border-r border-gray-200">Description</div>
              <div className="p-3 text-right border-r border-gray-200">Quantity</div>
              <div className="p-3 text-right border-r border-gray-200">Weight</div>
              <div className="p-3 text-right border-r border-gray-200">Freight</div>
              <div className="p-3"></div>
            </div>

            <div className="divide-y divide-gray-100 bg-white">
              {form.items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-[80px_1.5fr_1.5fr_1.5fr_80px_80px_100px_40px] gap-0 group items-stretch">
                  <div className="p-2 border-r border-gray-100">
                    <Input
                      value={item.biltyNo}
                      onChange={e => handleBiltyNumberChange(idx, e.target.value)}
                      className="h-8 font-mono font-bold text-indigo-900 border-gray-200 focus:border-indigo-500 px-2 text-center"
                      placeholder="#"
                    />
                  </div>
                  <div className="p-2 border-r border-gray-100 flex items-center">
                    <span className="text-xs text-gray-700 truncate px-1">{item.consignorName || "—"}</span>
                  </div>
                  <div className="p-2 border-r border-gray-100 flex items-center">
                    <span className="text-xs text-gray-700 truncate px-1">{item.consigneeName || "—"}</span>
                  </div>
                  <div className="p-2 border-r border-gray-100 flex items-center">
                    <span className="text-xs text-gray-600 truncate px-1">{item.description || "—"}</span>
                  </div>
                  <div className="p-2 border-r border-gray-100">
                    <Input
                      type="number"
                      value={item.quantity || 0}
                      onChange={e => updateItem(idx, "quantity", Number(e.target.value))}
                      className="h-8 text-right border-transparent hover:border-gray-200 focus:border-indigo-500 px-1 bg-transparent text-gray-900 font-medium"
                    />
                  </div>
                  <div className="p-2 border-r border-gray-100">
                    <Input
                      type="number"
                      value={item.weight || 0}
                      onChange={e => updateItem(idx, "weight", Number(e.target.value))}
                      className="h-8 text-right border-transparent hover:border-gray-200 focus:border-indigo-500 px-1 bg-transparent text-gray-900 font-medium"
                    />
                  </div>
                  <div className="p-2 border-r border-gray-100">
                    <Input
                      type="number"
                      value={item.freight || 0}
                      onChange={e => updateItem(idx, "freight", Number(e.target.value))}
                      className="h-8 text-right font-bold text-gray-900 bg-gray-50/50 border-transparent px-1 focus:border-indigo-500"
                    />
                  </div>
                  <div className="p-2 flex items-center justify-center">
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-gray-300 hover:text-red-500 transition-colors"
                      disabled={form.items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

// ... (rest of code)

          {/* Footer Summary */}
          <div className="flex justify-end pt-4">
            <div className="bg-gray-50 px-6 py-4 rounded-lg flex items-center gap-6 border border-gray-100">
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Weight</div>
                <div className="text-lg font-bold text-gray-900">{form.items.reduce((acc, i) => acc + (Number(i.weight) || 0), 0)} kg</div>
              </div>
              <div className="h-10 w-px bg-gray-200"></div>
              <div className="text-right">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Freight</div>
                <div className="text-2xl font-bold text-indigo-900">₹ {totalFreight.toLocaleString('en-IN')}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Footer Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-50 md:pl-72">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {form.items.length} consignment(s) added
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleReset} className="text-gray-500 hover:text-gray-900">
              Reset
            </Button>
            <Button onClick={handleSubmit} disabled={loading} className="bg-indigo-900 text-white hover:bg-indigo-800 min-w-[160px]">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Creating..." : "Generate Manifest"}
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}