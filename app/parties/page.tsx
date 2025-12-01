"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
	Search,
	Plus,
	MoreHorizontal,
	Edit,
	Trash2,
	Building2,
	Phone,
	Mail,
	MapPin,
	FileText,
	User
} from "lucide-react";

interface Party {
	id: string;
	name: string;
	gstin: string;
	type?: 'consignor' | 'consignee' | 'both';
	address?: string;
	contactPerson?: string;
	phone?: string;
	email?: string;
}

export default function PartiesPage() {
	const [parties, setParties] = useState<Party[]>([]);
	const [filteredParties, setFilteredParties] = useState<Party[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchTerm, setSearchTerm] = useState("");
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [editingParty, setEditingParty] = useState<Party | null>(null);
	const { toast } = useToast();

	// Form State
	const [formData, setFormData] = useState({
		name: "",
		gstin: "",
		type: "both",
		address: "",
		contactPerson: "",
		phone: "",
		email: ""
	});

	useEffect(() => {
		fetchParties();
	}, []);

	useEffect(() => {
		const filtered = parties.filter(
			(party) =>
				party.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
				party.gstin.toLowerCase().includes(searchTerm.toLowerCase()) ||
				(party.contactPerson && party.contactPerson.toLowerCase().includes(searchTerm.toLowerCase()))
		);
		setFilteredParties(filtered);
	}, [searchTerm, parties]);

	const fetchParties = async () => {
		try {
			const response = await fetch('/api/parties', { cache: 'no-store' });
			if (!response.ok) throw new Error('Failed to fetch parties');
			const data = await response.json();
			setParties(data.parties || []);
			setFilteredParties(data.parties || []);
		} catch (error) {
			console.error('Error fetching parties:', error);
			toast({
				title: "Error",
				description: "Failed to fetch parties",
				variant: "destructive",
			});
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
	};

	const handleSelectChange = (value: string) => {
		setFormData(prev => ({ ...prev, type: value }));
	};

	const resetForm = () => {
		setFormData({
			name: "",
			gstin: "",
			type: "both",
			address: "",
			contactPerson: "",
			phone: "",
			email: ""
		});
		setEditingParty(null);
	};

	const handleEditClick = (party: Party) => {
		setEditingParty(party);
		setFormData({
			name: party.name,
			gstin: party.gstin,
			type: party.type || "both",
			address: party.address || "",
			contactPerson: party.contactPerson || "",
			phone: party.phone || "",
			email: party.email || ""
		});
		setIsDialogOpen(true);
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsSubmitting(true);

		try {
			const url = editingParty ? `/api/parties/${editingParty.id}` : '/api/parties';
			const method = editingParty ? 'PUT' : 'POST';

			const response = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || 'Failed to save party');
			}

			toast({
				title: "Success",
				description: `Party ${editingParty ? 'updated' : 'created'} successfully`,
			});

			setIsDialogOpen(false);
			resetForm();
			fetchParties();
		} catch (error: any) {
			toast({
				title: "Error",
				description: error.message,
				variant: "destructive",
			});
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async (id: string) => {
		if (!confirm("Are you sure you want to delete this party?")) return;

		try {
			const response = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
			if (!response.ok) throw new Error('Failed to delete party');

			toast({
				title: "Success",
				description: "Party deleted successfully",
			});
			fetchParties();
		} catch (error) {
			console.error('Error deleting party:', error);
			toast({
				title: "Error",
				description: "Failed to delete party",
				variant: "destructive",
			});
		}
	};

	if (loading) {
		return (
			<div className="flex min-h-screen bg-gray-50">
				<Sidebar />
				<div className="flex-1 flex flex-col">
					<Header title="Parties" subtitle="Manage your parties" />
					<main className="flex-1 p-6 flex items-center justify-center">
						<div className="flex flex-col items-center gap-4">
							<div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
							<p className="text-gray-500 font-medium">Loading parties...</p>
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
				<Header title="Parties" subtitle="Manage your parties" />
				<main className="flex-1 p-3 sm:p-6 space-y-6">
					<Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="bg-gradient-to-r from-indigo-50/30 to-transparent border-b border-gray-100/50 pb-6">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div>
									<CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
										<Building2 className="h-5 w-5 text-indigo-600" />
										All Parties
									</CardTitle>
									<CardDescription className="text-gray-500">
										Manage your consignors and consignees
									</CardDescription>
								</div>
								<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
										<Input
											placeholder="Search parties..."
											value={searchTerm}
											onChange={(e) => setSearchTerm(e.target.value)}
											className="pl-10 w-full sm:w-80 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white border-gray-200"
										/>
									</div>

									<Dialog open={isDialogOpen} onOpenChange={(open) => {
										setIsDialogOpen(open);
										if (!open) resetForm();
									}}>
										<DialogTrigger asChild>
											<Button className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
												<Plus className="h-4 w-4 mr-2" />
												Add Party
											</Button>
										</DialogTrigger>
										<DialogContent className="sm:max-w-[600px]">
											<DialogHeader>
												<DialogTitle>{editingParty ? "Edit Party" : "Add New Party"}</DialogTitle>
												<DialogDescription>
													{editingParty ? "Update the party details below." : "Enter the details for the new party."}
												</DialogDescription>
											</DialogHeader>
											<form onSubmit={handleSubmit} className="space-y-4 py-4">
												<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
													<div className="space-y-2">
														<Label htmlFor="name">Party Name *</Label>
														<Input
															id="name"
															name="name"
															value={formData.name}
															onChange={handleInputChange}
															placeholder="Enter party name"
															required
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="gstin">GSTIN *</Label>
														<Input
															id="gstin"
															name="gstin"
															value={formData.gstin}
															onChange={handleInputChange}
															placeholder="Enter GSTIN"
															required
															maxLength={15}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="type">Party Type</Label>
														<Select value={formData.type} onValueChange={handleSelectChange}>
															<SelectTrigger>
																<SelectValue placeholder="Select type" />
															</SelectTrigger>
															<SelectContent>
																<SelectItem value="consignor">Consignor</SelectItem>
																<SelectItem value="consignee">Consignee</SelectItem>
																<SelectItem value="both">Both</SelectItem>
															</SelectContent>
														</Select>
													</div>
													<div className="space-y-2">
														<Label htmlFor="contactPerson">Contact Person</Label>
														<Input
															id="contactPerson"
															name="contactPerson"
															value={formData.contactPerson}
															onChange={handleInputChange}
															placeholder="Enter contact person"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="phone">Phone Number</Label>
														<Input
															id="phone"
															name="phone"
															value={formData.phone}
															onChange={handleInputChange}
															placeholder="Enter phone number"
															type="tel"
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor="email">Email Address</Label>
														<Input
															id="email"
															name="email"
															value={formData.email}
															onChange={handleInputChange}
															placeholder="Enter email address"
															type="email"
														/>
													</div>
													<div className="space-y-2 sm:col-span-2">
														<Label htmlFor="address">Address</Label>
														<Input
															id="address"
															name="address"
															value={formData.address}
															onChange={handleInputChange}
															placeholder="Enter complete address"
														/>
													</div>
												</div>
												<DialogFooter className="pt-4">
													<Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
														Cancel
													</Button>
													<Button type="submit" disabled={isSubmitting} className="bg-indigo-600 hover:bg-indigo-700">
														{isSubmitting ? "Saving..." : (editingParty ? "Update Party" : "Create Party")}
													</Button>
												</DialogFooter>
											</form>
										</DialogContent>
									</Dialog>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-0">
							{filteredParties.length === 0 ? (
								<div className="text-center py-16">
									<div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
										<Building2 className="h-10 w-10 text-gray-300" />
									</div>
									<h3 className="text-lg font-bold text-gray-900 mb-2">
										{searchTerm ? "No matching parties found" : "No parties added yet"}
									</h3>
									<p className="text-gray-500 mb-8 max-w-sm mx-auto">
										{searchTerm
											? "Try adjusting your search terms or clear the search"
											: "Get started by adding your first party"
										}
									</p>
								</div>
							) : (
								<div className="overflow-x-auto">
									<Table>
										<TableHeader>
											<TableRow className="bg-gray-50/50 hover:bg-gray-50/50 border-b border-gray-100">
												<TableHead className="font-semibold text-gray-700">Party Name</TableHead>
												<TableHead className="font-semibold text-gray-700">GSTIN</TableHead>
												<TableHead className="font-semibold text-gray-700">Type</TableHead>
												<TableHead className="font-semibold text-gray-700">Contact</TableHead>
												<TableHead className="font-semibold text-gray-700">Address</TableHead>
												<TableHead className="font-semibold text-gray-700 text-center">Actions</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{filteredParties.map((party) => (
												<TableRow
													key={party.id}
													className="hover:bg-indigo-50/30 transition-all duration-200 border-b border-gray-50 group"
												>
													<TableCell className="font-medium">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs">
																{party.name.substring(0, 2).toUpperCase()}
															</div>
															<span className="text-gray-900">{party.name}</span>
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-center gap-2">
															<FileText className="h-3 w-3 text-gray-400" />
															<span className="font-mono text-sm text-gray-600">{party.gstin}</span>
														</div>
													</TableCell>
													<TableCell>
														<span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                              ${party.type === 'consignor' ? 'bg-blue-100 text-blue-800' :
																party.type === 'consignee' ? 'bg-green-100 text-green-800' :
																	'bg-purple-100 text-purple-800'}`}>
															{party.type || 'Both'}
														</span>
													</TableCell>
													<TableCell>
														<div className="flex flex-col gap-1 text-sm">
															{party.contactPerson && (
																<div className="flex items-center gap-1.5 text-gray-700">
																	<User className="h-3 w-3 text-gray-400" />
																	{party.contactPerson}
																</div>
															)}
															{party.phone && (
																<div className="flex items-center gap-1.5 text-gray-500">
																	<Phone className="h-3 w-3 text-gray-400" />
																	{party.phone}
																</div>
															)}
														</div>
													</TableCell>
													<TableCell>
														<div className="flex items-start gap-1.5 max-w-[200px] text-sm text-gray-600">
															<MapPin className="h-3 w-3 text-gray-400 mt-0.5 shrink-0" />
															<span className="truncate">{party.address || "N/A"}</span>
														</div>
													</TableCell>
													<TableCell className="text-center">
														<DropdownMenu>
															<DropdownMenuTrigger asChild>
																<Button
																	variant="ghost"
																	className="h-8 w-8 p-0 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full"
																>
																	<MoreHorizontal className="h-4 w-4" />
																</Button>
															</DropdownMenuTrigger>
															<DropdownMenuContent align="end" className="w-40 shadow-xl border-gray-100 rounded-xl p-1">
																<DropdownMenuItem
																	onClick={() => handleEditClick(party)}
																	className="hover:bg-indigo-50 rounded-lg focus:bg-indigo-50 cursor-pointer"
																>
																	<Edit className="mr-2 h-4 w-4 text-indigo-600" />
																	Edit
																</DropdownMenuItem>
																<DropdownMenuItem
																	onClick={() => handleDelete(party.id)}
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
