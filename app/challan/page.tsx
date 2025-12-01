"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  MapPin,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
  const [filteredChallans, setFilteredChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchChallans();
  }, []);

  useEffect(() => {
    const filtered = challans.filter(
      (challan) =>
        challan.challanNo.toString().toLowerCase().includes(searchTerm.toLowerCase()) ||
        (challan.truckNo && challan.truckNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (challan.truckOwnerName && challan.truckOwnerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (challan.from && challan.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (challan.to && challan.to.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredChallans(filtered);
  }, [searchTerm, challans]);

  const fetchChallans = async () => {
    try {
      const response = await fetch('/api/challan', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch challans');
      }
      const challanData = await response.json();
      setChallans(challanData);
      setFilteredChallans(challanData);
    } catch (error) {
      console.error('Error fetching challans:', error);
      toast({
        title: "Error",
        description: "Failed to fetch challans",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this challan?")) {
      try {
        const response = await fetch(`/api/challan/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('Failed to delete challan');
        }

        toast({
          title: "Success",
          description: "Challan deleted successfully",
        });
        fetchChallans();
      } catch (error) {
        console.error('Error deleting challan:', error);
        toast({
          title: "Error",
          description: "Failed to delete challan",
          variant: "destructive",
        });
      }
    }
  };

  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A";
    
    try {
      // Handle Firestore Timestamp object
      if (dateValue?.seconds) {
        return new Date(dateValue.seconds * 1000).toLocaleDateString('en-GB');
      }
      // Handle ISO string or other date formats
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return "N/A";
      return date.toLocaleDateString('en-GB');
    } catch {
      return "N/A";
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Challans" subtitle="Manage delivery challans" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full bg-indigo-400/20 blur-xl animate-pulse"></div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Loading challans...</p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Challans" subtitle="Manage delivery challans" />
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Main Table Card */}
          <Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm slide-up">
            <CardHeader className="bg-gradient-to-r from-indigo-50/30 to-transparent border-b border-gray-100/50 pb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Truck className="h-5 w-5 text-indigo-600" />
                    Delivery Challans
                  </CardTitle>
                  <CardDescription className="text-gray-500">
                    {filteredChallans.length} of {challans.length} challans
                    {searchTerm && ` matching "${searchTerm}"`}
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search challans..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-full sm:w-80 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
                    />
                  </div>
                  <Link href="/challan/create">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challan
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredChallans.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Truck className="h-10 w-10 text-gray-300" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {searchTerm ? "No matching challans found" : "No challans created yet"}
                  </h3>
                  <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                    {searchTerm
                      ? "Try adjusting your search terms or clear the search"
                      : "Get started by creating your first challan"
                    }
                  </p>
                  {!searchTerm && (
                    <Link href="/challan/create">
                      <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Challan
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
                        <TableHead className="font-semibold text-gray-700">Challan No</TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-indigo-400" />
                            Date
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-gray-400" />
                            Truck No
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-gray-400" />
                            Route
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            Owner
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">Freight</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredChallans.map((challan) => (
                        <TableRow
                          key={challan.id}
                          className="hover:bg-indigo-50/30 transition-all duration-200 border-b border-gray-50 group"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                              <span className="text-gray-900 font-mono">#{challan.challanNo}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-gray-600 font-medium">
                              {formatDate(challan.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="font-mono bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">
                              {challan.truckNo}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="font-medium text-indigo-600">{challan.from}</span>
                              <span className="text-gray-300">→</span>
                              <span className="font-medium text-purple-600">{challan.to}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate font-medium text-gray-900">
                              {challan.truckOwnerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-bold text-gray-900">
                              ₹{challan.totalFreight?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48 shadow-xl border-gray-100 rounded-xl p-1">
                                <DropdownMenuItem
                                  onClick={() => window.open(`/challan/view/${challan.id}`, "_blank")}
                                  className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4 text-indigo-600" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => (window.location.href = `/challan/edit/${challan.id}`)}
                                  className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                                >
                                  <Edit className="mr-2 h-4 w-4 text-indigo-600" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(`/api/challan/${challan.id}/pdf`, "_blank")}
                                  className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
                                >
                                  <Download className="mr-2 h-4 w-4 text-indigo-600" />
                                  Download PDF
                                </DropdownMenuItem>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <DropdownMenuItem
                                  onClick={() => handleDelete(challan.id)}
                                  className="hover:bg-red-50 text-red-600 focus:bg-red-50 focus:text-red-700 rounded-lg cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
} 