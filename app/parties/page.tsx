"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Building2, Users, Phone, Mail, MapPin, FileText } from "lucide-react";
import { toast } from "sonner";

interface Party {
  id: string;
  name: string;
  gstin: string;
  type?: string;
  address?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>([]);
  const [filteredParties, setFilteredParties] = useState<Party[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentParty, setCurrentParty] = useState<Party | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    type: "",
    address: "",
    contactPerson: "",
    phone: "",
    email: "",
  });
  
  const [gstinError, setGstinError] = useState("");

  useEffect(() => {
    fetchParties();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredParties(parties);
    } else {
      const filtered = parties.filter(
        (party) =>
          party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (party.contactPerson &&
            party.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredParties(filtered);
    }
  }, [searchTerm, parties]);

  const fetchParties = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/parties");
      if (!response.ok) throw new Error("Failed to fetch parties");
      const data = await response.json();
      setParties(data.parties || []);
      setFilteredParties(data.parties || []);
    } catch (error) {
      console.error("Error fetching parties:", error);
      toast.error("Failed to load parties");
    } finally {
      setLoading(false);
    }
  };

  const validateGSTIN = (gstin: string): boolean => {
    // Real-world GSTIN format: 15 characters
    // Format: 2 digits (State Code) + 10 characters (PAN) + 1 digit + 1 letter + 1 alphanumeric
    // Some GSTINs have Z in position 13, some don't (like 37ACRPK5945P1K)
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[0-9A-Z]{3}$/;
    return gstin.length === 15 && gstinRegex.test(gstin);
  };
  
  const handleGstinChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setFormData({ ...formData, gstin: upperValue });
    
    if (upperValue.length === 0) {
      setGstinError("");
    } else if (upperValue.length !== 15) {
      setGstinError(`GSTIN must be exactly 15 characters (current: ${upperValue.length})`);
    } else if (!validateGSTIN(upperValue)) {
      setGstinError("Invalid GSTIN format (Example: 37ACRPK5945P1ZK)");
    } else {
      setGstinError("");
    }
  };

  const handleAddParty = async () => {
    if (!formData.name.trim()) {
      toast.error("Party name is required");
      return;
    }
    if (!formData.gstin.trim()) {
      toast.error("GSTIN is required");
      return;
    }
    if (!validateGSTIN(formData.gstin)) {
      toast.error("Invalid GSTIN format (15 characters: 2 digits, 5 letters, 4 digits, 1 letter, 1 alphanumeric, Z, 1 alphanumeric)");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/parties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add party");
      }

      toast.success("Party added successfully");
      setIsAddDialogOpen(false);
      resetForm();
      fetchParties();
    } catch (error: any) {
      console.error("Error adding party:", error);
      toast.error(error.message || "Failed to add party");
    } finally {
      setLoading(false);
    }
  };

  const handleEditParty = async () => {
    if (!currentParty) return;
    
    if (!formData.name.trim()) {
      toast.error("Party name is required");
      return;
    }
    if (!formData.gstin.trim()) {
      toast.error("GSTIN is required");
      return;
    }
    if (!validateGSTIN(formData.gstin)) {
      toast.error("Invalid GSTIN format");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/parties/${currentParty.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to update party");

      toast.success("Party updated successfully");
      setIsEditDialogOpen(false);
      setCurrentParty(null);
      resetForm();
      fetchParties();
    } catch (error) {
      console.error("Error updating party:", error);
      toast.error("Failed to update party");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParty = async () => {
    if (!currentParty) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/parties/${currentParty.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete party");

      toast.success("Party deleted successfully");
      setIsDeleteDialogOpen(false);
      setCurrentParty(null);
      fetchParties();
    } catch (error) {
      console.error("Error deleting party:", error);
      toast.error("Failed to delete party");
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (party: Party) => {
    setCurrentParty(party);
    setFormData({
      name: party.name,
      gstin: party.gstin,
      type: party.type || "",
      address: party.address || "",
      contactPerson: party.contactPerson || "",
      phone: party.phone || "",
      email: party.email || "",
    });
    setGstinError(""); // Clear any previous errors
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (party: Party) => {
    setCurrentParty(party);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      gstin: "",
      type: "",
      address: "",
      contactPerson: "",
      phone: "",
      email: "",
    });
    setGstinError("");
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header title="Party Management" subtitle="Manage your consignors and consignees" />
        <main className="flex-1 p-3 sm:p-6 space-y-4 sm:space-y-6">
          
          {/* Add Party Dialog */}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => resetForm()}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add New Party
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Party</DialogTitle>
                <DialogDescription>
                  Enter party details. Fields marked with <span className="text-red-500">*</span> are required.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                {/* Row 1: Party Name and GSTIN */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Party Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter party name"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gstin">
                      GSTIN <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="gstin"
                      value={formData.gstin}
                      onChange={(e) => handleGstinChange(e.target.value)}
                      placeholder="37ACRPK5945P1ZK"
                      maxLength={15}
                      required
                      className={gstinError ? "border-red-500" : ""}
                    />
                    {gstinError && (
                      <p className="text-sm text-red-500">{gstinError}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      15 characters: State(2) + PAN(10) + Registration(3)
                    </p>
                  </div>
                </div>

                {/* Row 2: Party Type and Contact Person */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Party Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                      placeholder="e.g., Consignor, Consignee"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPerson">Contact Person</Label>
                    <Input
                      id="contactPerson"
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({ ...formData, contactPerson: e.target.value })
                      }
                      placeholder="Contact person name"
                    />
                  </div>
                </div>

                {/* Row 3: Address */}
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Full address"
                  />
                </div>

                {/* Row 4: Phone and Email */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      placeholder="Phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder="email@example.com"
                    />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddParty} 
                  disabled={loading || !!gstinError || !formData.name.trim() || !formData.gstin.trim()}
                >
                  {loading ? "Adding..." : "Add Party"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Main Table Card */}
          <Card className="shadow-xl border-0 ring-1 ring-gray-200/50 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl">All Parties</CardTitle>
              <CardDescription>
                Search and manage your party database
              </CardDescription>
            </div>
          </div>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-400" />
            <Input
              placeholder="🔍 Search by name, GSTIN, or contact person..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-blue-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-12 text-base"
            />
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {loading && parties.length === 0 ? (
            <div className="text-center py-16 animate-pulse">
              <div className="inline-flex items-center gap-3 text-blue-600">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg font-medium">Loading parties...</span>
              </div>
            </div>
          ) : filteredParties.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex flex-col items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full">
                  <Building2 className="h-12 w-12 text-blue-600" />
                </div>
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {searchTerm ? "No parties found" : "No parties yet"}
                  </p>
                  <p className="text-gray-500 mt-1">
                    {searchTerm ? "Try a different search term" : "Click 'Add New Party' to get started"}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100">
                    <TableHead className="font-semibold text-blue-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Party Name
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-blue-900">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        GSTIN
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-blue-900">Type</TableHead>
                    <TableHead className="font-semibold text-blue-900">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Contact Person
                      </div>
                    </TableHead>
                    <TableHead className="font-semibold text-blue-900">
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-semibold text-blue-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParties.map((party, index) => (
                    <TableRow 
                      key={party.id}
                      className="hover:bg-blue-50/50 transition-all duration-200 animate-fade-in-up group"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            {party.name.charAt(0).toUpperCase()}
                          </div>
                          {party.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {party.gstin}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {party.type ? (
                          <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
                            {party.type}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {party.contactPerson || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {party.phone ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {party.phone}
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(party)}
                            className="hover:bg-blue-100 hover:text-blue-700"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(party)}
                            className="hover:bg-red-100 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Party</DialogTitle>
            <DialogDescription>
              Update party details. Fields marked with <span className="text-red-500">*</span> are required.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">
                  Party Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter party name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-gstin">
                  GSTIN <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="edit-gstin"
                  value={formData.gstin}
                  onChange={(e) => handleGstinChange(e.target.value)}
                  placeholder="37ACRPK5945P1ZK"
                  maxLength={15}
                  className={gstinError ? "border-red-500" : ""}
                />
                {gstinError && (
                  <p className="text-sm text-red-500">{gstinError}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  15 characters: State(2) + PAN(10) + Registration(3)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-type">Party Type</Label>
                <Input
                  id="edit-type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  placeholder="e.g., Consignor, Consignee"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-contactPerson">Contact Person</Label>
                <Input
                  id="edit-contactPerson"
                  value={formData.contactPerson}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPerson: e.target.value })
                  }
                  placeholder="Contact person name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Full address"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input
                  id="edit-phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  placeholder="Phone number"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleEditParty} 
              disabled={loading || !!gstinError || !formData.name.trim() || !formData.gstin.trim()}
            >
              {loading ? "Updating..." : "Update Party"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Party?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to permanently delete{" "}
              <strong>{currentParty?.name}</strong>
              {" "}with GSTIN{" "}
              <Badge variant="outline" className="font-mono text-xs">
                {currentParty?.gstin}
              </Badge>
              <br /><br />
              <span className="text-red-600">⚠️ This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteParty}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
        </main>
      </div>
    </div>
  );
}
