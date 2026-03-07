"use client"

import { FolderDown, Plus, ExternalLink } from "lucide-react"

export function ResourcesContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="px-8 pt-6 pb-10">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card py-20 px-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-secondary mb-4">
            <FolderDown className="h-7 w-7 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground text-center">
            {"Drag & drop or click to add a file, video or more. "}
            <a href="#" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">
              Learn More
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
          <button className="mt-5 flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </div>
    </div>
  )
}
