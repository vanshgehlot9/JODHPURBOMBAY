"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
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

// Grouped Navigation Structure
const navigationGroups = [
  {
    title: "Overview",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
    ]
  },
  {
    title: "Operations",
    items: [
      { name: "Create Bilty", href: "/bilty/create", icon: FileText },
      { name: "View Bilties", href: "/bilty/view", icon: FileText },
      { name: "Truck Challans", href: "/challan", icon: Truck },
      { name: "E-way Bill", href: "https://ewaybillgst.gov.in/mainmenu.aspx", icon: Receipt, external: true },
    ]
  },
  {
    title: "Finance & CRM",
    items: [
      { name: "Parties", href: "/parties", icon: Building2 },
      { name: "Payment Entry", href: "/payments", icon: CreditCard },
      { name: "Payment Reminder", href: "/payment-reminder", icon: Bell },
      { name: "Ledger", href: "/ledger", icon: BookOpen },
      { name: "Statement", href: "/statements", icon: BarChart3 },
    ]
  },
  {
    title: "Data",
    items: [
      { name: "Export Data", href: "/export", icon: Download },
    ]
  }
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
        title: "Session Ended",
        description: "Logged out successfully.",
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
    if (!mounted) return false
    if (item.href === "/") return pathname === "/"
    if (item.external) return false
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
        className="fixed top-3 left-3 z-50 md:hidden bg-white shadow-md border border-gray-100 rounded-xl"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5 text-gray-700" /> : <Menu className="h-5 w-5 text-gray-700" />}
      </Button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/60 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] shrink-0 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "bg-white border-r border-gray-100 shadow-xl shadow-gray-200/50 md:shadow-none flex flex-col font-sans"
        )}
      >
        {/* Brand Section */}
        <div className="h-24 flex items-center px-6 border-b border-dashed border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10 w-full">
          <div className="flex items-center gap-4 w-full group cursor-default">
            <div className="relative h-[3.25rem] w-[3.25rem] rounded-2xl overflow-hidden shadow-sm border border-gray-100 shrink-0 group-hover:shadow-md transition-shadow">
              <Image
                src="/images/truck.jpeg"
                alt="JBRC Logistics"
                fill
                className="object-cover"
                sizes="52px"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xl font-black text-[#1E1B4B] tracking-tight leading-none truncate group-hover:text-violet-900 transition-colors">JBRC</span>
              <span className="text-[10px] text-gray-400 font-bold tracking-[0.2em] uppercase mt-1.5 truncate">Logistics OS</span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-8">
            {navigationGroups.map((group, groupIdx) => (
              <div key={groupIdx} className="space-y-2">
                <h4 className="px-4 text-[10px] uppercase tracking-widest font-black text-gray-300 select-none">
                  {group.title}
                </h4>
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isItemActive(item)

                    if (item.external) {
                      return (
                        <a
                          key={item.name}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setIsOpen(false)}
                          className="group flex items-center px-4 py-3 text-[13px] font-semibold text-gray-500 rounded-xl hover:bg-gray-50 hover:text-[#1E1B4B] transition-all duration-200"
                        >
                          <item.icon className="mr-3 h-[1.1rem] w-[1.1rem] text-gray-400 group-hover:text-[#1E1B4B] transition-colors" />
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
                          "group flex items-center px-4 py-3 text-[13px] font-semibold rounded-xl transition-all duration-300 relative",
                          isActive ? "text-[#1E1B4B]" : "text-gray-500 hover:text-[#1E1B4B]"
                        )}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-[#1E1B4B]/5 rounded-xl border border-[#1E1B4B]/10"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                          />
                        )}

                        <div className="relative z-10 flex items-center w-full">
                          <item.icon className={cn(
                            "mr-3 h-[1.1rem] w-[1.1rem] transition-all duration-300",
                            isActive ? "text-[#1E1B4B] stroke-[2.5px]" : "text-gray-400 group-hover:text-[#1E1B4B] group-hover:stroke-[2.5px]"
                          )} />
                          <span className="truncate">{item.name}</span>

                          {isActive && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="ml-auto"
                            >
                              <ChevronRight className="h-3.5 w-3.5 text-[#1E1B4B]/50" />
                            </motion.div>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </nav>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full justify-start text-gray-600 hover:text-red-600 hover:bg-red-50 hover:border-red-100 h-11 px-4 text-[13px] font-semibold rounded-xl bg-white border-gray-200 shadow-sm transition-all group"
          >
            <LogOut className="mr-3 h-4 w-4 group-hover:text-red-600 transition-colors" />
            Sign Out
          </Button>

          <div className="mt-5 flex items-center justify-between text-[10px] px-1 opacity-60 hover:opacity-100 transition-opacity">
            <span className="text-gray-400 font-mono">v4.2.0</span>
            <span className="font-bold text-gray-400 hover:text-[#1E1B4B] transition-colors cursor-default">Shivkara Digital</span>
          </div>
        </div>
      </div>
    </>
  )
}
