"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle2, AlertCircle, Search, X } from "lucide-react";
import { getBilties, createPayment, getRecentPayments, Bilty, Payment } from "@/lib/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

interface OutstandingBilty {
    bilty: Bilty;
    outstanding: number;
}

export default function PaymentEntryPage() {
    const { toast } = useToast();

    // Data
    const [outstandingList, setOutstandingList] = useState<OutstandingBilty[]>([]);
    const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState("");

    // Selected bilty to pay
    const [selected, setSelected] = useState<OutstandingBilty | null>(null);

    // Payment form
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [referenceNo, setReferenceNo] = useState("");
    const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));

    // Load outstanding bilties on mount
    const loadData = async () => {
        setLoading(true);
        try {
            const [bilties, payments] = await Promise.all([
                getBilties({ limit: 200 }),
                getRecentPayments(500),
            ]);

            // Calculate outstanding for each bilty
            const list: OutstandingBilty[] = bilties
                .map((bilty) => {
                    const total = bilty.charges?.grandTotal || 0;
                    const paid = payments
                        .filter((p) => p.biltyNo === bilty.biltyNo)
                        .reduce((sum, p) => sum + (p.amount || 0), 0);
                    const outstanding = total - paid;
                    return { bilty, outstanding };
                })
                .filter((b) => b.outstanding > 0)
                .sort((a, b) => b.outstanding - a.outstanding);

            setOutstandingList(list);
            setRecentPayments(payments.slice(0, 8));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleSelect = (item: OutstandingBilty) => {
        setSelected(item);
        setAmount(item.outstanding.toFixed(0));
    };

    const handleClear = () => {
        setSelected(null);
        setAmount("");
        setReferenceNo("");
        setPaymentMode("Cash");
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || !amount) return;

        setSubmitting(true);
        try {
            await createPayment({
                date: new Date(paymentDate),
                partyName: selected.bilty.consignorName,
                amount: parseFloat(amount),
                paymentMode,
                referenceNo,
                biltyNo: selected.bilty.biltyNo,
            });

            toast({
                title: "✓ Payment recorded",
                description: `₹${parseFloat(amount).toLocaleString()} collected from ${selected.bilty.consignorName}`,
                className: "bg-green-50 border-green-200 text-green-900",
            });

            handleClear();
            await loadData();
        } catch (err) {
            toast({ title: "Error", description: "Failed to record payment.", variant: "destructive" });
        } finally {
            setSubmitting(false);
        }
    };

    const filtered = outstandingList.filter((item) => {
        const q = search.toLowerCase();
        return (
            item.bilty.consignorName.toLowerCase().includes(q) ||
            item.bilty.biltyNo.toString().includes(q) ||
            item.bilty.consigneeName.toLowerCase().includes(q)
        );
    });

    const formatDate = (d: any) => {
        try {
            const date = d?.toDate ? d.toDate() : new Date(d);
            return format(date, "dd MMM yyyy");
        } catch {
            return "-";
        }
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Payment Entry" subtitle="Record payments against bilties" />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1200px] mx-auto w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT: Outstanding Dues */}
                        <div className="lg:col-span-7 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">Outstanding Dues</h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {loading ? "Loading..." : `${outstandingList.length} bilties pending payment`}
                                    </p>
                                </div>
                                {outstandingList.length > 0 && (
                                    <div className="text-right">
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Due</p>
                                        <p className="text-xl font-black text-red-600">
                                            ₹{outstandingList.reduce((s, i) => s + i.outstanding, 0).toLocaleString()}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search by party name or bilty no..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9 h-10 bg-white border-gray-200 rounded-xl"
                                />
                            </div>

                            {/* List */}
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                {loading ? (
                                    <div className="flex items-center justify-center py-16">
                                        <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
                                    </div>
                                ) : filtered.length === 0 ? (
                                    <div className="text-center py-16">
                                        <CheckCircle2 className="h-10 w-10 text-green-400 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">
                                            {search ? "No matching bilties" : "All dues cleared!"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-50">
                                        {/* Header */}
                                        <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50">
                                            <div className="col-span-1">#</div>
                                            <div className="col-span-4">Party</div>
                                            <div className="col-span-3">Date</div>
                                            <div className="col-span-3 text-right">Due Amount</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {filtered.map(({ bilty, outstanding }) => {
                                            const isSelected = selected?.bilty.id === bilty.id;
                                            return (
                                                <div
                                                    key={bilty.id}
                                                    onClick={() => handleSelect({ bilty, outstanding })}
                                                    className={`grid grid-cols-12 px-4 py-3.5 items-center cursor-pointer transition-all hover:bg-indigo-50/50 ${isSelected ? "bg-indigo-50 border-l-4 border-indigo-500" : "border-l-4 border-transparent"}`}
                                                >
                                                    <div className="col-span-1">
                                                        <span className="text-xs font-bold text-gray-400 font-mono">
                                                            {bilty.biltyNo}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-4">
                                                        <p className="text-sm font-semibold text-gray-900 truncate">{bilty.consignorName}</p>
                                                        <p className="text-[11px] text-gray-400 truncate">{bilty.from} → {bilty.to}</p>
                                                    </div>
                                                    <div className="col-span-3">
                                                        <p className="text-xs text-gray-500 font-medium">{formatDate(bilty.biltyDate)}</p>
                                                    </div>
                                                    <div className="col-span-3 text-right">
                                                        <span className="text-sm font-black text-red-600">
                                                            ₹{outstanding.toLocaleString()}
                                                        </span>
                                                    </div>
                                                    <div className="col-span-1 flex justify-end">
                                                        {isSelected && (
                                                            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Recent Payments */}
                            {recentPayments.length > 0 && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="px-4 py-3 border-b border-gray-50">
                                        <h3 className="text-sm font-bold text-gray-700">Recent Payments</h3>
                                    </div>
                                    <div className="divide-y divide-gray-50">
                                        {recentPayments.map((p) => (
                                            <div key={p.id} className="flex items-center justify-between px-4 py-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-800">{p.partyName}</p>
                                                    <p className="text-xs text-gray-400">{formatDate(p.date)} · {p.paymentMode}{p.biltyNo ? ` · Bilty #${p.biltyNo}` : ""}</p>
                                                </div>
                                                <span className="text-sm font-bold text-green-600">+₹{p.amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RIGHT: Payment Form */}
                        <div className="lg:col-span-5">
                            <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all ${selected ? "border-indigo-200 shadow-indigo-100/50" : "border-gray-100"}`}>
                                <div className={`px-6 py-4 border-b ${selected ? "bg-indigo-600" : "bg-gray-50 border-gray-100"}`}>
                                    <h2 className={`text-base font-bold ${selected ? "text-white" : "text-gray-500"}`}>
                                        {selected ? "Record Payment" : "Select a bilty to pay"}
                                    </h2>
                                    {selected && (
                                        <p className="text-indigo-200 text-xs mt-0.5 font-medium">
                                            Bilty #{selected.bilty.biltyNo} · {selected.bilty.consignorName}
                                        </p>
                                    )}
                                </div>

                                {!selected ? (
                                    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                        <AlertCircle className="h-10 w-10 text-gray-200 mb-3" />
                                        <p className="text-gray-400 text-sm">Click any row from the outstanding list on the left to start a payment.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                                        {/* Summary row */}
                                        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                                            <div>
                                                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Total Due</p>
                                                <p className="text-2xl font-black text-red-500">₹{selected.outstanding.toLocaleString()}</p>
                                            </div>
                                            <button type="button" onClick={handleClear} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>

                                        {/* Date */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Date</Label>
                                            <Input
                                                type="date"
                                                value={paymentDate}
                                                onChange={(e) => setPaymentDate(e.target.value)}
                                                className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-indigo-400 font-medium"
                                                required
                                            />
                                        </div>

                                        {/* Amount */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Amount Received</Label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">₹</span>
                                                <Input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="pl-8 h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-indigo-400 text-lg font-bold"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        {/* Mode */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment Mode</Label>
                                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-indigo-400">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash">Cash</SelectItem>
                                                    <SelectItem value="Online">Online</SelectItem>
                                                    <SelectItem value="NEFT">NEFT</SelectItem>
                                                    <SelectItem value="RTGS">RTGS</SelectItem>
                                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Reference */}
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Reference No. <span className="text-gray-300 font-normal normal-case">(optional)</span></Label>
                                            <Input
                                                value={referenceNo}
                                                onChange={(e) => setReferenceNo(e.target.value)}
                                                placeholder="Cheque no, UTR, transaction ID..."
                                                className="h-11 bg-gray-50 border-gray-200 rounded-xl focus:border-indigo-400 font-mono text-sm"
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={submitting || !amount}
                                            className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-base transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                                            ) : (
                                                <><CheckCircle2 className="mr-2 h-5 w-5" />Confirm Payment</>
                                            )}
                                        </Button>
                                    </form>
                                )}
                            </div>
                        </div>

                    </div>
                </main>
                <Toaster />
            </div>
        </div>
    );
}
