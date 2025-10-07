"use client";
import React, { useState, useEffect } from "react";
import { createChallan } from "@/lib/firestore";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";

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
    <div className="container mx-auto p-6 max-w-7xl">
      <Card>
        <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Loader2 className="h-6 w-6" />
            Create Challan
          </CardTitle>
          <CardDescription className="text-blue-50">
            Fill in the challan details below. Today's bilties are auto-loaded.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Basic Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="date" className="text-sm font-medium">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="truckNo" className="text-sm font-medium">Truck No. *</Label>
                  <Input
                    id="truckNo"
                    value={form.truckNo}
                    onChange={e => setForm(f => ({ ...f, truckNo: e.target.value.toUpperCase() }))}
                    placeholder="RJ04GA6778"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="truckOwnerName" className="text-sm font-medium">Owner Name *</Label>
                  <Input
                    id="truckOwnerName"
                    value={form.truckOwnerName}
                    onChange={e => setForm(f => ({ ...f, truckOwnerName: e.target.value }))}
                    placeholder="Owner name"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="from" className="text-sm font-medium">From *</Label>
                  <Input
                    id="from"
                    value={form.from}
                    onChange={e => setForm(f => ({ ...f, from: e.target.value }))}
                    placeholder="Jodhpur"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="to" className="text-sm font-medium">To *</Label>
                  <Input
                    id="to"
                    value={form.to}
                    onChange={e => setForm(f => ({ ...f, to: e.target.value }))}
                    placeholder="Mumbai"
                    required
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Bilty Items Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-blue-600 text-white p-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Bilty Items
                </h3>
                <Button
                  type="button"
                  onClick={addItem}
                  size="sm"
                  variant="secondary"
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  Add Row
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300">
                      <th className="p-2 text-xs font-semibold text-left border-r border-gray-300">Sr</th>
                      <th className="p-2 text-xs font-semibold text-left border-r border-gray-300">Bilty No</th>
                      <th className="p-2 text-xs font-semibold text-left border-r border-gray-300">Consignor</th>
                      <th className="p-2 text-xs font-semibold text-left border-r border-gray-300">Consignee</th>
                      <th className="p-2 text-xs font-semibold text-left border-r border-gray-300">Description</th>
                      <th className="p-2 text-xs font-semibold text-right border-r border-gray-300">Qty</th>
                      <th className="p-2 text-xs font-semibold text-right border-r border-gray-300">Weight</th>
                      <th className="p-2 text-xs font-semibold text-right border-r border-gray-300">Freight</th>
                      <th className="p-2 text-xs font-semibold text-right border-r border-gray-300">Rate</th>
                      <th className="p-2 text-xs font-semibold text-right border-r border-gray-300">Total</th>
                      <th className="p-2 text-xs font-semibold text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-2 text-sm text-center border-r border-gray-200">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            value={item.biltyNo}
                            onChange={e => handleBiltyNumberChange(idx, e.target.value)}
                            placeholder="15"
                            className="w-20 h-8 text-xs"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            value={item.consignorName || ""}
                            readOnly
                            className="w-32 h-8 text-xs bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            value={item.consigneeName || ""}
                            readOnly
                            className="w-32 h-8 text-xs bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            value={item.description || ""}
                            readOnly
                            className="w-36 h-8 text-xs bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            type="number"
                            value={item.quantity || 0}
                            readOnly
                            className="w-16 h-8 text-xs text-right bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            type="number"
                            value={item.weight || 0}
                            readOnly
                            className="w-20 h-8 text-xs text-right bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            type="number"
                            value={item.freight || 0}
                            readOnly
                            className="w-20 h-8 text-xs text-right bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            type="number"
                            value={item.rate || 0}
                            readOnly
                            className="w-20 h-8 text-xs text-right bg-gray-50"
                          />
                        </td>
                        <td className="p-2 border-r border-gray-200">
                          <Input
                            type="number"
                            value={item.total || 0}
                            readOnly
                            className="w-24 h-8 text-xs text-right font-semibold bg-gray-50"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            onClick={() => removeItem(idx)}
                            disabled={form.items.length === 1}
                            className="h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-blue-50 border-t-2 border-blue-600">
                      <td colSpan={9} className="p-3 text-right font-bold text-sm">
                        Total Freight:
                      </td>
                      <td colSpan={2} className="p-3 text-right font-bold text-lg text-blue-700">
                        Rs. {totalFreight.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Challan
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}