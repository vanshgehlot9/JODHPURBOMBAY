"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, Truck, MapPin, User, Save } from "lucide-react";

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
  id?: string;
  challanNo?: number;
  date: string;
  truckNo: string;
  truckOwnerName: string;
  from: string;
  to: string;
  items: ChallanItem[];
  totalFreight: number;
  [key: string]: any;
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

interface EditChallanFormProps {
  challan: ChallanData;
}

export default function EditChallanForm({ challan }: EditChallanFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Initialize form with challan data
  const [form, setForm] = useState({
    date: challan.date ? new Date(challan.date).toISOString().split("T")[0] : new Date().toISOString().split("T")[0],
    truckNo: challan.truckNo || "",
    truckOwnerName: challan.truckOwnerName || "",
    from: challan.from || "",
    to: challan.to || "",
    items: challan.items?.length > 0 ? challan.items : [{ ...defaultItem }],
  });
  const [totalFreight, setTotalFreight] = useState(challan.totalFreight || 0);
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

  // Calculate total freight when items change
  useEffect(() => {
    const newTotal = form.items.reduce((sum, item) => sum + (item.total || 0), 0);
    setTotalFreight(newTotal);
  }, [form.items]);

  // Initial bilty count fetch for the challan date
  useEffect(() => {
    if (form.date) {
      fetchBiltiesByDate(form.date);
    }
  }, []);

  // Fetch bilties by date - for count display only (no auto-populate in edit mode)
  const fetchBiltiesByDate = async (selectedDate: string) => {
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
      }
    } catch (error) {
      console.error("Error fetching bilties by date:", error);
    } finally {
      setLoadingBilties(false);
    }
  };

  // Handle date change - detect bilties for selected date
  const handleDateChange = (newDate: string) => {
    setForm(f => ({ ...f, date: newDate }));
    fetchBiltiesByDate(newDate);
  };

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

  // Auto-fetch bilty details when bilty number is entered
  const fetchBiltyDetails = async (biltyNo: string, itemIndex: number) => {
    if (!biltyNo) return;

    try {
      const response = await fetch('/api/bilty');
      if (response.ok) {
        const bilties = await response.json();
        const bilty = bilties.find((b: any) => b.biltyNo.toString() === biltyNo.toString());

        if (bilty) {
          const updated = [...form.items];
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

          toast({
            title: "Bilty Details Loaded",
            description: `Successfully loaded details for bilty #${biltyNo}`,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching bilty details:", error);
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
  };

  // Handle bilty number change with auto-fetch and debouncing
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

  // Add new item
  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { ...defaultItem }] }));
  };

  // Remove item
  const removeItem = (index: number) => {
    const updated = form.items.filter((_, i) => i !== index);
    setForm(f => ({ ...f, items: updated.length > 0 ? updated : [{ ...defaultItem }] }));
  };

  // Submit handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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
        .filter(item => item.biltyNo)
        .map(item => ({
          biltyNo: String(item.biltyNo),
          consignorName: String(item.consignorName || ""),
          consigneeName: String(item.consigneeName || ""),
          description: String(item.description || ""),
          quantity: Number(item.quantity || 0),
          freight: Number(item.freight || 0),
          weight: Number(item.weight || 0),
          rate: Number(item.rate || 0),
          total: Number(item.total || 0),
        }));

      if (validItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one valid item with bilty number.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const challanData = {
        date: form.date || new Date().toISOString().split("T")[0],
        truckNo: String(form.truckNo || ""),
        truckOwnerName: String(form.truckOwnerName || ""),
        from: String(form.from || ""),
        to: String(form.to || ""),
        items: validItems,
        totalFreight: Number(totalFreight) || 0,
      };

      const response = await fetch(`/api/challan/${challan.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(challanData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update challan');
      }

      toast({
        title: "Success",
        description: "Challan updated successfully!",
      });

      router.push('/challan');
      router.refresh();
    } catch (error) {
      console.error("Error updating challan:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update challan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Edit Challan #{challan.challanNo}
          </CardTitle>
          <CardDescription>
            Update the challan details below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => handleDateChange(e.target.value)}
                required
              />
              {/* Bilty count indicator */}
              <div className="flex items-center gap-2">
                {loadingBilties ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Detecting...</span>
                  </div>
                ) : (
                  <div className={`text-xs font-medium px-2 py-0.5 rounded-full ${dateBiltyCount > 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                    }`}>
                    {dateBiltyCount} bilty(s) on this date
                  </div>
                )}
              </div>
            </div>

            {/* Truck Number */}
            <div className="space-y-2 relative" ref={truckDropdownRef}>
              <Label htmlFor="truckNo">Truck Number *</Label>
              <Input
                id="truckNo"
                placeholder="Enter truck number"
                value={form.truckNo}
                onChange={(e) => {
                  setForm(f => ({ ...f, truckNo: e.target.value.toUpperCase() }));
                  fetchSuggestions('truck', e.target.value);
                }}
                onFocus={() => form.truckNo.length >= 2 && setShowTruckDropdown(true)}
                required
              />
              {showTruckDropdown && truckSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {truckSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setForm(f => ({ ...f, truckNo: suggestion }));
                        setShowTruckDropdown(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Truck Owner Name */}
            <div className="space-y-2 relative" ref={ownerDropdownRef}>
              <Label htmlFor="truckOwnerName">Truck Owner Name *</Label>
              <Input
                id="truckOwnerName"
                placeholder="Enter owner name"
                value={form.truckOwnerName}
                onChange={(e) => {
                  setForm(f => ({ ...f, truckOwnerName: e.target.value }));
                  fetchSuggestions('owner', e.target.value);
                }}
                onFocus={() => form.truckOwnerName.length >= 2 && setShowOwnerDropdown(true)}
                required
              />
              {showOwnerDropdown && ownerSuggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {ownerSuggestions.map((suggestion, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => {
                        setForm(f => ({ ...f, truckOwnerName: suggestion }));
                        setShowOwnerDropdown(false);
                      }}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* From / To */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="from" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> From *
              </Label>
              <Input
                id="from"
                placeholder="Origin location"
                value={form.from}
                onChange={(e) => setForm(f => ({ ...f, from: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to" className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> To *
              </Label>
              <Input
                id="to"
                placeholder="Destination location"
                value={form.to}
                onChange={(e) => setForm(f => ({ ...f, to: e.target.value }))}
                required
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Bilty Items</CardTitle>
              <CardDescription>Update items included in this challan</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem}>
              <Plus className="h-4 w-4 mr-1" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
// ... (previous code)

          <div className="space-y-4">
            {form.items.map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 bg-gray-50/50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium text-sm text-gray-700">Item #{idx + 1}</h4>
                  {form.items.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => removeItem(idx)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Bilty No *</Label>
                    <Input
                      placeholder="Bilty #"
                      value={item.biltyNo}
                      onChange={(e) => handleBiltyNumberChange(idx, e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Consignor</Label>
                    <Input
                      placeholder="Consignor"
                      value={item.consignorName || ""}
                      onChange={(e) => updateItem(idx, "consignorName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Consignee</Label>
                    <Input
                      placeholder="Consignee"
                      value={item.consigneeName || ""}
                      onChange={(e) => updateItem(idx, "consigneeName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Description</Label>
                    <Input
                      placeholder="Desc"
                      value={item.description || ""}
                      onChange={(e) => updateItem(idx, "description", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity || 0}
                      onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Weight</Label>
                    <Input
                      type="number"
                      placeholder="Weight"
                      value={item.weight || 0}
                      onChange={(e) => updateItem(idx, "weight", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Total</Label>
                    <Input
                      type="number"
                      placeholder="Total"
                      value={item.total || 0}
                      onChange={(e) => updateItem(idx, "total", parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

// ... (rest of code)

          {/* Total Freight */}
          <div className="mt-4 pt-4 border-t flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Freight</p>
              <p className="text-2xl font-bold text-green-600">
                ₹{totalFreight.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Updating...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Update Challan
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
