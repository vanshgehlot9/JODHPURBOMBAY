"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
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
	User,
	Users,
	UserCircle
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
	const [selectedParties, setSelectedParties] = useState<Set<string>>(new Set());
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
			toast({ title: "Error", description: "Failed to fetch data", variant: "destructive" });
		} finally {
			setLoading(false);
		}
	};

	const toggleSelectAll = () => {
		if (selectedParties.size === filteredParties.length) {
			setSelectedParties(new Set());
		} else {
			setSelectedParties(new Set(filteredParties.map(p => p.id)));
		}
	};

	const toggleSelectParty = (id: string) => {
		const newSelected = new Set(selectedParties);
		if (newSelected.has(id)) newSelected.delete(id);
		else newSelected.add(id);
		setSelectedParties(newSelected);
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
				description: `Client ${editingParty ? 'updated' : 'created'} successfully`,
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
		if (!confirm("Permanently remove this client?")) return;
		try {
			const response = await fetch(`/api/parties/${id}`, { method: 'DELETE' });
			if (!response.ok) throw new Error('Failed to delete party');

			toast({ title: "Success", description: "Client removed successfully" });
			setParties(prev => prev.filter(p => p.id !== id));
		} catch (error) {
			toast({ title: "Error", description: "Failed to delete client", variant: "destructive" });
		}
	};

	if (loading) return (
		<div className="flex flex-col justify-center items-center h-screen bg-[#FAFAFA] gap-4">
			<div className="relative">
				<div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-indigo-600"></div>
				<div className="absolute inset-0 flex items-center justify-center">
					<div className="h-4 w-4 bg-indigo-600 rounded-full animate-pulse"></div>
				</div>
			</div>
			<p className="text-gray-400 font-medium tracking-wide text-sm animate-pulse">LOADING CLIENT REGISTRY...</p>
		</div>
	);

	return (
		<div className="flex min-h-screen flex-col md:flex-row bg-[#FAFAFA]">
			<Sidebar />
			<div className="flex-1 flex flex-col min-w-0">
				<Header title="Client Registry" subtitle="Directory of consignors and consignees" />

				<main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-y-auto pb-24">
					{/* Controls */}
					<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
						<div className="relative w-full sm:w-96 group">
							<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
								<Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
							</div>
							<Input
								placeholder="Search Name, GSTIN, or Contact..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="pl-10 h-12 bg-white border-gray-200 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 rounded-xl shadow-sm text-base transition-all"
							/>
						</div>

						<Dialog open={isDialogOpen} onOpenChange={(open) => {
							setIsDialogOpen(open);
							if (!open) resetForm();
						}}>
							<DialogTrigger asChild>
								<Button className="w-full sm:w-auto bg-[#1E1B4B] text-white hover:bg-[#2A275E] h-12 px-6 rounded-xl font-bold shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
									<Plus className="h-4 w-4 mr-2" />
									New Client
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0 overflow-hidden border-0 shadow-2xl rounded-2xl">
								<DialogHeader className="bg-gray-50/80 border-b border-gray-100 p-6 pb-4 backdrop-blur-sm">
									<DialogTitle className="text-xl font-black text-[#1E1B4B] flex items-center gap-3">
										<div className="bg-indigo-100 p-2.5 rounded-xl">
											<Building2 className="h-6 w-6 text-indigo-700" />
										</div>
										{editingParty ? "Edit Client Details" : "Register New Client"}
									</DialogTitle>
									<DialogDescription className="text-gray-500 ml-14 font-medium">
										{editingParty ? "Update the client's business and contact information." : "Enter the details to add a new consignor or consignee to your registry."}
									</DialogDescription>
								</DialogHeader>
								<form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
										<div className="space-y-2">
											<Label htmlFor="name" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Party Name <span className="text-red-500">*</span></Label>
											<Input
												id="name"
												name="name"
												value={formData.name}
												onChange={handleInputChange}
												placeholder="Business Name"
												required
												className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all font-bold h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="gstin" className="text-xs font-bold text-gray-500 uppercase tracking-wide">GSTIN <span className="text-red-500">*</span></Label>
											<Input
												id="gstin"
												name="gstin"
												value={formData.gstin}
												onChange={handleInputChange}
												placeholder="15 Digit GST"
												required
												maxLength={15}
												className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all font-mono font-medium h-11 uppercase"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="type" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Client Type</Label>
											<Select value={formData.type} onValueChange={handleSelectChange}>
												<SelectTrigger className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 h-11">
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
											<Label htmlFor="contactPerson" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Contact Person</Label>
											<Input
												id="contactPerson"
												name="contactPerson"
												value={formData.contactPerson}
												onChange={handleInputChange}
												placeholder="Manager Name"
												className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Phone</Label>
											<Input
												id="phone"
												name="phone"
												value={formData.phone}
												onChange={handleInputChange}
												placeholder="Phone Number"
												type="tel"
												className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all h-11"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Email</Label>
											<Input
												id="email"
												name="email"
												value={formData.email}
												onChange={handleInputChange}
												placeholder="Email Address"
												type="email"
												className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all h-11"
											/>
										</div>
										<div className="space-y-2 sm:col-span-2">
											<Label htmlFor="address" className="text-xs font-bold text-gray-500 uppercase tracking-wide">Address</Label>
											<Input
												id="address"
												name="address"
												value={formData.address}
												onChange={handleInputChange}
												placeholder="Full Business Address"
												className="bg-gray-50 border-transparent focus:bg-white focus:border-indigo-200 focus:ring-4 focus:ring-indigo-50 transition-all h-11"
											/>
										</div>
									</div>
									<DialogFooter className="pt-6 border-t border-gray-100 flex gap-3">
										<Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="hover:bg-gray-100 text-gray-500 h-11 font-medium">Cancel</Button>
										<Button type="submit" disabled={isSubmitting} className="bg-[#1E1B4B] hover:bg-[#2A275E] h-11 px-8 rounded-xl font-bold tracking-wide shadow-lg shadow-indigo-900/20 active:scale-95 transition-all">
											{isSubmitting ? "Saving..." : (editingParty ? "Save Changes" : "Register Client")}
										</Button>
									</DialogFooter>
								</form>
							</DialogContent>
						</Dialog>
					</div>

					{/* Operational List */}
					<div className="space-y-4">
						{/* Header Row */}
						<div className="hidden md:grid grid-cols-[auto_2fr_1.5fr_1.5fr_1.5fr_40px] gap-4 px-6 py-3 bg-[#1E1B4B]/5 rounded-xl border border-[#1E1B4B]/10 text-xs font-bold text-[#1E1B4B] uppercase tracking-wider items-center">
							<div className="flex justify-center w-8">
								<Checkbox
									checked={filteredParties.length > 0 && selectedParties.size === filteredParties.length}
									onCheckedChange={toggleSelectAll}
									className="border-indigo-300 data-[state=checked]:bg-[#1E1B4B] data-[state=checked]:border-[#1E1B4B]"
								/>
							</div>
							<div>Organization</div>
							<div>GSTIN & Role</div>
							<div>Contact Details</div>
							<div>Address</div>
							<div></div>
						</div>

						{/* Rows */}
						<div className="space-y-3">
							{filteredParties.length === 0 ? (
								<div className="p-16 text-center bg-white rounded-[2rem] border border-dashed border-gray-200">
									<div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
										<Users className="h-8 w-8 text-gray-300" />
									</div>
									<h3 className="text-lg font-bold text-gray-900 mb-1">No Clients Found</h3>
									<p className="text-gray-500 max-w-sm mx-auto">Add new clients to your registry to streamline bilty creation.</p>
								</div>
							) : (
								<AnimatePresence>
									{filteredParties.map((party, index) => (
										<motion.div
											key={party.id}
											initial={{ opacity: 0, y: 10 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.05, duration: 0.3 }}
											className={cn(
												"group flex flex-col items-stretch md:grid md:grid-cols-[auto_2fr_1.5fr_1.5fr_1.5fr_40px] gap-3 p-4 sm:gap-4 sm:p-5 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-900/5 transition-all cursor-default relative overflow-hidden",
												selectedParties.has(party.id) && "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200"
											)}
										>
											{/* Hover Gradient Bar */}
											<div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity" />

											{/* Checkbox */}
											<div className="flex justify-center w-8 self-center md:self-auto order-1 md:order-none mb-2 md:mb-0">
												<Checkbox
													checked={selectedParties.has(party.id)}
													onCheckedChange={() => toggleSelectParty(party.id)}
													className={cn(
														"border-gray-200",
														selectedParties.has(party.id) ? "data-[state=checked]:bg-[#1E1B4B] data-[state=checked]:border-[#1E1B4B] opacity-100" : "opacity-0 group-hover:opacity-100 transition-opacity"
													)}
												/>
											</div>

											{/* Client Name */}
											<div className="flex items-center gap-4 order-2 md:order-none mb-2 md:mb-0">
												<div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm shadow-sm group-hover:scale-105 transition-transform">
													{party.name.substring(0, 2).toUpperCase()}
												</div>
												<span className="text-sm font-bold text-gray-900 truncate max-w-[220px] group-hover:text-[#1E1B4B] transition-colors">{party.name}</span>
											</div>

											{/* GSTIN & Type */}
											<div className="flex flex-col gap-1.5 align-top order-3 md:order-none mb-2 md:mb-0">
												<div className="flex items-center gap-2">
													<Building2 className="h-3.5 w-3.5 text-gray-400" />
													<span className="font-mono text-xs font-bold text-gray-700">{party.gstin}</span>
												</div>
												<div>
													<span className={cn(
														"inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide border",
														party.type === 'consignor' ? 'bg-blue-50 text-blue-700 border-blue-100' :
															party.type === 'consignee' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
																'bg-purple-50 text-purple-700 border-purple-100'
													)}>
														{party.type || 'Both'}
													</span>
												</div>
											</div>

											{/* Contact Info */}
											<div className="flex flex-col gap-1.5 order-4 md:order-none mb-2 md:mb-0">
												{party.contactPerson && (
													<div className="flex items-center gap-2 text-xs text-gray-900 font-bold">
														<UserCircle className="h-3.5 w-3.5 text-gray-400" />
														{party.contactPerson}
													</div>
												)}
												<div className="flex flex-col gap-0.5 mt-0.5">
													{party.phone && (
														<div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium">
															<Phone className="h-3 w-3 text-gray-400" />
															{party.phone}
														</div>
													)}
													{party.email && (
														<div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium truncate max-w-[180px]">
															<Mail className="h-3 w-3 text-gray-400" />
															{party.email}
														</div>
													)}
												</div>
											</div>

											{/* Address */}
											<div className="flex items-start gap-2 text-xs text-gray-500 group-hover:text-gray-700 transition-colors order-5 md:order-none">
												<MapPin className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
												<span className="truncate leading-snug max-w-[200px]" title={party.address}>{party.address || "No address provided"}</span>
											</div>

											{/* Actions */}
											<div className="flex justify-end pr-2 order-1 md:order-none absolute top-4 right-2 md:static md:top-auto md:right-auto">
												<DropdownMenu>
													<DropdownMenuTrigger asChild>
														<Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-[#1E1B4B] hover:bg-indigo-50 rounded-full opacity-0 group-hover:opacity-100 transition-all data-[state=open]:opacity-100 data-[state=open]:bg-indigo-50 data-[state=open]:text-[#1E1B4B]">
															<MoreHorizontal className="h-5 w-5" />
														</Button>
													</DropdownMenuTrigger>
													<DropdownMenuContent align="end" className="w-56 p-2 rounded-xl shadow-xl border-gray-100">
														<DropdownMenuItem onClick={() => handleEditClick(party)} className="cursor-pointer rounded-lg py-2.5 font-medium text-gray-700 focus:text-indigo-700 focus:bg-indigo-50">
															<div className="h-8 w-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 text-gray-500 border border-gray-200">
																<Edit className="h-4 w-4" />
															</div>
															Edit Details
														</DropdownMenuItem>
														<DropdownMenuSeparator className="my-1" />
														<DropdownMenuItem onClick={() => handleDelete(party.id)} className="text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer rounded-lg py-2.5 font-medium">
															<div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center mr-3 text-red-500 border border-red-100">
																<Trash2 className="h-4 w-4" />
															</div>
															Delete Client
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
