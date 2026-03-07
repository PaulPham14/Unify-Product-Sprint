"use client"

import { useState } from "react"
import {
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  HelpCircle,
} from "lucide-react"

const courses = ["AI Fundamentals", "Zoom", "Unify Taxes"]

const stats = [
  {
    value: "0",
    label: "Public Page Visits",
    subtitle: "Nothing to report",
    action: "menu" as const,
  },
  {
    value: "2",
    label: "Members",
    subtitle: "None yesterday",
    action: "link" as const,
  },
  {
    value: "0",
    label: "Earned Revenue",
    subtitle: "No paid Products",
    action: "link" as const,
  },
]

export function DashboardCoursesContent() {
  const [selectedCourse, setSelectedCourse] = useState(courses[0])
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto bg-background p-6">
      <div className="flex flex-col gap-4">
        {/* Course filter dropdown */}
        <div className="relative w-fit">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-4 py-2.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {selectedCourse}
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </button>
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-10 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-md">
              {courses.map((course) => (
                <button
                  key={course}
                  onClick={() => {
                    setSelectedCourse(course)
                    setDropdownOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-xs transition-colors hover:bg-secondary ${
                    course === selectedCourse
                      ? "font-medium text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {course}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col justify-between rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl font-bold text-foreground">
                  {stat.value}
                </span>
                <button className="text-muted-foreground transition-colors hover:text-foreground">
                  {stat.action === "menu" ? (
                    <MoreHorizontal className="h-4 w-4" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                </button>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-muted-foreground">
                    {stat.label}
                  </span>
                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {stat.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
