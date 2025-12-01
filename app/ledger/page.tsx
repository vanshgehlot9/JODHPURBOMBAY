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
    FileText
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
        }).format(amount);
    };

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                        <div className="h-12 w-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-400/30 blur-sm animate-pulse"></div>
                    </div>
                    <p className="text-gray-500 font-medium animate-pulse">Loading Ledger...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <Header title="Ledger Account" subtitle="Financial transactions & statements" />

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {/* Filter Section with Glassmorphism */}
                    <div className="relative overflow-hidden rounded-xl border border-white/20 bg-white/70 backdrop-blur-xl shadow-lg animate-in slide-in-from-top-4 duration-500">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-purple-50/50 to-pink-50/50 opacity-50"></div>
                        <div className="relative p-6">
                            <div className="flex flex-col md:flex-row gap-6 items-end">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-indigo-500" />
                                            From Date
                                        </label>
                                        <div className="relative group">
                                            <Input
                                                type="date"
                                                value={fromDate}
                                                onChange={(e) => setFromDate(e.target.value)}
                                                className="bg-white/80 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 group-hover:shadow-md"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-purple-500" />
                                            To Date
                                        </label>
                                        <div className="relative group">
                                            <Input
                                                type="date"
                                                value={toDate}
                                                onChange={(e) => setToDate(e.target.value)}
                                                className="bg-white/80 border-gray-200 focus:border-purple-500 focus:ring-purple-500 transition-all duration-300 group-hover:shadow-md"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                            <Search className="h-4 w-4 text-indigo-500" />
                                            Party Name
                                        </label>
                                        <div className="relative group">
                                            <Input
                                                type="text"
                                                value={partyName}
                                                onChange={(e) => setPartyName(e.target.value)}
                                                placeholder="Search party..."
                                                className="bg-white/80 border-gray-200 focus:border-indigo-500 focus:ring-indigo-500 transition-all duration-300 group-hover:shadow-md"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3 w-full md:w-auto">
                                    <Button
                                        onClick={clearFilters}
                                        variant="outline"
                                        className="flex-1 md:flex-none border-gray-300 hover:bg-gray-100 hover:text-gray-900 transition-all duration-300"
                                    >
                                        <RefreshCcw className="h-4 w-4 mr-2" />
                                        Clear
                                    </Button>
                                    <Button
                                        onClick={generateLedger}
                                        disabled={loading}
                                        className="flex-1 md:flex-none bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:-translate-y-0.5"
                                    >
                                        {loading ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="h-4 w-4 mr-2" />
                                                Generate Report
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg flex items-center gap-2 text-sm animate-in slide-in-from-top-2">
                                    <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Summary Cards */}
                    {summary && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-gray-50 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-500">Opening Balance</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Wallet className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(summary.openingBalance)}</div>
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <span className={cn("inline-block h-2 w-2 rounded-full", summary.openingBalance >= 0 ? "bg-emerald-500" : "bg-rose-500")}></span>
                                        {summary.openingBalance >= 0 ? "Receivable" : "Payable"}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-lg bg-gradient-to-br from-white to-emerald-50/30 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-emerald-600">Total Debit</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <TrendingUp className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-emerald-700">{formatCurrency(summary.totalDebit)}</div>
                                    <p className="text-xs text-emerald-600/80 mt-1">Total Billed Amount</p>
                                </CardContent>
                            </Card>



                            <Card className="border-none shadow-lg bg-gradient-to-br from-gray-900 to-gray-800 text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-gray-300">Closing Balance</CardTitle>
                                    <div className="h-8 w-8 rounded-lg bg-white/10 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <ArrowRightLeft className="h-4 w-4" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-white">{formatCurrency(summary.closingBalance)}</div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {summary.closingBalance >= 0 ? "Net Receivable" : "Net Payable"}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Transactions Table */}
                    <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm overflow-hidden animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        <CardHeader className="border-b border-gray-100 bg-gray-50/50 flex flex-row items-center justify-between">
                            <div className="space-y-1">
                                <CardTitle className="text-lg font-bold text-gray-800">Transactions</CardTitle>
                                <p className="text-sm text-gray-500">
                                    {transactions.length > 0
                                        ? `Showing ${transactions.length} transaction${transactions.length === 1 ? '' : 's'}`
                                        : "No transactions to display"}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={printLedger}
                                    disabled={!summary}
                                    className="hidden sm:flex"
                                >
                                    <Printer className="h-4 w-4 mr-2" />
                                    Print
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={exportToExcel}
                                    disabled={!summary}
                                    className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800 hover:border-green-300"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Export Excel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-gray-50/50 hover:bg-gray-50/80">
                                            <TableHead className="w-[120px] font-semibold text-gray-700">Date</TableHead>
                                            <TableHead className="w-[150px] font-semibold text-gray-700">Type</TableHead>
                                            <TableHead className="min-w-[300px] font-semibold text-gray-700">Particulars</TableHead>
                                            <TableHead className="text-right font-semibold text-emerald-600">Debit (₹)</TableHead>
                                            <TableHead className="text-right font-bold text-gray-800">Balance (₹)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loading ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-48 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-3">
                                                        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                                                        <p className="text-gray-500 font-medium">Fetching transaction data...</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : transactions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-4">
                                                        <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center">
                                                            <FileText className="h-8 w-8 text-gray-400" />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <p className="text-lg font-medium text-gray-700">
                                                                {hasSearched ? "No transactions found" : "Ready to generate report"}
                                                            </p>
                                                            <p className="text-sm text-gray-500 max-w-xs mx-auto">
                                                                {hasSearched
                                                                    ? "Try adjusting your date range or filters to see more results."
                                                                    : "Select your date range and click 'Generate Report' to view the ledger."}
                                                            </p>
                                                        </div>
                                                        {!hasSearched && (
                                                            <Button onClick={generateLedger} variant="outline" className="mt-2">
                                                                Generate Now
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            transactions.map((t, index) => (
                                                <TableRow
                                                    key={index}
                                                    className="group hover:bg-indigo-50/30 transition-colors duration-200"
                                                >
                                                    <TableCell className="font-medium text-gray-700">
                                                        {format(new Date(t.date), "dd MMM yyyy")}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "font-medium border-0",
                                                                t.voucherType === 'Bilty' ? 'bg-indigo-100 text-indigo-700' :
                                                                    t.voucherType === 'Payment' ? 'bg-emerald-100 text-emerald-700' :
                                                                        'bg-amber-100 text-amber-700'
                                                            )}
                                                        >
                                                            {t.voucherType}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
                                                        {t.particulars}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium text-emerald-600">
                                                        {t.debit > 0 ? (
                                                            <span className="bg-emerald-50 px-2 py-1 rounded text-emerald-700">
                                                                {formatCurrency(t.debit)}
                                                            </span>
                                                        ) : "-"}
                                                    </TableCell>
                                                    <TableCell className="text-right font-bold text-gray-800">
                                                        {formatCurrency(t.balance)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
