"use client"

import { Bold, Italic, Strikethrough, Link2, List, ListOrdered, ImagePlus, SmilePlus, AtSign, Sparkles } from "lucide-react"

const messages = [
  {
    initials: "SM",
    name: "Stephanie Ma",
    time: "TODAY AT 12:33 PM",
    text: "How do I make a lesson plan?",
    bgColor: "bg-primary",
    textColor: "text-primary-foreground",
  },
  {
    initials: "US",
    name: "Unify Social",
    time: "TODAY AT 12:52 PM",
    text: "Not sure",
    bgColor: "bg-orange-400",
    textColor: "text-card",
  },
]

export function QuestionsContent() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-8 pt-6">
        {/* Today divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs font-medium text-muted-foreground">Today</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Messages */}
        <div className="flex flex-col gap-5">
          {messages.map((msg, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${msg.bgColor} ${msg.textColor} text-xs font-semibold`}>
                {msg.initials}
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-semibold text-foreground">{msg.name}</span>
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{msg.time}</span>
                </div>
                <p className="mt-0.5 text-sm text-foreground">{msg.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Message input area */}
      <div className="border-t border-border bg-card px-8 py-3">
        {/* Toolbar */}
        <div className="flex items-center gap-1 mb-2">
          <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Bold className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Italic className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Strikethrough className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <Link2 className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <List className="h-4 w-4" />
          </button>
          <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
            <ListOrdered className="h-4 w-4" />
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          placeholder="Start typing your message here..."
          className="w-full text-sm text-foreground placeholder:text-muted-foreground outline-none bg-transparent py-1"
        />

        {/* Bottom actions */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <AtSign className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <SmilePlus className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <SmilePlus className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <ImagePlus className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <SmilePlus className="h-4 w-4" />
            </button>
            <button className="rounded p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Sparkles className="h-4 w-4" />
            </button>
          </div>
          <button className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
            Send Now
          </button>
        </div>
      </div>
    </div>
  )
}
