"use client"

import {
  Search,
  Bookmark,
  Bell,
  HelpCircle,
  Sparkles,
  BookOpen,
  LayoutGrid,
  Settings2,
  MoreVertical,
  Filter,
  ChevronDown,
  Plus,
  ExternalLink,
  CheckSquare,
  Megaphone,
  Hash,
  CalendarDays,
  FolderOpen,
  Users,
  Info,
} from "lucide-react"
import type { PageId, HomeSubPage } from "./icon-sidebar"

export function TrialBanner() {
  return (
    <div className="relative flex items-center justify-center gap-3 bg-primary/5 border-b border-border px-4 py-2 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-amber-500">&#10022;</span>
        <span>
          <a href="#" className="font-semibold text-primary underline">
            14 days left in your FREE trial.
          </a>{" "}
          <span className="text-foreground">Upgrade now or book a demo with our team.</span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button className="rounded-lg border border-border bg-card px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
          Book a Demo
        </button>
        <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          Choose a Plan
        </button>
      </div>
      <button className="absolute right-4 text-muted-foreground hover:text-foreground">
        <HelpCircle className="h-4 w-4" />
      </button>
    </div>
  )
}

export function TopBar() {
  return (
    <div className="flex items-center justify-between border-b border-border bg-card px-6 py-2.5">
      <div className="relative flex-1 max-w-2xl">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full rounded-lg bg-secondary/60 py-2 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex items-center gap-4 ml-4">
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Bookmark className="h-5 w-5" />
        </button>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

interface PageHeaderProps {
  activePage: PageId
  homeSubPage?: HomeSubPage
}

export function PageHeader({ activePage, homeSubPage = "for-you" }: PageHeaderProps) {
  if (activePage === "home") {
    return <HomePageHeader subPage={homeSubPage} />
  }

  switch (activePage) {
    case "learning":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Explore</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <Filter className="h-3.5 w-3.5" />
              Filter
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Add Product
            </button>
          </div>
        </div>
      )
    case "events":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">All Events</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <CheckSquare className="h-4 w-4" />
              Attend All
            </button>
            <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Add Event
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    case "chat":
      return null
    case "admin":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Dashboard</span>
          </div>
          <a href="#" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View Academy
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      )
    default:
      return null
  }
}

function HomePageHeader({ subPage }: { subPage: HomeSubPage }) {
  switch (subPage) {
    case "for-you":
      return (
        <div className="flex items-center gap-2 border-b border-border px-6 py-3 bg-card">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">For You</span>
        </div>
      )
    case "academy":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Academy</span>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      )
    case "members":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Members</span>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Invite Member
          </button>
        </div>
      )
    case "announcements":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Announcements</span>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add Post
          </button>
        </div>
      )
    case "questions":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Questions & Answers</span>
            <Info className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground ring-2 ring-card">SM</div>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-orange-400 text-[10px] font-semibold text-card ring-2 ring-card">US</div>
            </div>
            <button className="text-muted-foreground hover:text-foreground">
              <HelpCircle className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <Sparkles className="h-4 w-4" />
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    case "member-events":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Member Events</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="h-4 w-4" />
              Add Event
            </button>
            <button className="flex items-center gap-1 rounded-lg border border-border px-4 py-1.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              Upcoming
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </button>
            <button className="text-muted-foreground hover:text-foreground">
              <MoreVertical className="h-4 w-4" />
            </button>
          </div>
        </div>
      )
    case "resources":
      return (
        <div className="flex items-center justify-between border-b border-border px-6 py-3 bg-card">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Resources</span>
          </div>
          <button className="flex items-center gap-1 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add New
          </button>
        </div>
      )
    default:
      return null
  }
}
