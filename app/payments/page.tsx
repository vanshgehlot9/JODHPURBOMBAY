"use client";

import React, { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Calendar, CreditCard, CheckCircle2, Loader2, ArrowRight } from "lucide-react";
import { getBilties, createPayment, Bilty } from "@/lib/firestore";
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
            // Search by string (bilty no, name, etc.)
            const results = await getBilties({ search: searchQuery, limit: 10 });
            setSearchResults(results);
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
        // Auto-fill form
        // Defaulting to Consignor Name, but user can change
        setPartyName(bilty.consignorName);
        setAmount(bilty.charges?.grandTotal?.toString() || "0");
        setRemarks(`Payment for Bilty No: ${bilty.biltyNo}`);

        // Scroll to form
        setTimeout(() => {
            window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
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

            // Reset form
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

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Header title="Payment Entry" subtitle="Record received payments" />

                <main className="flex-1 p-4 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
                    {/* Search Section */}
                    <Card className="border-none shadow-md bg-white">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-indigo-500" />
                                Find Bilty
                            </CardTitle>
                            <CardDescription>
                                Search by Bilty Number, Party Name, or Date to find the transaction.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex gap-3">
                                <Input
                                    placeholder="Enter Bilty No, Party Name..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                />
                                <Button onClick={handleSearch} disabled={searching} className="bg-indigo-600 hover:bg-indigo-700">
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                                </Button>
                            </div>

                            {/* Results Table */}
                            {searchResults.length > 0 && (
                                <div className="rounded-md border border-gray-200 overflow-x-auto animate-in fade-in slide-in-from-top-2">
                                    <Table>
                                        <TableHeader className="bg-gray-50">
                                            <TableRow>
                                                <TableHead>Bilty No</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Consignor</TableHead>
                                                <TableHead>Consignee</TableHead>
                                                <TableHead className="text-right">Amount</TableHead>
                                                <TableHead></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {searchResults.map((bilty) => (
                                                <TableRow key={bilty.id} className="hover:bg-indigo-50/30">
                                                    <TableCell className="font-medium">#{bilty.biltyNo}</TableCell>
                                                    <TableCell>
                                                        {bilty.biltyDate ? format(new Date(bilty.biltyDate instanceof Object && 'toDate' in bilty.biltyDate ? (bilty.biltyDate as any).toDate() : bilty.biltyDate), "dd MMM yyyy") : "-"}
                                                    </TableCell>
                                                    <TableCell>{bilty.consignorName}</TableCell>
                                                    <TableCell>{bilty.consigneeName}</TableCell>
                                                    <TableCell className="text-right font-medium text-gray-900">
                                                        ₹{bilty.charges?.grandTotal?.toLocaleString() || 0}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                            onClick={() => handleSelectBilty(bilty)}
                                                        >
                                                            Select <ArrowRight className="ml-1 h-4 w-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {searchResults.length === 0 && searchQuery && !searching && (
                                <div className="text-center py-8 text-gray-500">
                                    No bilties found matching "{searchQuery}"
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Payment Form */}
                    <Card className={`border-none shadow-lg transition-all duration-500 ${selectedBilty ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-4 grayscale'}`}>
                        <CardHeader className="bg-gradient-to-r from-indigo-900 to-purple-900 text-white rounded-t-xl">
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Payment Details
                            </CardTitle>
                            <CardDescription className="text-indigo-200">
                                {selectedBilty ? `Recording payment for Bilty #${selectedBilty.biltyNo}` : "Select a bilty above to proceed (or fill manually)"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="date">Payment Date</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                                        <Input
                                            id="date"
                                            type="date"
                                            value={paymentDate}
                                            onChange={(e) => setPaymentDate(e.target.value)}
                                            className="pl-9 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="party">Party Name</Label>
                                    <Input
                                        id="party"
                                        value={partyName}
                                        onChange={(e) => setPartyName(e.target.value)}
                                        placeholder="Payer Name"
                                        required
                                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="amount">Amount Received (₹)</Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="font-mono text-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="mode">Payment Mode</Label>
                                    <Select value={paymentMode} onValueChange={setPaymentMode}>
                                        <SelectTrigger className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                                            <SelectValue placeholder="Select mode" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Cheque">Cheque</SelectItem>
                                            <SelectItem value="Online">Online / UPI</SelectItem>
                                            <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="reference">Reference No. (Optional)</Label>
                                    <Input
                                        id="reference"
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                        placeholder="Cheque No, Transaction ID, etc."
                                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="remarks">Remarks</Label>
                                    <Input
                                        id="remarks"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        placeholder="Any additional notes..."
                                        className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <div className="md:col-span-2 pt-4 flex justify-end">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white min-w-[150px] shadow-lg hover:shadow-indigo-500/30 transition-all duration-300"
                                        disabled={submitting}
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 className="mr-2 h-5 w-5" />
                                                Confirm Payment
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </main>
                <Toaster />
            </div>
        </div>
    );
}
