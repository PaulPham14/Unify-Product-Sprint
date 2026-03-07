"use client"

import {
  Sparkles,
  LayoutGrid,
  Users,
  Megaphone,
  Hash,
  CalendarDays,
  FolderOpen,
  Smartphone,
  ChevronDown,
  Plus,
  BookOpen,
  PlayCircle,
  Filter,
  MessageCircle,
  Settings2,
  BarChart3,
  Sparkle,
  Puzzle,
  Palette,
  Settings,
  Rocket,
  FileText,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from "lucide-react"
import type { PageId, HomeSubPage } from "./icon-sidebar"
import { useState } from "react"

const homeMainNav: { icon: React.ElementType; label: string; id: HomeSubPage }[] = [
  { icon: Sparkles, label: "For You", id: "for-you" },
  { icon: LayoutGrid, label: "Academy", id: "academy" },
  { icon: Users, label: "Members", id: "members" },
]

const memberSpace: { icon: React.ElementType; label: string; id: HomeSubPage }[] = [
  { icon: Megaphone, label: "Announcements", id: "announcements" },
  { icon: Hash, label: "Questions & Answers", id: "questions" },
  { icon: CalendarDays, label: "Member Events", id: "member-events" },
  { icon: FolderOpen, label: "Resources", id: "resources" },
]

const helpfulLinks = [
  { icon: Smartphone, label: "Download iOS App" },
  { icon: Smartphone, label: "Download Android App" },
]

const learningCourses = [
  { label: "Unify", draft: true, color: "bg-purple-300" },
  { label: "Zoom", draft: false, color: "bg-violet-500" },
]

const adminNav = [
  { icon: Rocket, label: "Getting Started", active: false },
  { icon: BarChart3, label: "Dashboard", active: true },
  { icon: Users, label: "Members", active: false },
  { icon: FileText, label: "Content", active: false },
  { icon: CalendarDays, label: "Events", active: false },
  { icon: LayoutGrid, label: "Products", active: false },
  { icon: Zap, label: "Automations", active: false },
  { icon: BarChart3, label: "Insights", active: false },
  { icon: Sparkle, label: "Disco AI", active: false },
  { icon: Puzzle, label: "Integrations", active: false },
  { icon: Palette, label: "Appearance", active: false },
  { icon: Settings, label: "Settings", active: false },
]

function SidebarHeader({ icon: Icon, title, trailing }: { icon: React.ElementType; title: string; trailing?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-foreground" />
        <span className="text-sm font-semibold text-foreground">{title}</span>
      </div>
      {trailing}
    </div>
  )
}

function HomeSidebar({ activeSubPage, onSubPageChange }: { activeSubPage: HomeSubPage; onSubPageChange: (p: HomeSubPage) => void }) {
  return (
    <>
      <SidebarHeader
        icon={HomeIcon}
        title="Home"
        trailing={
          <button className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          {homeMainNav.map((item) => (
            <button
              key={item.id}
              onClick={() => onSubPageChange(item.id)}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                activeSubPage === item.id
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-5">
          <button className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ChevronDown className="h-3 w-3" />
            Member Space
          </button>
          <nav className="mt-1 flex flex-col gap-0.5">
            {memberSpace.map((item) => (
              <button
                key={item.id}
                onClick={() => onSubPageChange(item.id)}
                className={`flex items-center justify-between gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors group ${
                  activeSubPage === item.id
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-secondary"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <item.icon className={`h-4 w-4 ${activeSubPage === item.id ? "" : "text-muted-foreground"}`} />
                  <span>{item.label}</span>
                </div>
                {activeSubPage === item.id && (
                  <MoreHorizontal className="h-4 w-4 opacity-70" />
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-5">
          <button className="flex items-center gap-1 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <ChevronDown className="h-3 w-3" />
            Helpful Links
          </button>
          <nav className="mt-1 flex flex-col gap-0.5">
            {helpfulLinks.map((item) => (
              <button
                key={item.label}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-secondary transition-colors"
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    </>
  )
}

function LearningSidebar() {
  return (
    <>
      <SidebarHeader
        icon={BookOpen}
        title="Learning"
        trailing={
          <button className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          <button className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
            <BookOpen className="h-4 w-4" />
            <span>Explore</span>
          </button>
          {learningCourses.map((course) => (
            <button
              key={course.label}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-secondary transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className={`h-4 w-4 rounded ${course.color}`} />
                <span>{course.label}</span>
              </div>
              {course.draft && (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                  Draft
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

function EventsSidebar() {
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 2, 1))

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()
  const monthName = currentMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))

  const today = new Date()
  const isToday = (day: number) =>
    today.getDate() === day &&
    today.getMonth() === currentMonth.getMonth() &&
    today.getFullYear() === currentMonth.getFullYear()

  return (
    <>
      <SidebarHeader
        icon={CalendarDays}
        title="Events"
        trailing={
          <button className="text-muted-foreground hover:text-foreground">
            <Filter className="h-4 w-4" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          <button className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm bg-primary text-primary-foreground">
            <LayoutGrid className="h-4 w-4" />
            <span>All Events</span>
          </button>
          <button className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-secondary transition-colors">
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
            <span>Events with Recordings</span>
          </button>
        </nav>

        <div className="mt-6 px-2">
          <p className="text-xs text-muted-foreground mb-2">Jump to a specific date:</p>
          <div className="flex items-center justify-between mb-3">
            <button onClick={prevMonth} className="text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-foreground">{monthName}</span>
            <button onClick={nextMonth} className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-0 text-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1 text-[10px] font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="py-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              return (
                <button
                  key={day}
                  className={`py-1 text-xs rounded-full transition-colors ${
                    isToday(day)
                      ? "bg-primary text-primary-foreground font-bold"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  {day}
                </button>
              )
            })}
          </div>
          <button className="mt-4 w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Jump to Today
          </button>
        </div>
      </div>
    </>
  )
}

function ChatSidebar() {
  return (
    <>
      <SidebarHeader
        icon={MessageCircle}
        title="Chat"
        trailing={
          <button className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        }
      />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <div className="flex rounded-lg bg-secondary p-0.5 mb-3">
          {["DMs", "Channels", "Threads"].map((tab, i) => (
            <button
              key={tab}
              className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
                i === 0
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <p className="px-3 py-4 text-sm text-muted-foreground">
          No direct messages yet.
        </p>
      </div>
    </>
  )
}

function AdminSidebar() {
  return (
    <>
      <SidebarHeader icon={Settings2} title="Admin Area" />
      <div className="flex-1 overflow-y-auto px-3 py-2">
        <nav className="flex flex-col gap-0.5">
          {adminNav.map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors ${
                item.active
                  ? "bg-primary text-primary-foreground"
                  : "text-sidebar-foreground hover:bg-secondary"
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

interface NavSidebarProps {
  activePage: PageId
  homeSubPage?: HomeSubPage
  onHomeSubPageChange?: (p: HomeSubPage) => void
}

export function NavSidebar({ activePage, homeSubPage = "for-you", onHomeSubPageChange }: NavSidebarProps) {
  return (
    <div className="flex h-screen w-60 flex-col border-r border-border bg-card">
      {activePage === "home" && <HomeSidebar activeSubPage={homeSubPage} onSubPageChange={onHomeSubPageChange ?? (() => {})} />}
      {activePage === "learning" && <LearningSidebar />}
      {activePage === "events" && <EventsSidebar />}
      {activePage === "chat" && <ChatSidebar />}
      {activePage === "admin" && <AdminSidebar />}
    </div>
  )
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" />
      <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}
