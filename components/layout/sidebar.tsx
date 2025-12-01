"use client"

import { useState, useEffect } from "react"
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
  ChevronRight,
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
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { toast } = useToast()

  // Ensure component is mounted before rendering active states
  useEffect(() => {
    setMounted(true)
  }, [])

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
    // Return false during SSR to prevent hydration mismatch
    if (!mounted) return false

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
        className="fixed top-4 left-4 z-50 md:hidden bg-white/80 backdrop-blur-md shadow-sm border border-gray-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-6 w-6 text-gray-700" /> : <Menu className="h-6 w-6 text-gray-700" />}
      </Button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 shrink-0 transform transition-all duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "bg-white/95 backdrop-blur-xl border-r border-indigo-50/50 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)]"
        )}
      >
        <div className="flex flex-col h-full bg-gradient-to-b from-white via-white to-indigo-50/30">
          {/* Logo Section */}
          <div className="relative h-28 flex items-center justify-center px-6 border-b border-indigo-50">
            {/* Decorative Elements */}
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-100 to-transparent opacity-50" />
            <div className="absolute -left-4 top-10 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            <div className="absolute -right-4 top-4 w-20 h-20 bg-purple-500/5 rounded-full blur-2xl" />

            <div className="relative flex items-center gap-4 w-full group">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl shadow-lg ring-4 ring-white transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                <img
                  src="/images/truck.jpeg"
                  alt="JBRC Logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 py-1">
                <h1 className="text-lg font-black bg-gradient-to-r from-indigo-900 via-purple-800 to-indigo-900 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient tracking-tight truncate">
                  Jodhpur Bombay
                </h1>
                <p className="text-[10px] font-bold text-indigo-400/90 uppercase tracking-[0.2em] truncate leading-tight">
                  Road Carrier
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-4 py-4">
            <nav className="space-y-1">
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
                        "group flex items-center px-4 py-2.5 text-sm font-medium rounded-2xl transition-all duration-300",
                        "text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:shadow-sm hover:translate-x-1"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
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
                      "group flex items-center px-4 py-2.5 text-sm font-medium rounded-2xl transition-all duration-300 relative overflow-hidden",
                      isActive
                        ? "text-white shadow-lg shadow-indigo-500/30 translate-x-1 scale-[1.02]"
                        : "text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 hover:translate-x-1"
                    )}
                  >
                    {/* Active Background Gradient */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 animate-gradient-x" />
                    )}

                    {/* Content */}
                    <div className="relative flex items-center w-full z-10">
                      <item.icon className={cn(
                        "mr-3 h-5 w-5 transition-colors duration-300",
                        isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-600"
                      )} />
                      <span className="flex-1 font-semibold tracking-wide">{item.name}</span>

                      {/* Active Indicator */}
                      {isActive && (
                        <ChevronRight className="h-4 w-4 text-white/80 animate-pulse" />
                      )}
                    </div>
                  </Link>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          <div className="p-5 border-t border-indigo-50 bg-gradient-to-b from-transparent to-indigo-50/30">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full justify-start text-gray-500 hover:text-red-600 hover:bg-red-50 mb-4 group transition-all duration-300 rounded-2xl h-11"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500 transition-colors" />
              <span className="font-medium">Logout</span>
            </Button>

            <div className="relative rounded-2xl bg-white/60 p-4 border border-indigo-100/50 shadow-sm backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2 text-center">
                <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Powered by</p>
                <span className="text-xs font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent hover:scale-105 transition-transform cursor-default">
                  Shivkara Digital
                </span>
                <p className="text-[10px] text-gray-400">© 2025 All Rights Reserved</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm md:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
