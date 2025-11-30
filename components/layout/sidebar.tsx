"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import {
  LayoutDashboard,
  FileText,
  Bell,
  Receipt,
  BookOpen,
  BarChart3,
  Menu,
  X,
  Truck,
  Download,
  LogOut,
  Building2,
  CreditCard,
} from "lucide-react"

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Create Bilty", href: "/bilty/create", icon: FileText },
  { name: "View Bilties", href: "/bilty/view", icon: FileText },
  { name: "View Challans", href: "/challan", icon: Truck },
  { name: "Parties", href: "/parties", icon: Building2 },
  { name: "Payment Reminder", href: "/payment-reminder", icon: Bell },
  { name: "Payment Entry", href: "/payments", icon: CreditCard },
  { name: "E-way Bill", href: "https://ewaybillgst.gov.in/mainmenu.aspx", icon: Receipt, external: true },
  { name: "Ledger", href: "/ledger", icon: BookOpen },
  { name: "Statement", href: "/statements", icon: BarChart3 },
  { name: "Export Data", href: "/export", icon: Download },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      toast({
        title: "Success",
        description: "Logged out successfully!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      })
    }
  }

  const isItemActive = (item: any) => {
    if (item.href === "/") return pathname === "/"
    if (item.external) return false

    // Specific handling for Challan pages
    if (item.href === "/challan") {
      return pathname === "/challan" || pathname.startsWith("/challan/view") || pathname.startsWith("/challan/edit")
    }

    return pathname.startsWith(item.href)
  }

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 shrink-0 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 border-b border-gray-100">
            <div className="flex flex-col items-center gap-2">
              <div className="relative h-12 w-12 overflow-hidden rounded-xl shadow-sm">
                <img
                  src="/images/truck.jpeg"
                  alt="JBRC Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <h1 className="text-sm font-bold text-gray-900 tracking-tight">Jodhpur Bombay</h1>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-3 py-4">
            <nav className="space-y-2">
              {navigation.map((item) => {
                const isActive = isItemActive(item)
                const isExternal = item.external

                if (isExternal) {
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                        "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </a>
                  )
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200",
                      isActive
                        ? "bg-indigo-50 text-indigo-600 shadow-sm ring-1 ring-indigo-100"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                    )}
                  >
                    <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-500")} />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 mb-4"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p className="font-medium text-gray-700">Jodhpur Bombay Road Carrier</p>
              <div className="flex items-center justify-center gap-1">
                <p>Powered by</p>
                <span className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Shivkara Digital
                </span>
              </div>
              <p className="text-gray-400">© 2025 All rights reserved</p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-30 bg-black bg-opacity-50 md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  )
}
