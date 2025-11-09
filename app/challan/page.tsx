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
  ownerName: string;
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
        (challan.ownerName && challan.ownerName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (challan.from && challan.from.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (challan.to && challan.to.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredChallans(filtered);
  }, [searchTerm, challans]);

  const fetchChallans = async () => {
    try {
      const response = await fetch('/api/challan');
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Challans" subtitle="Manage delivery challans" />
          <main className="flex-1 p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center space-y-4">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
                  <div className="absolute inset-0 rounded-full bg-blue-400/20 blur-xl animate-pulse"></div>
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
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Challans" subtitle="Manage delivery challans" />
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          {/* Main Table Card */}
          <Card className="shadow-sm border-0 ring-1 ring-gray-200/50 slide-up">
            <CardHeader className="bg-gradient-to-r from-gray-50/50 to-transparent border-b border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Truck className="h-5 w-5 text-blue-600" />
                    Delivery Challans
                  </CardTitle>
                  <CardDescription>
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
                      className="pl-10 w-full sm:w-80 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Link href="/challan/create">
                    <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300">
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
                  <Truck className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {searchTerm ? "No matching challans found" : "No challans created yet"}
                  </h3>
                  <p className="text-gray-500 mb-6">
                    {searchTerm 
                      ? "Try adjusting your search terms or clear the search"
                      : "Get started by creating your first challan"
                    }
                  </p>
                  {!searchTerm && (
                    <Link href="/challan/create">
                      <Button className="bg-blue-600 hover:bg-blue-700">
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
                      <TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-200">
                        <TableHead className="font-semibold text-gray-700">Challan No</TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Truck No
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Route
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-gray-700">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
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
                          className="hover:bg-blue-50/30 transition-colors border-b border-gray-100 group"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              #{challan.challanNo}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(challan.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono">{challan.truckNo}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <span className="font-medium text-blue-600">{challan.from}</span>
                              <span className="text-gray-400">→</span>
                              <span className="font-medium text-purple-600">{challan.to}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-[150px] truncate font-medium text-gray-900">
                              {challan.ownerName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold text-green-600">
                              ₹{challan.totalFreight?.toFixed(2) || "0.00"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={() => window.open(`/challan/view/${challan.id}`, "_blank")}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => (window.location.href = `/challan/edit/${challan.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => window.open(`/api/challan/${challan.id}/pdf`, "_blank")}>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDelete(challan.id)}
                                  className="text-red-600 focus:text-red-600"
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