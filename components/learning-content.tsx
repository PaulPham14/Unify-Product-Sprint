"use client"

import { X, MoreVertical, Check } from "lucide-react"

export function LearningContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-border px-8 pt-4">
        {["Products", "Pathways", "Drafts"].map((tab, i) => (
          <button
            key={tab}
            className={`pb-3 text-sm font-medium transition-colors ${
              i === 0
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="px-8 py-6">
        {/* Filter chips */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-muted-foreground">Filter by:</span>
          <span className="flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-sm text-foreground">
            Active & Upcoming
            <button className="ml-1 text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>

        {/* Course card */}
        <div className="w-72 rounded-xl border border-border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
          {/* Purple gradient top */}
          <div className="relative h-36 bg-gradient-to-br from-violet-300 via-purple-300 to-violet-400 p-4 flex flex-col justify-end">
            <button className="absolute top-3 right-3 text-card/70 hover:text-card">
              <MoreVertical className="h-5 w-5" />
            </button>
            <span className="mb-1 inline-block w-fit rounded bg-card/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-card">
              COURSE
            </span>
            <span className="text-xl font-bold text-card">Zoom</span>
          </div>
          {/* Bottom section */}
          <div className="p-4">
            <span className="inline-block rounded border border-border px-2 py-0.5 text-xs font-medium text-foreground">
              Course
            </span>
            <p className="mt-2 text-sm font-semibold text-foreground">Zoom</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <Check className="h-3.5 w-3.5" />
                Registered
              </span>
              <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                Continue
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
