'use client';
import React, { useState } from 'react';
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

const STATEMENT_TYPES = [
  'Client Statement',
  'Cartage Paid Bilty',
  'Receipt List',
  'Delivery Receipt (GST-wise)',
  'Cash Delivery',
  'Party Report',
];

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

export default function StatementPage() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [type, setType] = useState(STATEMENT_TYPES[0]);
  const [party, setParty] = useState('');
  const [rows, setRows] = useState<StatementRow[]>([]);
  const [summary, setSummary] = useState<StatementSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const { toast } = useToast();

  const fetchStatement = async () => {
    if (!from || !to) {
      toast({
        title: "Validation Error",
        description: "Please select both from and to dates",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (type) params.append('type', type);
      if (party) params.append('party', party);
      const res = await fetch(`/api/statement?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch statement');
      const data = await res.json();
      setRows(data.data || []);
      setSummary(data.summary);
      toast({
        title: "Success",
        description: "Statement generated successfully",
      });
    } catch (e: any) {
      setError(e.message || 'Unknown error');
      toast({
        title: "Error",
        description: e.message || 'Failed to generate statement',
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
      if (from) params.append('from', from);
      if (to) params.append('to', to);
      if (type) params.append('type', type);
      if (party) params.append('party', party);
      
      const res = await fetch(`/api/statement/export?${params.toString()}`);
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement_${type.replace(/\s+/g, '_')}_${from}_${to}.xlsx`;
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
        description: e.message || 'Failed to export statement',
        variant: "destructive",
      });
    } finally {
      setExportOpen(false);
    }
  };

  const clearFilters = () => {
    setFrom('');
    setTo('');
    setType(STATEMENT_TYPES[0]);
    setParty('');
    setRows([]);
    setSummary(null);
    setError('');
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Statements" subtitle="Generate and view financial statements" />
        <main className="flex-1 p-6 space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Statement Filters
              </CardTitle>
              <CardDescription>
                Configure parameters to generate your statement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                  <Label className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Statement Type
                  </Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATEMENT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                <Button onClick={fetchStatement} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Generate Statement'}
                </Button>
                <Button variant="outline" onClick={handleExport} disabled={rows.length === 0 || exportOpen}>
                  <Download className="h-4 w-4 mr-2" />
                  {exportOpen ? 'Exporting...' : 'Export to Excel'}
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
                <CardTitle>Statement Summary</CardTitle>
                <CardDescription>
                  Financial overview for {type} from {from} to {to}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      ₹{summary.netBalance.toFixed(2)}
                    </div>
                    <div className="text-sm text-blue-600">Net Balance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Table */}
          {rows.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Statement Details</CardTitle>
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
        </main>
      </div>
    </div>
  );
}
