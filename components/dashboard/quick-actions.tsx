"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Receipt, Download, Truck } from "lucide-react"

const quickActions = [
  {
    title: "Create Bilty",
    description: "Generate a new bilty document",
    href: "/bilty/create",
    icon: FileText,
    color: "bg-blue-500 hover:bg-blue-600",
  },
  {
    title: "Generate E-way Bill",
    description: "Create e-way bill for transport",
    href: "/eway-bill",
    icon: Receipt,
    color: "bg-green-500 hover:bg-green-600",
  },
  {
    title: "Export to Excel",
    description: "Download bilty data as Excel",
    href: "/export",
    icon: Download,
    color: "bg-purple-500 hover:bg-purple-600",
  },
  {
    title: "Challan",
    description: "Manage challan documents",
    href: "/challan",
    icon: Truck,
    color: "bg-orange-500 hover:bg-orange-600",
  },
]

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Frequently used operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => (
            <Link key={index} href={action.href}>
              <Button
                variant="outline"
                className="w-full h-auto p-4 flex flex-col items-center space-y-2 hover:shadow-md transition-all bg-transparent"
              >
                <div className={`p-2 rounded-full text-white ${action.color}`}>
                  <action.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <div className="font-medium">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
