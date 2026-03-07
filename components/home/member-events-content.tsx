"use client"

import { CalendarDays, Plus, ExternalLink } from "lucide-react"

export function MemberEventsContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="flex flex-col items-center justify-center px-8 py-20">
        {/* Illustration placeholder */}
        <div className="mb-6 flex h-48 w-72 items-center justify-center rounded-xl bg-gradient-to-br from-purple-100 via-purple-50 to-white border border-border overflow-hidden">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-16 w-24 items-center justify-center rounded-lg bg-card shadow-md border border-border">
              <CalendarDays className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-16 rounded-full bg-purple-200" />
              <div className="h-2 w-10 rounded-full bg-purple-100" />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-foreground">No upcoming events yet</h2>
        <p className="mt-1 text-sm text-muted-foreground text-center max-w-sm">
          Enhance academy engagement through diverse event-hosting options.
        </p>
        <a href="#" className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline">
          Learn More
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button className="mt-5 flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>
    </div>
  )
}
