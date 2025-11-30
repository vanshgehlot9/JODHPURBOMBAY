"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export default function PartiesPage() {
	return (
		<div className="flex min-h-screen bg-gray-50">
			<Sidebar />
			<div className="flex-1 flex flex-col">
				<Header title="Parties" subtitle="Manage consignors and consignees" />
				<main className="flex-1 p-3 sm:p-6 space-y-6">
					<Card className="shadow-lg border-0 ring-0 bg-white/80 backdrop-blur-sm">
						<CardHeader className="border-b border-gray-100/50 pb-6">
							<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
								<div>
									<CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
										<Users className="h-5 w-5 text-indigo-600" />
										Parties Directory
									</CardTitle>
									<CardDescription className="text-gray-500">
										Manage your client database
									</CardDescription>
								</div>
								<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
									<div className="relative">
										<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
										<Input
											placeholder="Search parties..."
											className="pl-10 w-full sm:w-80 h-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50/50 border-gray-200"
										/>
									</div>
									<Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
										<Plus className="h-4 w-4 mr-2" />
										Add Party
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className="p-12 text-center">
							<div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
								<Users className="h-10 w-10 text-indigo-300" />
							</div>
							<h3 className="text-lg font-bold text-gray-900 mb-2">
								Parties Management Coming Soon
							</h3>
							<p className="text-gray-500 max-w-sm mx-auto">
								This feature is currently under development. You will be able to manage all your consignors and consignees here.
							</p>
						</CardContent>
					</Card>
				</main>
			</div>
		</div>
	)
}
