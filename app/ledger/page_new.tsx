'use client';
import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Download, Search, Calendar, User, X, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LedgerRow {
  date: string;
  voucherType: string;
  particulars: string;
  debit: number;
  credit: number;
  balance: number;
}

interface LedgerSummary {
  openingBalance: number;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;
}

const LedgerPage = () => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [party, setParty] = useState("");
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const { toast } = useToast();

  const fetchLedger = async () => {
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
      if (party) params.append("party", party);
      const res = await fetch(`/api/ledger?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch ledger");
      const data = await res.json();
      setRows(
        (data.data || []).map((row: any) => ({
          ...row,
          date: row.date ? new Date(row.date).toLocaleDateString() : "",
        }))
      );
      setSummary(data.summary);
      toast({
        title: "Success",
        description: "Ledger generated successfully",
      });
    } catch (e: any) {
      setError(e.message || "Unknown error");
      toast({
        title: "Error",
        description: e.message || "Failed to generate ledger",
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
        description: "Please generate a ledger first",
        variant: "destructive",
      });
      return;
    }

    setExportOpen(true);
    try {
      const params = new URLSearchParams();
      if (from) params.append("from", from);
      if (to) params.append("to", to);
      if (party) params.append("party", party);
      
      const res = await fetch(`/api/ledger/export?${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ledger_${party ? party.replace(/\s+/g, '_') : 'all'}_${from}_${to}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Success",
        description: "Ledger exported successfully",
      });
    } catch (e: any) {
      toast({
        title: "Export Error",
        description: e.message || "Failed to export ledger",
        variant: "destructive",
      });
    } finally {
      setExportOpen(false);
    }
  };

  const clearFilters = () => {
    setFrom("");
    setTo("");
    setParty("");
    setRows([]);
    setSummary(null);
    setError("");
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Ledger" subtitle="Generate and view account ledgers" />
        <main className="flex-1 p-6 space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Ledger Filters
              </CardTitle>
              <CardDescription>
                Configure parameters to generate your ledger
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    From Date
                  </Label>
                  <Input
                    id="from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to" className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    To Date
                  </Label>
                  <Input
                    id="to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Party (Optional)
                  </Label>
                  <Input
                    id="party"
                    placeholder="Enter party name"
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                  />
                </div>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button onClick={fetchLedger} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate Ledger"}
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={rows.length === 0 || exportOpen}>
                  <Download className="h-4 w-4 mr-2" />
                  {exportOpen ? "Exporting..." : "Export to Excel"}
                </Button>
                <Button variant="outline" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-red-600">
                  <X className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Summary Card */}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Ledger Summary
                </CardTitle>
                <CardDescription>
                  Account overview from {from} to {to}
                  {party && ` for ${party}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-600">
                      ₹{summary.openingBalance.toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600">Opening Balance</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg border">
                    <div className="text-2xl font-bold text-red-600">
                      ₹{summary.totalDebit.toFixed(2)}
                    </div>
                    <div className="text-sm text-red-600">Total Debit</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{summary.totalCredit.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-600">Total Credit</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">
                      ₹{summary.closingBalance.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">Closing Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          {rows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Ledger Details</CardTitle>
                <CardDescription>
                  {rows.length} transactions found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Voucher Type</TableHead>
                        <TableHead>Particulars</TableHead>
                        <TableHead className="text-right">Debit</TableHead>
                        <TableHead className="text-right">Credit</TableHead>
                        <TableHead className="text-right">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, index) => (
                        <TableRow key={index}>
                          <TableCell>{row.date}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{row.voucherType}</Badge>
                          </TableCell>
                          <TableCell>{row.particulars}</TableCell>
                          <TableCell className="text-right">
                            {row.debit > 0 && (
                              <Badge variant="destructive">₹{row.debit.toFixed(2)}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.credit > 0 && (
                              <Badge variant="default">₹{row.credit.toFixed(2)}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            <Badge variant={row.balance >= 0 ? "default" : "destructive"}>
                              ₹{row.balance.toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
};

export default LedgerPage;
