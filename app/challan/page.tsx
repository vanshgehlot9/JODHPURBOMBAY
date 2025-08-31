"use client";
import React, { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Download, Eye, Edit, Trash2, MoreHorizontal, FileText, Plus, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Challan {
  id: string;
  challanNo: string;
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
        challan.challanNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.truckNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        challan.to.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredChallans(filtered);
  }, [searchTerm, challans]);

  const fetchChallans = async () => {
    try {
      const q = query(collection(db, "challans"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const challanData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Challan));
      setChallans(challanData);
      setFilteredChallans(challanData);
    } catch (error) {
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
        // Add delete logic here
        toast({
          title: "Success",
          description: "Challan deleted successfully",
        });
        fetchChallans();
      } catch (error) {
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
      <div className="flex min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header title="Challans" subtitle="Manage delivery challans" />
          <main className="flex-1 p-6">
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading challans...</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Challans" subtitle="Manage delivery challans" />
        <main className="flex-1 p-6 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Delivery Challans
                  </CardTitle>
                  <CardDescription>
                    {filteredChallans.length} of {challans.length} challans
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search challans..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Link href="/challan/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Challan
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Challan No</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Truck No</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Freight</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredChallans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Truck className="h-8 w-8 text-gray-400" />
                            <p className="text-muted-foreground">No challans found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredChallans.map((challan) => (
                        <TableRow key={challan.id}>
                          <TableCell className="font-medium">#{challan.challanNo}</TableCell>
                          <TableCell>{formatDate(challan.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{challan.truckNo}</Badge>
                          </TableCell>
                          <TableCell>
                            {challan.from} → {challan.to}
                          </TableCell>
                          <TableCell>{challan.ownerName}</TableCell>
                          <TableCell>₹{challan.totalFreight?.toFixed(2) || "0.00"}</TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => window.open(`/challan/view/${challan.id}`, "_blank")}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => (window.location.href = `/challan/edit/${challan.id}`)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDelete(challan.id)} className="text-red-600">
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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