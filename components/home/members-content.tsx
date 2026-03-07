"use client"

import { Search, ChevronDown, Filter } from "lucide-react"

const members = [
  {
    initials: "SM",
    name: "Stephanie Ma",
    subtitle: "Unify Team",
    role: "Owner",
    roleColor: "bg-purple-100 text-purple-700",
    bgColor: "bg-primary",
    textColor: "text-primary-foreground",
  },
  {
    initials: "US",
    name: "Unify Social",
    subtitle: null,
    role: "Member",
    roleColor: "bg-blue-100 text-blue-700",
    bgColor: "bg-orange-400",
    textColor: "text-card",
  },
]

export function MembersContent() {
  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="px-8 pt-6 pb-10">
        {/* Search and filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search"
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Filters
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Sort
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button className="rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
            Manage Members
          </button>
        </div>

        {/* Member cards grid */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          {members.map((member) => (
            <div
              key={member.name}
              className="flex flex-col items-center rounded-xl border border-border bg-card p-8 hover:shadow-sm transition-shadow cursor-pointer"
            >
              <div className={`flex h-16 w-16 items-center justify-center rounded-full ${member.bgColor} ${member.textColor} text-lg font-semibold`}>
                {member.initials}
              </div>
              <p className="mt-4 text-sm font-semibold text-foreground">{member.name}</p>
              {member.subtitle && (
                <p className="mt-0.5 text-xs text-muted-foreground">{member.subtitle}</p>
              )}
              <span className={`mt-2 rounded-full px-3 py-0.5 text-xs font-medium ${member.roleColor}`}>
                {member.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
