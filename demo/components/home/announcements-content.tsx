"use client"

import { MoreVertical, SmilePlus, MessageSquare, Sparkles, ThumbsUp, Pin } from "lucide-react"

export function AnnouncementsContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="flex gap-6 px-8 pt-6 pb-10">
        {/* Main posts area */}
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-foreground mb-4">Posts</h2>

          {/* Compose box */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 mb-4">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">SM</div>
            <input
              type="text"
              placeholder="What would you like to share today?"
              className="flex-1 text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent"
            />
            <button className="text-muted-foreground hover:text-foreground transition-colors">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>

          {/* Post */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">SM</div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Stephanie Ma</p>
                  <p className="text-xs text-muted-foreground">9 hours ago</p>
                </div>
              </div>
              <button className="text-muted-foreground hover:text-foreground">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-foreground">Unify</h3>
              <p className="mt-1 text-sm text-foreground">Testing</p>
            </div>
            {/* Reaction */}
            <div className="mt-4">
              <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs text-foreground">
                <ThumbsUp className="h-3 w-3 text-amber-500" />
                1
              </span>
            </div>
            {/* Footer */}
            <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-muted-foreground">
              <button className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                <SmilePlus className="h-3.5 w-3.5" />
                1 Reaction
              </button>
              <button className="flex items-center gap-1.5 text-xs hover:text-foreground transition-colors">
                <MessageSquare className="h-3.5 w-3.5" />
                1 Comment
              </button>
            </div>
          </div>
        </div>

        {/* Right sidebar - Pinned Posts */}
        <div className="w-64 flex-shrink-0">
          <div className="rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Pinned Posts</h3>
            </div>
            <div className="flex flex-col items-center justify-center rounded-lg bg-secondary/50 mx-4 my-4 py-8 px-4">
              <p className="text-sm font-semibold text-foreground">No Pinned Posts</p>
              <p className="mt-1 text-xs text-muted-foreground text-center">
                Pin a post for it to appear here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
