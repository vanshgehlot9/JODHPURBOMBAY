"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Receipt, Download, Truck, Sparkles, ArrowRight } from "lucide-react"

const quickActions = [
  {
    title: "Create Bilty",
    description: "Generate a new bilty document",
    href: "/bilty/create",
    icon: FileText,
    gradient: "from-blue-500 to-indigo-600",
    hoverGradient: "hover:from-blue-600 hover:to-indigo-700",
    bgLight: "bg-blue-50",
    iconColor: "text-blue-600",
    external: false,
  },
  {
    title: "Generate E-way Bill",
    description: "Create e-way bill for transport",
    href: "https://ewaybillgst.gov.in/mainmenu.aspx",
    icon: Receipt,
    gradient: "from-green-500 to-emerald-600",
    hoverGradient: "hover:from-green-600 hover:to-emerald-700",
    bgLight: "bg-green-50",
    iconColor: "text-green-600",
    external: true,
  },
  {
    title: "Export to Excel",
    description: "Download bilty data as Excel",
    href: "/export",
    icon: Download,
    gradient: "from-purple-500 to-pink-600",
    hoverGradient: "hover:from-purple-600 hover:to-pink-700",
    bgLight: "bg-purple-50",
    iconColor: "text-purple-600",
    external: false,
  },
  {
    title: "Challan",
    description: "Manage challan documents",
    href: "/challan",
    icon: Truck,
    gradient: "from-orange-500 to-red-600",
    hoverGradient: "hover:from-orange-600 hover:to-red-700",
    bgLight: "bg-orange-50",
    iconColor: "text-orange-600",
    external: false,
  },
]

export function QuickActions() {
  return (
    <Card className="border-0 ring-1 ring-gray-200/50 shadow-lg">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-xs">Frequently used operations</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickActions.map((action, index) => {
            const CardWrapper = action.external ? 'a' : Link
            const extraProps = action.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {}

            return (
              <CardWrapper key={index} href={action.href} className="group" {...extraProps}>
                <div className={`relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-${action.iconColor}/20`}>
                  {/* Background gradient on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                  {/* Decorative circles */}
                  <div className={`absolute -right-6 -top-6 h-20 w-20 rounded-full ${action.bgLight} opacity-50 group-hover:scale-150 transition-transform duration-500`}></div>

                  <div className="relative flex items-start gap-4">
                    <div className={`flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-gray-950 transition-colors">
                          {action.title}
                        </h3>
                        <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      <p className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors">
                        {action.description}
                      </p>
                    </div>
                  </div>

                  {/* Bottom accent line */}
                  <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${action.gradient} scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                </div>
              </CardWrapper>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
