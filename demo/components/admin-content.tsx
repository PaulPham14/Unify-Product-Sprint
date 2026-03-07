"use client"

import { X, ExternalLink, HelpCircle, MoreHorizontal, CheckCircle2 } from "lucide-react"
import { useState } from "react"

const statsCards = [
  {
    value: "0",
    label: "Public Page Visits",
    detail: "Nothing to report",
    hasInfo: true,
    hasLink: false,
    hasMenu: true,
  },
  {
    value: "2",
    label: "Members",
    detail: "None yesterday",
    hasInfo: true,
    hasLink: true,
    hasMenu: false,
  },
  {
    value: "0",
    label: "Earned Revenue",
    detail: "No paid Products",
    hasInfo: true,
    hasLink: true,
    hasMenu: false,
  },
]

const chartData = [
  { label: "Feb 23", value: 0 },
  { label: "Feb 24", value: 0 },
  { label: "Feb 25", value: 0 },
  { label: "Feb 26", value: 0 },
  { label: "Feb 27", value: 0 },
  { label: "Feb 28", value: 1 },
  { label: "Mar 01", value: 2 },
]

const recentMembers = [
  {
    name: "Unify Social",
    email: "contact@unifysocial.ca",
    date: "Mar 1, 2026 - 12:50 PM PST",
    avatar: "US",
    color: "bg-violet-500",
  },
  {
    name: "Stephanie Ma",
    email: "stephanie@example.com",
    date: "Mar 1, 2026 - 12:45 PM PST",
    avatar: "SM",
    color: "bg-primary",
  },
]

export function AdminContent() {
  const [showBanner, setShowBanner] = useState(true)

  const maxVal = Math.max(...chartData.map((d) => d.value), 10)

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      <div className="mx-auto max-w-5xl px-8 py-6">
        {/* Getting Started Checklist Banner */}
        {showBanner && (
          <div className="relative flex items-center justify-between rounded-xl bg-primary px-6 py-4 mb-8">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-foreground/20">
                <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
                  Getting Started Checklist
                </p>
                <p className="text-sm text-primary-foreground/90 mt-0.5">
                  Complete our getting started guide to get your Disco academy setup!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="rounded-lg bg-card px-5 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                View Checklist
              </button>
              <button
                onClick={() => setShowBanner(false)}
                className="text-primary-foreground/60 hover:text-primary-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Welcome */}
        <h1 className="text-2xl font-bold text-foreground mb-6">
          Welcome, Stephanie
        </h1>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {statsCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">{card.value}</p>
                  <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                    {card.label}
                    {card.hasInfo && (
                      <HelpCircle className="h-3.5 w-3.5" />
                    )}
                  </p>
                </div>
                {card.hasMenu && (
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                )}
                {card.hasLink && (
                  <button className="text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-4 w-4" />
                  </button>
                )}
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{card.detail}</p>
            </div>
          ))}
        </div>

        {/* Daily Active Users chart */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-semibold text-foreground">Daily Active Users</h2>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex h-52">
              {/* Y axis */}
              <div className="flex flex-col justify-between pr-3 text-xs text-muted-foreground py-1">
                {[10, 8, 6, 4, 2, 0].map((v) => (
                  <span key={v}>{v}</span>
                ))}
              </div>
              {/* Chart area */}
              <div className="flex-1 relative border-l border-b border-border">
                {/* Grid lines */}
                {[0, 2, 4, 6, 8, 10].map((v) => (
                  <div
                    key={v}
                    className="absolute w-full border-t border-border/50"
                    style={{ bottom: `${(v / maxVal) * 100}%` }}
                  />
                ))}
                {/* Line chart */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  viewBox={`0 0 ${chartData.length - 1} ${maxVal}`}
                  preserveAspectRatio="none"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    className="text-foreground"
                    strokeWidth="0.15"
                    points={chartData
                      .map((d, i) => `${i},${maxVal - d.value}`)
                      .join(" ")}
                  />
                  {chartData.map((d, i) => (
                    <circle
                      key={i}
                      cx={i}
                      cy={maxVal - d.value}
                      r="0.2"
                      className="fill-card stroke-foreground"
                      strokeWidth="0.1"
                    />
                  ))}
                </svg>
              </div>
            </div>
            {/* X axis labels */}
            <div className="flex ml-8 mt-2">
              {chartData.map((d) => (
                <div key={d.label} className="flex-1 text-center text-xs text-muted-foreground">
                  {d.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Members */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">Recent Members</h2>
            <button className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              All Members
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card divide-y divide-border">
            {recentMembers.map((member) => (
              <div
                key={member.name}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${member.color} text-primary-foreground text-xs font-semibold`}>
                    {member.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{member.date}</span>
                  <button className="text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
