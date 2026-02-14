"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { FileText, Download, Search, Calendar, User, X, BarChart3, GripHorizontal, ArrowRight, Wallet, TrendingUp, ArrowUpRight, ArrowDownLeft, Banknote, RefreshCcw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface StatementRow {
  date: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

interface StatementSummary {
  totalDebit: number;
  totalCredit: number;
  netBalance: number;
}

export default function StatementsPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [statementType, setStatementType] = useState("Client Statement");
  const [party, setParty] = useState("");
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const { toast } = useToast();

  const STATEMENT_TYPES = [
    'Client Statement',
    'Cartage Paid Bilty',
    'Receipt List',
    'Delivery Receipt (GST-wise)',
    'Cash Delivery',
    'Party Report',
  ];

  const generateStatement = async () => {
    if (!from || !to) {
      toast({
        title: "Validation Error",
        description: "Please select both from and to dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (statementType) params.append("type", statementType);
      if (party) params.append("party", party);

      const res = await fetch(`/api/statement?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch statement");

      const data = await res.json();
      setRows(data.data || []);
      setSummary(data.summary);

      toast({
        title: "Success",
        description: "Statement generated successfully",
      });
    } catch (e: any) {
      setError(e.message || "Unknown error");
      toast({
        title: "Error",
        description: e.message || "Failed to generate statement",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (rows.length === 0) {
      toast({
        title: "No Data",
        description: "Please generate a statement first",
        variant: "destructive",
      });
      return;
    }

    setExportOpen(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (statementType) params.append("type", statementType);
      if (party) params.append("party", party);

      const res = await fetch(`/api/statement/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `statement_${statementType.replace(/\s+/g, '_')}_${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Statement exported successfully",
      });
    } catch (e: any) {
      toast({
        title: "Export Error",
        description: e.message || "Failed to export statement",
        variant: "destructive",
      });
    } finally {
      setExportOpen(false);
    }
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setStatementType("Client Statement");
    setParty("");
    setRows([]);
    setSummary(null);
    setError("");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 font-sans">
        <Header title="Financial Statements" subtitle="Comprehensive Report Generation" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full space-y-8">

          {/* Generator Panel */}
          <div className="bg-white rounded-[1.5rem] p-6 shadow-sm border border-gray-100 flex flex-col lg:flex-row gap-6 items-end lg:items-center justify-between sticky top-0 z-20 backdrop-blur-xl bg-white/95">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              {/* Type Select */}
              <div className="relative group flex-1 min-w-[200px] space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-1">Report Type</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FileText className="h-4 w-4 text-gray-400 group-focus-within:text-[#1E1B4B] transition-colors" />
                  </div>
                  <Select value={statementType} onValueChange={setStatementType}>
                    <SelectTrigger className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1E1B4B] rounded-xl text-sm font-medium">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATEMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date Range */}
              <div className="flex flex-1 gap-2 items-end">
                <div className="relative group flex-1 space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-1">From</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-[#1E1B4B] transition-colors" />
                    </div>
                    <Input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1E1B4B] rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
                <div className="relative group flex-1 space-y-1.5">
                  <Label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-1">To</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-4 w-4 text-gray-400 group-focus-within:text-[#1E1B4B] transition-colors" />
                    </div>
                    <Input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1E1B4B] rounded-xl text-sm font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Party Input */}
              <div className="relative group flex-[0.8] space-y-1.5">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-gray-500 ml-1">Party (Optional)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-gray-400 group-focus-within:text-[#1E1B4B] transition-colors" />
                  </div>
                  <Input
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    placeholder="Enter Name..."
                    className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-[#1E1B4B] rounded-xl text-sm font-medium"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto pb-0.5">
              <Button
                onClick={clearFilters}
                variant="outline"
                className="h-11 w-11 p-0 rounded-xl border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                title="Clear Filters"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
              <Button
                onClick={generateStatement}
                disabled={loading}
                className="h-11 px-8 bg-[#1E1B4B] hover:bg-[#2e2a6b] text-white rounded-xl font-bold shadow-lg shadow-indigo-900/10 flex-1 lg:flex-none transition-all active:scale-95"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Report"}
              </Button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-6 py-4 rounded-xl flex items-center gap-3 text-sm animate-in slide-in-from-top-2">
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          {/* Summary Cards */}
          {summary ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Total Debit */}
              <div className="bg-white p-8 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-[#F59E0B]/30 transition-all">
                <div className="absolute right-0 top-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <TrendingUp className="h-32 w-32 -rotate-12" />
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Total Debit</p>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  {formatCurrency(summary.totalDebit)}
                </h3>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wide border border-rose-100">
                  <ArrowUpRight className="h-3 w-3" /> Money Out
                </div>
              </div>

              {/* Total Credit */}
              <div className="bg-white p-8 rounded-[1.5rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
                <div className="absolute right-0 top-0 p-6 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity">
                  <Banknote className="h-32 w-32 -rotate-12" />
                </div>
                <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-3">Total Credit</p>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  {formatCurrency(summary.totalCredit)}
                </h3>
                <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                  <ArrowDownLeft className="h-3 w-3" /> Money In
                </div>
              </div>

              {/* Net Balance */}
              <div className="relative overflow-hidden rounded-[1.5rem] bg-[#1E1B4B] p-8 text-white shadow-xl shadow-indigo-900/10 group">
                <div className="absolute -right-8 -top-8 bg-indigo-500 rounded-full w-40 h-40 blur-3xl opacity-20 group-hover:opacity-25 transition-opacity"></div>
                <div className="relative z-10">
                  <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-3">Net Balance</p>
                  <h3 className="text-4xl font-black tracking-tight">{formatCurrency(summary.netBalance)}</h3>
                  <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
                    <span className="text-indigo-200 text-xs font-medium">Current Status</span>
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${summary.netBalance >= 0 ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30' : 'bg-rose-500/20 text-rose-200 border-rose-500/30'}`}>
                      {summary.netBalance >= 0 ? "Receivable" : "Payable"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-30 select-none pointer-events-none">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white h-48 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-center">
                  <div className="h-10 w-32 bg-gray-100 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          )}

          {/* Results Table */}
          <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[500px] animate-in slide-in-from-bottom-8 duration-700 relative">

            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-[#1E1B4B]/5 border border-[#1E1B4B]/10 flex items-center justify-center shadow-sm text-[#1E1B4B]">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Computed Statement</h3>
                  <p className="text-xs text-gray-500 font-medium mt-0.5">
                    {rows.length > 0 ? `${rows.length} lines generated successfully` : "Waiting for inputs..."}
                  </p>
                </div>
              </div>
              {rows.length > 0 && (
                <Button
                  onClick={handleExport}
                  disabled={exportOpen}
                  className="h-10 px-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-sm shadow-emerald-200 transition-transform active:scale-95"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportOpen ? "Exporting..." : "Download Excel"}
                </Button>
              )}
            </div>

            {/* Table Content */}
            <div className="flex-1 relative">
              {loading && (
                <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 text-[#1E1B4B] animate-spin" />
                    <p className="text-sm font-medium text-gray-900">Crunching numbers...</p>
                  </div>
                </div>
              )}

              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-gray-100">
                    <TableHead className="w-[150px] font-bold text-gray-600 text-[11px] uppercase tracking-wider pl-8 py-5">Date</TableHead>
                    <TableHead className="min-w-[300px] font-bold text-gray-600 text-[11px] uppercase tracking-wider py-5">Particulars</TableHead>
                    <TableHead className="text-right font-bold text-gray-600 text-[11px] uppercase tracking-wider py-5">Debit</TableHead>
                    <TableHead className="text-right font-bold text-gray-600 text-[11px] uppercase tracking-wider py-5">Credit</TableHead>
                    <TableHead className="text-right font-bold text-gray-900 text-[11px] uppercase tracking-wider pr-8 py-5">Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-80 text-center">
                        <div className="flex flex-col items-center justify-center gap-4 py-12">
                          <div className="h-20 w-20 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-2">
                            <GripHorizontal className="h-8 w-8 text-gray-300" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-bold text-gray-900">
                              No statement generated
                            </p>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto">
                              Use the controls above to select parameters and generate a new financial report.
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => {
                      // Handle string date format if coming from JSON as string 
                      const dateObj = new Date(row.date);
                      const formattedDate = !isNaN(dateObj.getTime()) ? format(dateObj, "dd MMM, yyyy") : row.date;

                      return (
                        <TableRow key={index} className="group hover:bg-gray-50 transition-colors border-gray-50">
                          <TableCell className="font-semibold text-gray-700 text-xs pl-8 py-4">
                            {formattedDate}
                          </TableCell>
                          <TableCell className="text-gray-600 font-medium text-sm py-4">
                            {row.particulars}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-500 text-sm py-4 tabular-nums">
                            {row.debit > 0 ? formatCurrency(row.debit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-500 text-sm py-4 tabular-nums">
                            {row.credit > 0 ? formatCurrency(row.credit) : "-"}
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 text-sm py-4 pr-8 tabular-nums">
                            {formatCurrency(row.balance)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
