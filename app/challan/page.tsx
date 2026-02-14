"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Download,
  Eye,
  Edit,
  Trash2,
  MoreHorizontal,
  Plus,
  Truck,
  Calendar,
  ArrowRight,
  FileText,
  MapPin,
  UserCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Challan {
  id: string;
  challanNo: number;
  date: string;
  truckNo: string;
  from: string;
  to: string;
  truckOwnerName: string;
  totalFreight: number;
}

export default function ChallanListPage() {
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChallans, setSelectedChallans] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchChallans();
  }, []);

  const fetchChallans = async () => {
    try {
      const response = await fetch('/api/challan', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch challans');
      const data = await response.json();
      setChallans(data);
    } catch (error) {
      console.error('Error fetching challans:', error);
      toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredChallans = useMemo(() => {
    return challans.filter((c) =>
      c.challanNo.toString().includes(searchTerm) ||
      (c.truckNo && c.truckNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.truckOwnerName && c.truckOwnerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.from && c.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.to && c.to.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [challans, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!confirm("Permanently delete this manifest?")) return;
    try {
      const response = await fetch(`/api/challan/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      setChallans(prev => prev.filter(c => c.id !== id));
      toast({ title: "Success", description: "Manifest record deleted" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete record", variant: "destructive" });
    }
  };

  const toggleSelectAll = () => {
    if (selectedChallans.size === filteredChallans.length) {
      setSelectedChallans(new Set());
    } else {
      setSelectedChallans(new Set(filteredChallans.map(c => c.id)));
    }
  };

  const toggleSelectChallan = (id: string) => {
    const newSelected = new Set(selectedChallans);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedChallans(newSelected);
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A";
    try {
      // Handle Firestore Timestamp or string
      const d = dateValue?.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return "N/A"; }
  };

  if (loading) return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#FAFAFA] gap-4">
      <div className="relative">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-4 bg-indigo-600 rounded-full animate-pulse"></div>
        </div>
      </div>
      <p className="text-gray-400 font-medium tracking-wide text-sm animate-pulse">LOADING FLEET DATA...</p>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Trip Manifests" subtitle="Active fleet and delivery tracking" />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto pb-24">

          {/* Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <Input
                placeholder="Search Manifest, Truck, or Route..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 rounded-xl shadow-sm text-base transition-all"
              />
            </div>

            <Link href="/challan/create" className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#1E1B4B] text-white hover:bg-[#2A275E] h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
                <Plus className="h-4 w-4 mr-2" />
                New Manifest
              </Button>
            </Link>
          </div>

          {/* Operational List */}
          <div className="space-y-4">
            {/* Header Row */}
            <div className="hidden md:grid grid-cols-[auto_100px_1fr_1.5fr_1fr_120px_40px] gap-4 px-6 py-3 bg-[#1E1B4B]/5 rounded-xl border border-[#1E1B4B]/10 text-xs font-bold text-[#1E1B4B] uppercase tracking-wider items-center">
              <div className="flex justify-center w-8">
                <Checkbox
                  checked={filteredChallans.length > 0 && selectedChallans.size === filteredChallans.length}
                  onCheckedChange={toggleSelectAll}
                  className="border-indigo-300 data-[state=checked]:bg-[#1E1B4B] data-[state=checked]:border-[#1E1B4B]"
                />
              </div>
              <div>ID</div>
              <div>Manifest Date</div>
              <div>Route Details</div>
              <div>Vehicle & Owner</div>
              <div className="text-right">Freight</div>
              <div></div>
            </div>

            {/* Rows */}
            <div className="space-y-3">
              {filteredChallans.length === 0 ? (
                <div className="p-16 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
                  <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="h-8 w-8 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Manifests</h3>
                  <p className="text-gray-500 max-w-sm mx-auto">Create a new trip manifest to start tracking your fleet movements.</p>
                </div>
              ) : (
                <AnimatePresence>
                  {filteredChallans.map((challan, index) => (
                    <motion.div
                      key={challan.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                      className={cn(
                        "group flex flex-col items-stretch md:grid md:grid-cols-[auto_100px_1fr_1.5fr_1fr_120px_40px] gap-3 p-4 sm:gap-4 sm:p-5 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5 transition-all cursor-default relative overflow-hidden",
                        selectedChallans.has(challan.id) && "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200"
                      )}
                    >
                      {/* Hover Gradient Bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                      {/* Checkbox */}
                      <div className="flex items-center w-8 justify-center self-center md:self-auto order-1 md:order-none mb-2 md:mb-0">
                        <Checkbox
                          checked={selectedChallans.has(challan.id)}
                          onCheckedChange={() => toggleSelectChallan(challan.id)}
                          className={cn(
                            "border-gray-200",
                            selectedChallans.has(challan.id) ? "data-[state=checked]:bg-[#1E1B4B] data-[state=checked]:border-[#1E1B4B] opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
                          )}
                        />
                      </div>

                      {/* ID & Date Container (Mobile Order 1) */}
                      <div className="flex flex-row justify-between items-center md:contents order-2 md:order-none">
                        {/* ID */}
                        <div className="font-black text-gray-900 text-lg tracking-tight group-hover:text-indigo-700 transition-colors">
                          #{challan.challanNo}
                        </div>

                        {/* Date */}
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                          <Calendar className="h-3.5 w-3.5 text-gray-400" />
                          {formatDate(challan.date)}
                        </div>
                      </div>

                      {/* Route (Mobile Order 2) */}
                      <div className="flex items-center gap-3 order-3 md:order-none my-2 md:my-0 bg-gray-50/50 p-2 rounded-lg md:bg-transparent md:p-0">
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-bold text-gray-900 leading-none truncate">{challan.from}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Origin</span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-gray-300 flex-shrink-0" />
                        <div className="flex flex-col text-right md:text-left min-w-0 flex-1">
                          <span className="text-sm font-bold text-indigo-900 leading-none truncate">{challan.to}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mt-1">Dest</span>
                        </div>
                      </div>

                      {/* Truck & Owner & Freight Container (Mobile Order 3) */}
                      <div className="flex flex-row justify-between items-center md:contents order-4 md:order-none">
                        {/* Truck & Owner */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 font-bold font-mono tracking-tight px-2">
                              <Truck className="h-3 w-3 mr-1.5" />
                              {challan.truckNo}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 ml-1">
                            <UserCircle className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate max-w-[140px]" title={challan.truckOwnerName}>{challan.truckOwnerName || "Unknown Owner"}</span>
                          </div>
                        </div>

                        {/* Freight */}
                        <div className="text-right">
                          <div className="font-black text-gray-900 text-base tracking-tight group-hover:text-[#1E1B4B] transition-colors">
                            ₹{challan.totalFreight?.toLocaleString('en-IN') || "0"}
                          </div>
                          <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wide mt-0.5">Freight</div>
                        </div>
                      </div>

                      {/* Actions (Mobile Order 1 - Absolute Top Right) */}
                      <div className="flex justify-end order-1 md:order-none absolute top-4 right-2 md:static md:top-auto md:right-auto">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-[#1E1B4B] hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all data-[state=open]:opacity-100 data-[state=open]:bg-indigo-50 data-[state=open]:text-[#1E1B4B]">
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-gray-100">
                            <DropdownMenuItem onClick={() => window.open(`/challan/view/${challan.id}`, "_blank")} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                                <Eye className="h-4 w-4" />
                              </div>
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => window.location.href = `/challan/edit/${challan.id}`} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                                <Edit className="h-4 w-4" />
                              </div>
                              Edit Manifest
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem onClick={() => window.open(`/api/challan/${challan.id}/pdf`, "_blank")} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                                <FileText className="h-4 w-4" />
                              </div>
                              View PDF
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              const link = document.createElement('a');
                              link.href = `/api/challan/${challan.id}/pdf`;
                              link.download = `challan_${challan.challanNo}.pdf`;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
                              <div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
                                <Download className="h-4 w-4" />
                              </div>
                              Download PDF
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="my-1" />
                            <DropdownMenuItem onClick={() => handleDelete(challan.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-lg py-2.5 font-medium">
                              <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 text-red-500 border border-red-100">
                                <Trash2 className="h-4 w-4" />
                              </div>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}