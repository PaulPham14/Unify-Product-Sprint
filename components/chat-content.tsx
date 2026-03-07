"use client"

import { MessageCircle, Plus } from "lucide-react"

export function ChatContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="flex flex-col items-center justify-center h-full min-h-[500px] px-8 py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-muted-foreground mb-4">
          <MessageCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">No messages yet</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
          Send a direct message to other academy Members
        </p>
        <button className="mt-6 flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>
    </div>
  )
}
