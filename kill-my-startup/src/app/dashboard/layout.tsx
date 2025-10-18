"use client"

import { Sidebar, SidebarBody, SidebarLink } from "@/components/dashboard/Sidebar"
import { BarChart3, Home, Settings, FileText } from "lucide-react"
import Image from "next/image"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const links = [
    { label: "Overview", href: "/dashboard", icon: <Home size={18} /> },
    { label: "Analytics", href: "/dashboard#analytics", icon: <BarChart3 size={18} /> },
    { label: "Reports", href: "/dashboard#reports", icon: <FileText size={18} /> },
    { label: "Settings", href: "/dashboard#settings", icon: <Settings size={18} /> },
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-4 flex gap-2">
        <Sidebar>
          <SidebarBody>
            <div className="flex-1">
              <div className="flex flex-col">
                {links.map((l) => (
                  <SidebarLink key={l.href} link={l} />
                ))}
              </div>
            </div>
            <div className="mt-auto hidden md:block pt-8 border-t border-white/10">
              <div className="text-xs text-white/50">v0.1</div>
            </div>
          </SidebarBody>
        </Sidebar>

        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  )
}
