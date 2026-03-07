"use client"

import { useRef } from "react"
import { ChevronRight } from "lucide-react"

const recentlyViewed = [
  {
    type: "LESSON",
    title: "Top 5 Tips for Running Effective ...",
    context: "in Zoom",
  },
  {
    type: "LESSON",
    title: "Canada Tax Filing Module for Ind...",
    context: "in Resources",
  },
]

export function MainContent() {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Greeting with lavender gradient */}
      <div className="relative overflow-hidden px-8 pb-6 pt-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#f0e6ff] via-[#f5eeff] to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground">Hi Stephanie</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-10">
        {/* Jump Back In */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">Jump Back In</h2>
          <div className="relative mt-3">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            >
              {/* Zoom combined card: gradient left + info right */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-violet-500 to-purple-600 p-4">
                  <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Course
                  </span>
                  <span className="text-base font-semibold text-white">Zoom</span>
                </div>
                <div className="flex h-28 w-56 flex-col justify-between p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Course
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Zoom</span>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">0%</span>
                      <div className="h-1.5 w-24 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unify Taxes combined card: gradient left + info right */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-violet-400 to-purple-500 p-4">
                  <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Course
                  </span>
                  <span className="text-base font-semibold text-white">Unify Taxes</span>
                </div>
                <div className="flex h-28 w-56 flex-col justify-between p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Course
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">Unify Taxes</span>
                    <div className="mt-2 flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">0%</span>
                      <div className="h-1.5 w-24 rounded-full bg-secondary">
                        <div
                          className="h-1.5 rounded-full bg-primary"
                          style={{ width: "0%" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Partially visible card peeking from the right */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-purple-300 to-violet-400 p-4 opacity-80">
                  <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Course
                  </span>
                  <span className="text-base font-semibold text-white">
                    {"U..."}
                  </span>
                </div>
              </div>
            </div>

            {/* Scroll right button */}
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card shadow-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </section>

        {/* Recently Viewed */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-foreground">
            Recently Viewed
          </h2>
          <div className="mt-3 flex gap-4">
            {recentlyViewed.map((item, i) => (
              <div
                key={i}
                className="flex w-64 flex-col rounded-xl border border-border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                  {item.type}
                </span>
                <span className="mt-2 text-sm font-semibold text-foreground leading-snug">
                  {item.title}
                </span>
                <span className="mt-2 text-xs text-muted-foreground">
                  {item.context}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Events */}
        <section className="mt-10">
          <h2 className="text-sm font-semibold text-foreground">Events</h2>
          <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-border bg-card py-12">
            <p className="text-sm font-semibold text-foreground">No Events</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first event now!
            </p>
            <button className="mt-3 text-sm font-medium text-primary hover:underline">
              Add Event
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
