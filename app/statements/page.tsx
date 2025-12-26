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
import { FileText, Download, Search, Calendar, User, X, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Financial Statements" subtitle="Generate and view financial statements" />
        <main className="flex-1 p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
          {/* Filters Card */}
          <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-50/30 to-transparent border-b border-gray-100/50 px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-gray-900 text-lg sm:text-xl">
                <div className="p-1.5 sm:p-2 bg-indigo-100 rounded-lg">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-600" />
                </div>
                Statement Generator
              </CardTitle>
              <CardDescription className="text-gray-500">
                Configure parameters to generate financial statements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from" className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    From Date
                  </Label>
                  <Input
                    id="from"
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="to" className="flex items-center gap-2 text-gray-700">
                    <Calendar className="h-4 w-4 text-indigo-500" />
                    To Date
                  </Label>
                  <Input
                    id="to"
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-gray-700">
                    <FileText className="h-4 w-4 text-indigo-500" />
                    Statement Type
                  </Label>
                  <Select value={statementType} onValueChange={setStatementType}>
                    <SelectTrigger className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATEMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="party" className="flex items-center gap-2 text-gray-700">
                    <User className="h-4 w-4 text-indigo-500" />
                    Party (Optional)
                  </Label>
                  <Input
                    id="party"
                    placeholder="Enter party name"
                    value={party}
                    onChange={(e) => setParty(e.target.value)}
                    className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
              <Separator className="bg-gray-100" />
              <div className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Button
                  onClick={generateStatement}
                  disabled={loading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-indigo-500/30 transition-all duration-300"
                >
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Generating..." : "Generate Statement"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleExport}
                  disabled={rows.length === 0 || exportOpen}
                  className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {exportOpen ? "Exporting..." : "Export to Excel"}
                </Button>
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50/50">
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
            <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-50/30 to-transparent border-b border-gray-100/50">
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                  </div>
                  Statement Summary
                </CardTitle>
                <CardDescription className="text-gray-500">
                  Financial overview for {statementType} from {from} to {to}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100/50 rounded-xl border border-red-100 shadow-sm">
                    <div className="text-3xl font-bold text-red-600 mb-1">
                      ₹{summary.totalDebit.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-red-700 uppercase tracking-wide">Total Debit</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100/50 rounded-xl border border-green-100 shadow-sm">
                    <div className="text-3xl font-bold text-green-600 mb-1">
                      ₹{summary.totalCredit.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-green-700 uppercase tracking-wide">Total Credit</div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-100 shadow-sm">
                    <div className="text-3xl font-bold text-indigo-600 mb-1">
                      ₹{summary.netBalance.toFixed(2)}
                    </div>
                    <div className="text-sm font-medium text-indigo-700 uppercase tracking-wide">Net Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          {rows.length > 0 && (
            <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle className="text-lg font-bold text-gray-900">Statement Details</CardTitle>
                <CardDescription className="text-gray-500">
                  {rows.length} transactions found for {statementType}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50 hover:bg-gray-50 border-b border-gray-100">
                        <TableHead className="font-semibold text-gray-700">Date</TableHead>
                        <TableHead className="font-semibold text-gray-700">Particulars</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Debit</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Credit</TableHead>
                        <TableHead className="text-right font-semibold text-gray-700">Balance</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, index) => (
                        <TableRow key={index} className="hover:bg-indigo-50/30 border-b border-gray-50">
                          <TableCell className="font-medium text-gray-900">{row.date}</TableCell>
                          <TableCell className="text-gray-600">{row.particulars}</TableCell>
                          <TableCell className="text-right">
                            {row.debit > 0 && (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-mono">
                                ₹{row.debit.toFixed(2)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.credit > 0 && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-mono">
                                ₹{row.credit.toFixed(2)}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-bold text-gray-900 font-mono">
                            ₹{row.balance.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {rows.length === 0 && !loading && !error && (
            <Card className="shadow-sm border-dashed border-2 border-gray-200 bg-gray-50/50">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="p-4 bg-white rounded-full inline-flex mb-4 shadow-sm">
                    <FileText className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Statement Generated</h3>
                  <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                    Select date range and statement type to generate your financial statement
                  </p>
                  <Button
                    onClick={generateStatement}
                    disabled={!from || !to}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Generate Statement
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
