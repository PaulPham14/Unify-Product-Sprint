"use client"

import {
  Home,
  BookOpen,
  Calendar,
  MessageCircle,
  Settings2,
  Plus,
} from "lucide-react"

export type PageId = "home" | "learning" | "events" | "chat" | "admin"
export type HomeSubPage = "for-you" | "academy" | "members" | "announcements" | "questions" | "member-events" | "resources"

const navItems: { icon: typeof Home; label: string; id: PageId }[] = [
  { icon: Home, label: "Home", id: "home" },
  { icon: BookOpen, label: "Learning", id: "learning" },
  { icon: Calendar, label: "Events", id: "events" },
  { icon: MessageCircle, label: "Chat", id: "chat" },
  { icon: Settings2, label: "Admin", id: "admin" },
]

interface IconSidebarProps {
  activePage: PageId
  onNavigate: (page: PageId) => void
}

export function IconSidebar({ activePage, onNavigate }: IconSidebarProps) {
  return (
    <div className="flex h-screen w-16 flex-col items-center border-r border-border bg-card py-4">
      <div className="mb-6 flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
        U
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center justify-center gap-0.5 rounded-lg p-2 w-14 text-[10px] transition-colors ${
              activePage === item.id
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted text-[10px] text-muted-foreground font-medium">
          43%
        </div>
        <button className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-card">
          <Plus className="h-4 w-4" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          SM
        </div>
      </div>
    </div>
  )
}
