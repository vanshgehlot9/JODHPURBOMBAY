"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Send, Smartphone, RefreshCcw, User, Receipt, Phone, Loader2, CheckCheck, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  date: string;
  voucherType: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

export function PaymentReminderForm() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [detecting, setDetecting] = useState(false);

  // Autocomplete State
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    customerName: "",
    whatsappNumber: "",
    invoiceNumber: "",
    dueAmount: "",
    dueDate: "",
    reminderMessage: "Please clear your pending payment at the earliest. Thank you for your cooperation.",
  });

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (term: string) => {
    if (term.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const response = await fetch(`/api/bilty/suggestions?type=consignor&search=${encodeURIComponent(term)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Error fetching suggestions", error);
    }
  };

  const detectCustomerDetails = async (name: string) => {
    if (!name || name.trim().length < 2) return;

    setDetecting(true);
    try {
      // 1. Fetch Ledger Summary for this customer to get Due Amount
      // We need a wide date range to get the full closing balance
      const from = "2024-04-01"; // Start of financial year usually, or simple way back
      const to = new Date().toISOString().split('T')[0];

      const response = await fetch(`/api/ledger?party=${encodeURIComponent(name)}&from=${from}&to=${to}`);
      if (response.ok) {
        const data = await response.json();

        // Closing Balance is what they owe
        const due = data.summary?.closingBalance || 0;

        // Find recent unpaid invoices (Bilties)
        // We look at the transactions data
        const recentBilties = (data.data as Transaction[])
          .filter(t => t.voucherType === 'Bilty')
          .slice(-3) // Get last 3
          .map(t => {
            // Extract Bilty No from particulars "Bilty #123"
            const match = t.particulars.match(/Bilty #(\d+)/);
            return match ? match[1] : null;
          })
          .filter(Boolean);

        let invoiceText = "";
        if (recentBilties.length === 1) invoiceText = `Bilty #${recentBilties[0]}`;
        else if (recentBilties.length > 1) invoiceText = `Bilty #${recentBilties.join(', #')}`;

        // Only update if we found relevant data to avoid overwriting user edits with zeros unnecessarily
        // But if due is 0, we might want to show that. 
        setFormData(prev => ({
          ...prev,
          dueAmount: due > 0 ? due.toString() : prev.dueAmount,
          invoiceNumber: invoiceText || prev.invoiceNumber,
        }));

        if (due > 0) {
          toast({ title: "Details Detected", description: `Found pending balance of ₹${due.toLocaleString()}` });
        } else if (due <= 0 && data.data.length > 0) {
          toast({ title: "No Dues Found", description: "This customer has no pending balance." });
        }
      }
    } catch (error) {
      console.error("Error detecting details", error);
    } finally {
      setDetecting(false);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData(prev => ({ ...prev, customerName: val }));
    fetchSuggestions(val);
  };

  const selectSuggestion = (name: string) => {
    setFormData(prev => ({ ...prev, customerName: name }));
    setShowDropdown(false);
    detectCustomerDetails(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/payment-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok && result.waLink) {
        window.open(result.waLink, "_blank");
        toast({ title: "Success", description: "WhatsApp reminder opened successfully!" });
      } else {
        throw new Error(result.message || "Failed to send reminder");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send reminder", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      customerName: "",
      whatsappNumber: "",
      invoiceNumber: "",
      dueAmount: "",
      dueDate: "",
      reminderMessage: "Please clear your pending payment at the earliest. Thank you for your cooperation.",
    });
  };

  const currentDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric', hour12: true });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-140px)] min-h-[600px]">
      {/* Left Column: Editor */}
      <div className="flex flex-col justify-between h-full space-y-6">
        <Card className="border-none shadow-sm bg-white p-8 rounded-2xl flex-1 flex flex-col overflow-y-auto">
          <div className="space-y-2 mb-8 border-b border-gray-100 pb-6">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
              <span className="bg-indigo-100 p-2 rounded-lg"><Smartphone className="h-6 w-6 text-indigo-700" /></span>
              Compose Reminder
            </h2>
            <p className="text-gray-500 pl-12">Generate and send professional WhatsApp payment reminders instantly.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 flex-1">
            {/* Customer Section */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Customer Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5 relative" ref={dropdownRef}>
                  <Label className="text-xs font-bold text-gray-600 uppercase">Customer Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={formData.customerName}
                      onChange={handleNameChange}
                      onBlur={() => detectCustomerDetails(formData.customerName)}
                      placeholder="e.g. Adarsh Transport"
                      className="pl-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 transition-all h-10 font-bold text-gray-800"
                      required
                      autoComplete="off"
                    />
                    {detecting && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                      </div>
                    )}
                  </div>
                  {showDropdown && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-100 rounded-lg shadow-xl max-h-52 overflow-auto">
                      {suggestions.map((s, i) => (
                        <div
                          key={i}
                          onClick={() => selectSuggestion(s)}
                          className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer font-medium text-gray-700 border-b border-gray-50 last:border-0"
                        >
                          {s}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase">WhatsApp Number</Label>
                  <div className="flex relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 z-10 text-gray-500 font-medium text-sm">+91</span>
                    <Input
                      value={formData.whatsappNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, whatsappNumber: e.target.value }))}
                      placeholder="9876543210"
                      className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 transition-all h-10 font-sans tracking-wide"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Details Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-extrabold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                Payment Info
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Invoice Ref</Label>
                  <div className="relative">
                    <Receipt className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={formData.invoiceNumber}
                      onChange={(e) => setFormData((prev) => ({ ...prev, invoiceNumber: e.target.value }))}
                      placeholder="Auto-detected..."
                      className="pl-9 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 transition-all h-10 font-mono text-sm"
                    // required // Not strictly required if general reminder
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Due Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₹</span>
                    <Input
                      type="number"
                      value={formData.dueAmount}
                      onChange={(e) => setFormData((prev) => ({ ...prev, dueAmount: e.target.value }))}
                      placeholder="0.00"
                      className="pl-7 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 transition-all h-10 font-bold text-gray-900"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-xs font-bold text-gray-600 uppercase">Custom Message</Label>
                  <Textarea
                    value={formData.reminderMessage}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reminderMessage: e.target.value }))}
                    className="bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 transition-all resize-none text-sm"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 mt-auto flex items-center gap-4 sticky bottom-0 bg-white">
              <Button type="button" variant="outline" onClick={handleReset} className="text-gray-600 hover:bg-gray-50 border-gray-200 h-11 w-32 font-medium">
                <RefreshCcw className="h-4 w-4 mr-2" /> Reset
              </Button>
              <Button type="submit" disabled={loading} className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white shadow-lg shadow-green-500/20 hover:shadow-green-600/30 transition-all h-11 text-base font-bold tracking-wide">
                <Send className="h-4 w-4 mr-2.5" />
                {loading ? "Opening WhatsApp..." : "Send WhatsApp Reminder"}
              </Button>
            </div>
          </form>
        </Card>
      </div>

      {/* Right Column: Mobile Preview */}
      <div className="hidden lg:flex flex-col items-center justify-center bg-gray-100/50 backdrop-blur-sm rounded-2xl border border-gray-200/60 p-8 relative overflow-hidden">
        {/* Phone Frame */}
        <div className="relative w-[340px] h-[680px] bg-black rounded-[3rem] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-[12px] border-black ring-1 ring-white/10 z-10 overflow-hidden flex flex-col">

          {/* Top Bar */}
          <div className="h-12 bg-[#008069] w-full shrink-0 flex items-end justify-between px-6 pb-2.5 text-white z-20">
            <div className="text-sm font-medium">9:41</div>
            <div className="flex gap-1.5 opacity-90">
              <div className="w-4 h-2.5 border border-white/40 rounded-[2px] relative"><div className="absolute inset-0.5 bg-white rounded-[1px]"></div></div>
            </div>
          </div>

          {/* WhatsApp Header */}
          <div className="h-16 bg-[#008069] w-full shrink-0 flex items-center px-4 gap-3 shadow-md z-10 cursor-default">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
              <User className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-white font-semibold truncate leading-tight tracking-wide">
                {formData.customerName || "Customer Name"}
              </div>
              <div className="text-white/80 text-xs mt-0.5">online</div>
            </div>
            <div className="flex gap-4 text-white/80">
              <Phone className="h-5 w-5 fill-current" />
            </div>
          </div>

          {/* Chat Background */}
          <div className="flex-1 bg-[#EFE7DE] p-4 overflow-y-auto font-sans relative">
            {/* Chat Pattern */}
            <div className="absolute inset-0 opacity-[0.06] bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/WhatsApp_logo-color-vertical.svg/20px-WhatsApp_logo-color-vertical.svg.png')] bg-repeat space"></div>

            {/* Date Badge */}
            <div className="flex justify-center mb-6 relative z-10">
              <span className="bg-[#E1F3FB] text-[#1D3C4B] text-[10px] uppercase font-bold px-2 py-1 rounded-md shadow-sm border border-white/50">Today</span>
            </div>

            {/* Message Bubble */}
            <div className="bg-white p-3 pt-2 rounded-lg rounded-tr-none shadow-[0_1px_2px_rgba(0,0,0,0.1)] max-w-[90%] ml-auto relative z-10 group animate-in fade-in slide-in-from-bottom-2">

              {/* Message Content */}
              <div className="text-sm text-[#111B21] leading-relaxed">
                <p className="font-bold mb-1.5">Payment Reminder</p>
                <p className="mb-3 whitespace-pre-wrap">{formData.reminderMessage}</p>

                {/* Rich Details Card */}
                {(formData.invoiceNumber || Number(formData.dueAmount) > 0) && (
                  <div className="bg-gray-50 border-l-4 border-l-[#25D366] p-2.5 rounded-r-md mb-1.5 text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-gray-500">Invoice</span>
                      <span className="font-mono font-bold text-gray-700">{formData.invoiceNumber || "---"}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                      <span className="text-gray-500 font-medium">Due Amount</span>
                      <span className="font-bold text-[#ea580c] text-sm">₹{Number(formData.dueAmount).toLocaleString() || "0"}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp & Status */}
              <div className="flex items-end justify-end gap-1 mt-1">
                <span className="text-[10px] text-gray-500 min-w-[50px] text-right">{currentDate.split(', ')[1]}</span>
                <span className="text-[#53bdeb]"><CheckCheck className="h-3.5 w-3.5" /></span>
              </div>

              {/* Tail */}
              <div className="absolute top-0 -right-2 w-0 h-0 border-[8px] border-t-white border-r-transparent border-b-transparent border-l-transparent transform rotate-[270deg]"></div>
            </div>
          </div>

          {/* Bottom Bar Image */}
          <div className="h-16 bg-[#F0F2F5] shrink-0 flex items-center justify-center p-2 text-gray-400">
            <div className="w-full h-10 bg-white rounded-full border border-gray-200 shadow-sm flex items-center px-4 justify-between">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-200"></div>
                <div className="w-32 h-2 bg-gray-100 rounded-full"></div>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#008069]"></div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-100 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live WhatsApp Preview
        </div>
      </div>
    </div>
  );
}
