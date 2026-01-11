"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, CreditCard, CheckCircle2, Loader2, ArrowRight, TrendingUp, Download, Receipt, Wallet, Banknote, Building2, User, BadgeIndianRupee, Clock, Hash, FileText } from "lucide-react";
import { getBilties, createPayment, getRecentPayments, Bilty, Payment } from "@/lib/firestore";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function PaymentEntryPage() {
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<Bilty[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [totalCredit, setTotalCredit] = useState<number | null>(null);
    const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
    const [biltyBalances, setBiltyBalances] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        const fetchData = async () => {
            try {
                const today = new Date();
                const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                const from = format(firstDay, "yyyy-MM-dd");
                const to = format(today, "yyyy-MM-dd");

                const ledgerRes = await fetch(`/api/ledger?from=${from}&to=${to}`);
                const ledgerData = await ledgerRes.json();
                if (ledgerData.summary) {
                    setTotalCredit(ledgerData.summary.totalCredit);
                }

                const payments = await getRecentPayments(5);
                setRecentPayments(payments);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            }
        };
        fetchData();
    }, [submitting]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const downloadReport = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const from = format(firstDay, "yyyy-MM-dd");
        const to = format(today, "yyyy-MM-dd");
        window.open(`/api/payments/export?from=${from}&to=${to}`, "_blank");
    };

    // Form State
    const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [partyName, setPartyName] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [referenceNo, setReferenceNo] = useState("");
    const [remarks, setRemarks] = useState("");

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setSearching(true);
        try {
            const results = await getBilties({ search: searchQuery, limit: 10 });
            setSearchResults(results);

            const allPayments = await getRecentPayments(1000);
            const balances = new Map<string, number>();

            results.forEach(bilty => {
                const biltyTotal = bilty.charges?.grandTotal || 0;
                const paymentsForBilty = allPayments.filter(p => p.biltyNo === bilty.biltyNo);
                const totalPaid = paymentsForBilty.reduce((sum, p) => sum + (p.amount || 0), 0);
                const outstanding = biltyTotal - totalPaid;
                balances.set(bilty.id || '', outstanding);
            });

            setBiltyBalances(balances);
        } catch (error) {
            console.error("Search error:", error);
            toast({
                title: "Search Failed",
                description: "Could not fetch bilties. Please try again.",
                variant: "destructive",
            });
        } finally {
            setSearching(false);
        }
    };

    const handleSelectBilty = (bilty: Bilty) => {
        setSelectedBilty(bilty);
        setPartyName(bilty.consignorName);
        const outstanding = biltyBalances.get(bilty.id || '') || bilty.charges?.grandTotal || 0;
        setAmount(outstanding.toString());
        setRemarks(`Payment for Bilty No: ${bilty.biltyNo}`);

        setTimeout(() => {
            document.getElementById('payment-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!partyName || !amount || !paymentDate) {
            toast({
                title: "Missing Fields",
                description: "Please fill in all required fields.",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        try {
            await createPayment({
                date: new Date(paymentDate),
                partyName,
                amount: parseFloat(amount),
                paymentMode,
                referenceNo,
                biltyNo: selectedBilty?.biltyNo,
                remarks
            });

            toast({
                title: "Payment Recorded",
                description: "The payment has been successfully recorded.",
                className: "bg-green-50 border-green-200 text-green-800",
            });

            setSelectedBilty(null);
            setPartyName("");
            setAmount("");
            setReferenceNo("");
            setRemarks("");
            setSearchResults([]);
            setSearchQuery("");

        } catch (error) {
            console.error("Payment error:", error);
            toast({
                title: "Error",
                description: "Failed to record payment.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const paymentModeIcons: { [key: string]: React.ReactNode } = {
        Cash: <Banknote className="h-4 w-4" />,
        Cheque: <Receipt className="h-4 w-4" />,
        Online: <Wallet className="h-4 w-4" />,
        "Bank Transfer": <Building2 className="h-4 w-4" />,
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-[#F8F9FA]">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header title="Payment Entry" subtitle="Logistics Payment Hub" />

                <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1400px] mx-auto w-full font-sans">

                    {/* Stats Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Total Received Card */}
                        <div className="md:col-span-2 relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#059669] via-[#10B981] to-[#34D399] p-8 text-white shadow-xl shadow-emerald-500/20 group">
                            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                                <TrendingUp className="h-32 w-32 transform rotate-12 translate-x-8 -translate-y-8" />
                            </div>
                            <div className="relative z-10 flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-white/20 p-1 rounded-md"><BadgeIndianRupee className="h-4 w-4 text-white" /></span>
                                        <p className="text-emerald-50 text-sm font-bold uppercase tracking-widest">Total Collections</p>
                                    </div>
                                    <h2 className="text-5xl font-black mt-3 tracking-tighter">
                                        {totalCredit !== null ? formatCurrency(totalCredit) : "..."}
                                    </h2>
                                    <p className="text-emerald-100 font-medium mt-2 text-sm flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5" /> For current month
                                    </p>
                                </div>
                                <div className="mt-8 flex gap-3">
                                    <Button onClick={downloadReport} className="bg-white text-emerald-700 hover:bg-emerald-50 border-0 h-10 px-6 rounded-xl font-bold text-sm shadow-sm transition-transform active:scale-95">
                                        <Download className="h-4 w-4 mr-2" /> Download Statement
                                    </Button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Action / Context Card */}
                        <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center space-y-4 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10"></div>
                            <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-2 border border-indigo-50">
                                <Receipt className="h-8 w-8 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Record Transaction</h3>
                                <p className="text-sm text-gray-500 mt-1 max-w-[200px] mx-auto">Use the panel below to find a bilty or log a direct payment.</p>
                            </div>
                        </div>
                    </div>

                    {/* Search & Form Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Search Section */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm p-6">
                                <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <div className="p-1.5 bg-indigo-50 rounded-lg"><Search className="h-4 w-4 text-indigo-600" /></div>
                                    Find Information
                                </h3>
                                <div className="relative group">
                                    <Input
                                        id="bilty-search-input"
                                        placeholder="Enter Bilty No or Name..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="h-12 pl-4 pr-12 bg-gray-50 border-transparent focus:bg-white focus:border-indigo-500 rounded-xl transition-all font-medium text-gray-700"
                                    />
                                    <Button
                                        onClick={handleSearch}
                                        disabled={searching}
                                        size="sm"
                                        className="absolute right-1 top-1 bottom-1 bg-indigo-600 hover:bg-indigo-700 rounded-lg w-10 p-0 shadow-sm"
                                    >
                                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                                    </Button>
                                </div>

                                {/* Results */}
                                {searchResults.length > 0 && (
                                    <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                                        {searchResults.map((bilty) => {
                                            const outstanding = biltyBalances.get(bilty.id || '') || 0;
                                            const isPaid = outstanding <= 0;

                                            return (
                                                <div
                                                    key={bilty.id}
                                                    onClick={() => !isPaid && handleSelectBilty(bilty)}
                                                    className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden ${isPaid
                                                        ? 'bg-gray-50 border-gray-100 opacity-60'
                                                        : selectedBilty?.id === bilty.id
                                                            ? 'bg-indigo-50 border-indigo-200 shadow-inner'
                                                            : 'bg-white border-gray-100 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between relative z-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${isPaid ? 'bg-gray-200 text-gray-500' : 'bg-indigo-100 text-indigo-700'}`}>
                                                                {String(bilty.biltyNo).slice(-2)}
                                                            </div>
                                                            <div>
                                                                <p className="font-bold text-gray-900 leading-tight">#{bilty.biltyNo}</p>
                                                                <p className="text-xs text-gray-500 font-medium truncate max-w-[120px]">{bilty.consignorName}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {isPaid ? (
                                                                <span className="text-[10px] font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200 uppercase tracking-wide">Paid</span>
                                                            ) : (
                                                                <>
                                                                    <p className="font-bold text-orange-600 text-sm">₹{outstanding.toLocaleString()}</p>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {searchResults.length === 0 && searchQuery && !searching && (
                                    <div className="text-center py-10">
                                        <div className="inline-flex bg-gray-50 p-4 rounded-full mb-3">
                                            <Search className="h-6 w-6 text-gray-300" />
                                        </div>
                                        <p className="text-sm text-gray-500 font-medium">No matches found</p>
                                    </div>
                                )}
                            </div>

                            {/* Recent Payments */}
                            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" /> Recent Activity
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-auto max-h-[350px] p-2 space-y-1">
                                    {recentPayments.length === 0 ? (
                                        <div className="text-center py-10 text-gray-400 text-sm">No recent activity</div>
                                    ) : (
                                        recentPayments.map((payment) => (
                                            <div key={payment.id} className="p-3 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-between group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                                        {paymentModeIcons[payment.paymentMode] || <CreditCard className="h-4 w-4" />}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">{payment.partyName}</p>
                                                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide">
                                                            {payment.date ? format(new Date(payment.date instanceof Object && 'toDate' in payment.date ? (payment.date as any).toDate() : payment.date), "dd MMM") : "-"}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-emerald-600 text-sm bg-emerald-50/50 px-2 py-1 rounded-md">+{formatCurrency(payment.amount)}</p>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Form */}
                        <div id="payment-form" className="lg:col-span-8">
                            <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-xl shadow-indigo-100/20 overflow-hidden">
                                <div className="bg-[#1E1B4B] p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <CreditCard className="h-48 w-48 -rotate-12 translate-x-12 -translate-y-12" />
                                    </div>
                                    <div className="relative z-10 flex items-center gap-5">
                                        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                                            <Wallet className="h-8 w-8 text-indigo-200" />
                                        </div>
                                        <div>
                                            <h2 className="font-bold text-2xl tracking-tight">Payment Details</h2>
                                            <p className="text-indigo-200 text-sm mt-1 max-w-md">
                                                {selectedBilty
                                                    ? <span className="text-white font-medium bg-white/20 px-2 py-0.5 rounded text-xs">Linked to Bilty #{selectedBilty.biltyNo}</span>
                                                    : "Enter payment information below to record a new transaction."
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleSubmit} className="p-8 space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Date</Label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    type="date"
                                                    value={paymentDate}
                                                    onChange={(e) => setPaymentDate(e.target.value)}
                                                    className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl font-medium"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Party</Label>
                                            <div className="relative">
                                                <User className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    value={partyName}
                                                    onChange={(e) => setPartyName(e.target.value)}
                                                    placeholder="Payer Name"
                                                    className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl font-medium"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Amount</Label>
                                            <div className="relative">
                                                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold bg-gray-200 w-6 h-6 rounded flex items-center justify-center text-xs">₹</span>
                                                <Input
                                                    type="number"
                                                    value={amount}
                                                    onChange={(e) => setAmount(e.target.value)}
                                                    placeholder="0"
                                                    className="pl-12 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl text-lg font-bold text-gray-900"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Mode</Label>
                                            <Select value={paymentMode} onValueChange={setPaymentMode}>
                                                <SelectTrigger className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl">
                                                    <SelectValue placeholder="Select mode" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cash"><div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-green-600" />Cash</div></SelectItem>
                                                    <SelectItem value="Cheque"><div className="flex items-center gap-2"><Receipt className="h-4 w-4 text-blue-600" />Cheque</div></SelectItem>
                                                    <SelectItem value="Online"><div className="flex items-center gap-2"><Wallet className="h-4 w-4 text-purple-600" />Online / UPI</div></SelectItem>
                                                    <SelectItem value="Bank Transfer"><div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-gray-600" />Bank Transfer</div></SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Reference (Optional)</Label>
                                            <div className="relative">
                                                <Hash className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    value={referenceNo}
                                                    onChange={(e) => setReferenceNo(e.target.value)}
                                                    placeholder="Cheque No, UTR..."
                                                    className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl font-mono text-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">Remarks</Label>
                                            <div className="relative">
                                                <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                                                <Input
                                                    value={remarks}
                                                    onChange={(e) => setRemarks(e.target.value)}
                                                    placeholder="Brief notes..."
                                                    className="h-11 pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-xl"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-100 flex items-center justify-between">
                                        <p className="text-xs text-gray-400 font-medium">
                                            Double check details before confirming.
                                        </p>
                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="bg-[#059669] hover:bg-[#047857] text-white min-w-[200px] shadow-lg shadow-emerald-500/30 h-12 text-base font-bold rounded-xl transition-all hover:scale-[1.02]"
                                            disabled={submitting}
                                        >
                                            {submitting ? (
                                                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Processing...</>
                                            ) : (
                                                <><CheckCircle2 className="mr-2 h-5 w-5" />Confirm Payment</>
                                            )}
                                        </Button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </main>
                <Toaster />
            </div>
        </div>
    );
}
