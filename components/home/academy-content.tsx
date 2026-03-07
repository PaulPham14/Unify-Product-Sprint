"use client"

import { MoreVertical, SmilePlus, MessageSquare } from "lucide-react"

export function AcademyContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Academy Home title area */}
      <div className="flex items-center justify-between px-8 pt-8 pb-6">
        <div className="flex-1" />
        <h1 className="text-2xl font-bold text-foreground">Academy Home</h1>
        <div className="flex-1" />
      </div>

      <div className="flex gap-6 px-8 pb-10">
        {/* Left: Posts */}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground mb-4">Posts</h2>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Post image area */}
            <div className="h-36 bg-gradient-to-br from-purple-100 via-purple-50 to-purple-100 flex items-center justify-center">
              <div className="h-12 w-12 rounded bg-purple-200/60 flex items-center justify-center">
                <svg className="h-6 w-6 text-purple-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M12 5l7 7-7 7M5 12h14" />
                </svg>
              </div>
            </div>
            {/* Post meta */}
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">SM</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Stephanie Ma</p>
                  <p className="text-xs text-muted-foreground">
                    9 hours ago in <span className="text-primary">Announcements</span>
                  </p>
                </div>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-foreground">Unify</h3>
              <div className="mt-3 flex items-center gap-4 text-muted-foreground">
                <button className="flex items-center gap-1 text-xs hover:text-foreground transition-colors">
                  <SmilePlus className="h-3.5 w-3.5" />
                  1
                </button>
                <button className="flex items-center gap-1 text-xs hover:text-foreground transition-colors">
                  <MessageSquare className="h-3.5 w-3.5" />
                  1
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-64 flex-shrink-0">
          {/* Members */}
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Members</h3>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-400 text-[10px] font-semibold text-card">US</div>
                <span className="text-sm text-foreground">Unify Social</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">SM</div>
                <div>
                  <span className="text-sm text-foreground">Stephanie Ma</span>
                  <p className="text-xs text-muted-foreground">Unify Team</p>
                </div>
              </div>
            </div>
            <div className="px-4 pb-4">
              <button className="w-full rounded-lg border border-border py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                View All
              </button>
            </div>
          </div>

          {/* Events */}
          <div className="mt-4 rounded-xl border border-border bg-card">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Events</h3>
            </div>
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <p className="text-sm font-semibold text-foreground">No Events</p>
              <p className="mt-1 text-xs text-muted-foreground">Create your first event now!</p>
              <button className="mt-2 text-sm font-medium text-primary hover:underline">
                Add Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
