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

  // Autocomplete states
  const [truckSuggestions, setTruckSuggestions] = useState<string[]>([]);
  const [showTruckDropdown, setShowTruckDropdown] = useState(false);
  const [ownerSuggestions, setOwnerSuggestions] = useState<string[]>([]);
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false);
  const truckDropdownRef = useRef<HTMLDivElement>(null);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);

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

  // Auto-fetch today's bilties when form loads
  useEffect(() => {
    const fetchTodaysBilties = async () => {
      try {
        const response = await fetch('/api/bilty');
        if (response.ok) {
          const bilties = await response.json();

          // Get today's date in YYYY-MM-DD format
          const today = new Date().toISOString().split("T")[0];

          // Filter bilties created today
          const todaysBilties = bilties.filter((bilty: any) => {
            const biltyDate = bilty.biltyDate?.toDate
              ? bilty.biltyDate.toDate().toISOString().split("T")[0]
              : new Date(bilty.biltyDate).toISOString().split("T")[0];
            return biltyDate === today;
          });

          if (todaysBilties.length > 0) {
            // Auto-populate items with today's bilties
            const autoItems = todaysBilties.map((bilty: any) => {
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

            toast({
              title: "Today's Bilties Loaded",
              description: `Automatically loaded ${todaysBilties.length} bilty(s) created today`,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching today's bilties:", error);
      }
    };

    fetchTodaysBilties();
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

  // Add bilty number auto-fetch to updateItem
  const handleBiltyNumberChange = (idx: number, biltyNo: string) => {
    updateItem(idx, "biltyNo", biltyNo);
    if (biltyNo.trim()) {
      fetchBiltyDetails(biltyNo, idx);
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
        .filter(item => {
          return (
            item.biltyNo &&
            typeof item.freight === 'number' && !isNaN(item.freight) && item.freight !== null &&
            typeof item.weight === 'number' && !isNaN(item.weight) && item.weight !== null &&
            typeof item.rate === 'number' && !isNaN(item.rate) && item.rate !== null &&
            typeof item.total === 'number' && !isNaN(item.total) && item.total !== null
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

      if (validItems.length !== form.items.length) {
        toast({
          title: "Validation Error",
          description: "One or more items are invalid. Please check all item fields.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (validItems.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one valid item with all fields filled.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Clean main form fields
      const challanData: ChallanData = {
        date: form.date || new Date().toISOString().split("T")[0],
        truckNo: String(form.truckNo || ""),
        truckOwnerName: String(form.truckOwnerName || ""),
        from: String(form.from || ""),
        to: String(form.to || ""),
        items: validItems,
        totalFreight: Number(totalFreight) || 0,
      };

      // Use API endpoint instead of direct Firestore call
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
      router.push("/");
    } catch (err) {
      console.error("Error creating challan:", err);
      toast({
        title: "Error",
        description: "Failed to create challan: " + String((err as any)?.message || err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (

    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Delivery Challan</h1>
            <p className="text-gray-600">Fill in the challan details below. Today's bilties are auto-loaded.</p>
          </div>
          <Button
            variant="outline"
            onClick={() => router.push("/challan")}
            className="hover:bg-indigo-50 border-indigo-200 text-indigo-700"
          >
            <Truck className="mr-2 h-4 w-4" />
            View Challans
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Details Section */}
        <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-indigo-50/50 to-transparent border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MapPin className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Basic Details</CardTitle>
                <CardDescription>Route and transport information</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-sm font-semibold text-gray-700">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  required
                  className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
                />
              </div>

              <div className="space-y-2" ref={truckDropdownRef}>
                <Label htmlFor="truckNo" className="text-sm font-semibold text-gray-700">
                  Truck Number <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="truckNo"
                    value={form.truckNo}
                    onChange={e => {
                      const value = e.target.value.toUpperCase();
                      setForm(f => ({ ...f, truckNo: value }));
                      fetchSuggestions('truck', value);
                    }}
                    placeholder="e.g., RJ14GA1234"
                    required
                    className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
                  />
                  {showTruckDropdown && truckSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-auto ring-1 ring-black/5">
                      {truckSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-50 last:border-b-0 flex items-center gap-3 transition-colors"
                          onClick={() => {
                            setForm(f => ({ ...f, truckNo: suggestion }));
                            setShowTruckDropdown(false);
                          }}
                        >
                          <Truck className="h-4 w-4 text-indigo-600" />
                          <span className="font-medium text-gray-900 font-mono">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2" ref={ownerDropdownRef}>
                <Label htmlFor="truckOwnerName" className="text-sm font-semibold text-gray-700">
                  Owner Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="truckOwnerName"
                    value={form.truckOwnerName}
                    onChange={e => {
                      const value = e.target.value;
                      setForm(f => ({ ...f, truckOwnerName: value }));
                      fetchSuggestions('owner', value);
                    }}
                    placeholder="Owner name"
                    required
                    className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
                  />
                  {showOwnerDropdown && ownerSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-2xl max-h-60 overflow-auto ring-1 ring-black/5">
                      {ownerSuggestions.map((suggestion, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-indigo-50 focus:bg-indigo-50 focus:outline-none border-b border-gray-50 last:border-b-0 flex items-center gap-3 transition-colors"
                          onClick={() => {
                            setForm(f => ({ ...f, truckOwnerName: suggestion }));
                            setShowOwnerDropdown(false);
                          }}
                        >
                          <User className="h-4 w-4 text-indigo-600" />
                          <span className="font-medium text-gray-900">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="from" className="text-sm font-semibold text-gray-700">
                  From <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="from"
                  value={form.from}
                  onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                  placeholder="Origin city"
                  required
                  className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="to" className="text-sm font-semibold text-gray-700">
                  To <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="to"
                  value={form.to}
                  onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                  placeholder="Destination city"
                  required
                  className="h-11 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bilty Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Plus className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Bilty Items</h2>
                <p className="text-gray-500 text-sm">Add bilty items to this challan</p>
              </div>
            </div>
            <Button
              type="button"
              onClick={addItem}
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-200"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </div>

          <div className="space-y-4">
            {form.items.map((item, idx) => (
              <Card key={idx} className="shadow-sm border border-gray-200 hover:border-purple-200 transition-colors bg-white/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Item #{idx + 1}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length === 1}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Row 1 */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Bilty No</Label>
                      <Input
                        value={item.biltyNo}
                        onChange={e => handleBiltyNumberChange(idx, e.target.value)}
                        placeholder="15"
                        className="h-9 font-mono focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="md:col-span-5 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Consignor</Label>
                      <Input
                        value={item.consignorName || ""}
                        readOnly
                        className="h-9 bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>
                    <div className="md:col-span-5 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Consignee</Label>
                      <Input
                        value={item.consigneeName || ""}
                        readOnly
                        className="h-9 bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>

                    {/* Row 2 */}
                    <div className="md:col-span-12 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Description</Label>
                      <Input
                        value={item.description || ""}
                        readOnly
                        className="h-9 bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>

                    {/* Row 3 */}
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Qty</Label>
                      <Input
                        type="number"
                        value={item.quantity || 0}
                        readOnly
                        className="h-9 text-right bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Weight</Label>
                      <Input
                        type="number"
                        value={item.weight || 0}
                        readOnly
                        className="h-9 text-right bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Freight</Label>
                      <Input
                        type="number"
                        value={item.freight || 0}
                        readOnly
                        className="h-9 text-right bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Rate</Label>
                      <Input
                        type="number"
                        value={item.rate || 0}
                        readOnly
                        className="h-9 text-right bg-gray-50 border-gray-200 text-gray-600"
                      />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                      <Label className="text-xs font-medium text-gray-500">Total</Label>
                      <Input
                        type="number"
                        value={item.total || 0}
                        readOnly
                        className="h-9 text-right font-bold text-gray-900 bg-purple-50/50 border-purple-100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Total Freight Summary */}
          <Card className="bg-purple-50/50 border-purple-100">
            <CardContent className="p-6 flex items-center justify-between">
              <span className="font-bold text-gray-700 uppercase tracking-wide">Total Freight</span>
              <span className="font-bold text-2xl text-purple-700">₹ {totalFreight.toFixed(2)}</span>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={loading}
            className="px-6 h-12 border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900"
          >
            Reset Form
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="px-8 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Creating Challan...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Create Challan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}