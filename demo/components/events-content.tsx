"use client"

import { CalendarDays, ExternalLink, Plus } from "lucide-react"

export function EventsContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-8 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
          <CalendarDays className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No events yet</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          Enhance academy engagement through diverse event-hosting options.
        </p>
        <a
          href="#"
          className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Learn More
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <button className="mt-6 flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Event
        </button>
      </div>
    </div>
  )
}
