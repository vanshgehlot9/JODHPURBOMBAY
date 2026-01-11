"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/components/auth/auth-provider";
import {
    Loader2,
    Search,
    Printer,
    Download,
    Calendar as CalendarIcon,
    RefreshCcw,
    Wallet,
    TrendingUp,
    TrendingDown,
    ArrowRightLeft,
    FileText,
    PieChart,
    Banknote,
    Filter,
    ArrowUpRight,
    ArrowDownLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function LedgerPage() {
    const { user, loading: authLoading } = useAuth();

    // Get current month dates
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    const [fromDate, setFromDate] = useState(format(firstDay, "yyyy-MM-dd"));
    const [toDate, setToDate] = useState(format(today, "yyyy-MM-dd"));
    const [partyName, setPartyName] = useState("");

    const [transactions, setTransactions] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);
    const [error, setError] = useState("");

    const generateLedger = async () => {
        setLoading(true);
        setError("");
        setHasSearched(true);

        try {
            const params = new URLSearchParams();
            params.append("from", fromDate);
            params.append("to", toDate);
            if (partyName.trim()) {
                params.append("party", partyName.trim());
            }

            const response = await fetch(`/api/ledger?${params.toString()}`);

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            const data = await response.json();
            setTransactions(data.data || []);
            setSummary(data.summary || null);
        } catch (err: any) {
            setError(err.message || "Failed to fetch ledger");
            console.error("Ledger error:", err);
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setFromDate(format(firstDay, "yyyy-MM-dd"));
        setToDate(format(today, "yyyy-MM-dd"));
        setPartyName("");
        setTransactions([]);
        setSummary(null);
        setHasSearched(false);
        setError("");
    };

    const exportToExcel = () => {
        const params = new URLSearchParams();
        params.append("from", fromDate);
        params.append("to", toDate);
        if (partyName.trim()) {
            params.append("party", partyName.trim());
        }

        window.open(`/api/ledger/export?${params.toString()}`, "_blank");
    };

    const printLedger = () => {
        window.print();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-[#F8F9FA]">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden min-w-0 font-sans">
                <Header title="Ledger Account" subtitle="Financial Statements & Transaction History" />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-6">

                    {/* Filter Bar */}
                    <div className="bg-white rounded-[1.5rem] p-5 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-4 items-end lg:items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-white/90">
                        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
                            <div className="relative group flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <Input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-lg text-sm font-medium"
                                />
                            </div>
                            <div className="flex items-center text-gray-400 font-bold px-1">to</div>
                            <div className="relative group flex-1">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <CalendarIcon className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <Input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-lg text-sm font-medium"
                                />
                            </div>
                            <div className="relative group flex-[1.5]">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <Input
                                    type="text"
                                    value={partyName}
                                    onChange={(e) => setPartyName(e.target.value)}
                                    placeholder="Search Party Name..."
                                    className="pl-10 h-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-indigo-500 rounded-lg text-sm font-medium"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 w-full lg:w-auto">
                            <Button
                                onClick={clearFilters}
                                variant="outline"
                                className="h-10 w-10 p-0 rounded-lg border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                title="Reset"
                            >
                                <RefreshCcw className="h-4 w-4" />
                            </Button>
                            <Button
                                onClick={generateLedger}
                                disabled={loading}
                                className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold shadow-sm shadow-indigo-200 flex-1 lg:flex-none"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Statement"}
                            </Button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {summary ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Opening Balance */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-[1.5rem] border border-gray-200 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Wallet className="h-24 w-24 -rotate-12" />
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Opening Balance</p>
                                <h3 className="text-3xl font-black text-gray-800 tracking-tight">{formatCurrency(summary.openingBalance)}</h3>
                                <div className={`inline-flex items-center mt-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${summary.openingBalance >= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                    {summary.openingBalance >= 0 ? "Credit" : "Debit"}
                                </div>
                            </div>

                            {/* Total Debit */}
                            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <TrendingUp className="h-24 w-24 text-emerald-600 -rotate-12" />
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Billed</p>
                                <h3 className="text-3xl font-black text-emerald-600 tracking-tight flex items-center gap-2">
                                    <ArrowUpRight className="h-6 w-6" />
                                    {formatCurrency(summary.totalDebit)}
                                </h3>
                                <p className="text-emerald-800/60 text-xs font-medium mt-2">Money Out</p>
                            </div>

                            {/* Total Credit */}
                            <div className="bg-white p-6 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-blue-200 hover:shadow-md transition-all">
                                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Banknote className="h-24 w-24 text-blue-600 -rotate-12" />
                                </div>
                                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Received</p>
                                <h3 className="text-3xl font-black text-blue-600 tracking-tight flex items-center gap-2">
                                    <ArrowDownLeft className="h-6 w-6" />
                                    {formatCurrency(summary.totalCredit || 0)}
                                </h3>
                                <p className="text-blue-800/60 text-xs font-medium mt-2">Money In</p>
                            </div>

                            {/* Closing Balance */}
                            <div className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-[#1E1B4B] to-[#312E81] p-6 text-white shadow-xl shadow-indigo-900/20 group">
                                <div className="absolute -right-6 -top-6 bg-indigo-500 rounded-full w-32 h-32 blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
                                <div className="relative z-10">
                                    <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">Net Closing</p>
                                    <h3 className="text-3xl font-black tracking-tight">{formatCurrency(summary.closingBalance)}</h3>
                                    <div className="mt-4 pt-4 border-t border-indigo-100/10 flex items-center justify-between">
                                        <span className="text-indigo-200 text-xs">Status</span>
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${summary.closingBalance >= 0 ? 'bg-emerald-500/20 text-emerald-200' : 'bg-rose-500/20 text-rose-200'}`}>
                                            {summary.closingBalance >= 0 ? "Receivable" : "Payable"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 opacity-40">
                            {/* Placeholders */}
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="bg-gray-50 h-36 rounded-[1.5rem] border border-dashed border-gray-200 flex items-center justify-center">
                                    <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Transactions Section */}
                    {summary && (
                        <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] animate-in slide-in-from-bottom-8 duration-700">
                            <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm text-indigo-600">
                                        <ArrowRightLeft className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-gray-900">Transaction History</h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            {transactions.length} records found
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={printLedger} size="sm" className="h-8 text-xs">
                                        <Printer className="h-3 w-3 mr-2" /> Print
                                    </Button>
                                    <Button onClick={exportToExcel} size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                                        <Download className="h-3 w-3 mr-2" /> Excel Export
                                    </Button>
                                </div>
                            </div>

                            <div className="flex-1">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/50">
                                            <TableHead className="w-[120px] font-bold text-gray-600 text-[11px] uppercase tracking-wider pl-6 py-3">Date</TableHead>
                                            <TableHead className="w-[100px] font-bold text-gray-600 text-[11px] uppercase tracking-wider py-3">Type</TableHead>
                                            <TableHead className="min-w-[300px] font-bold text-gray-600 text-[11px] uppercase tracking-wider py-3">Description</TableHead>
                                            <TableHead className="text-right font-bold text-emerald-600 text-[11px] uppercase tracking-wider py-3">Debit</TableHead>
                                            <TableHead className="text-right font-bold text-blue-600 text-[11px] uppercase tracking-wider py-3">Credit</TableHead>
                                            <TableHead className="text-right font-bold text-gray-900 text-[11px] uppercase tracking-wider pr-6 py-3">Balance</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-2 text-gray-400">
                                                        <FileText className="h-10 w-10 opacity-20" />
                                                        <p className="text-sm">No transactions found for this period</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((t, index) => (
                                                <TableRow key={index} className="group hover:bg-gray-50 transition-colors border-gray-50">
                                                    <TableCell className="font-semibold text-gray-700 text-xs pl-6 py-3.5">
                                                        {format(new Date(t.date), "dd MMM, yyyy")}
                                                    </TableCell>
                                                    <TableCell className="py-3.5">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide",
                                                            t.voucherType === 'Bilty' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                                t.voucherType === 'Payment' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                                    'bg-amber-50 text-amber-700 border-amber-100'
                                                        )}>
                                                            {t.voucherType}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 font-medium text-sm py-3.5 max-w-[300px] truncate" title={t.particulars}>
                                                        {t.particulars}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-emerald-600 text-sm py-3.5 tabular-nums">
                                                        {t.debit > 0 ? formatCurrency(t.debit) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-blue-600 text-sm py-3.5 tabular-nums">
                                                        {t.credit > 0 ? formatCurrency(t.credit) : (t.amount && !t.debit ? formatCurrency(t.amount) : "-")}
                                                    </TableCell>
                                                    <TableCell className="text-right font-black text-gray-800 text-sm py-3.5 pr-6 tabular-nums">
                                                        {formatCurrency(t.balance)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
                            <div className="h-2 w-2 rounded-full bg-red-500"></div>
                            {error}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
