"use client"

import { useRef, useCallback, useState, useEffect } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

const recentlyViewed = [
  {
    type: "LESSON",
    title: "Top 5 Tips for Running Effective ...",
    context: "in AI Fundamentals",
  },
  {
    type: "LESSON",
    title: "Canada Tax Filing Module for Ind...",
    context: "in AI for Sales & Business Strategy",
  },
]

const SCROLL_AMOUNT = 420

export function MainContent() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 0)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    updateScrollState()
    el.addEventListener("scroll", updateScrollState)
    const ro = new ResizeObserver(updateScrollState)
    ro.observe(el)
    return () => {
      el.removeEventListener("scroll", updateScrollState)
      ro.disconnect()
    }
  }, [updateScrollState])

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -SCROLL_AMOUNT, behavior: "smooth" })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: SCROLL_AMOUNT, behavior: "smooth" })
    }
  }

  return (
    <div className="flex-1 overflow-y-auto bg-background">
      {/* Greeting with blue gradient */}
      <div className="relative overflow-hidden px-8 pb-6 pt-10">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#eaf2ff] via-[#f5f9ff] to-transparent" />
        <div className="relative mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground">Hi Stephanie</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-8 pb-10">
        {/* Jump Back In — carousel */}
        <section className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">Jump Back In</h2>
          <div className="relative mt-3 overflow-hidden">
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto overflow-y-hidden pb-2 scroll-smooth scrollbar-hide"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
<<<<<<< HEAD
              {/* AI Fundamentals — matches database course title */}
              <div className="flex min-w-[300px] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card sm:min-w-[360px]">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-violet-500 to-purple-600 p-4">
=======
              {/* Zoom combined card: gradient left + info right */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-[#4a8fff] to-[#025dfe] p-4">
>>>>>>> 11d5f34791207c375258b64a37c27b02a5b2cfc3
                  <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Course
                  </span>
                  <span className="text-base font-semibold text-white">AI Fundamentals</span>
                </div>
                <div className="flex h-28 w-56 flex-col justify-between p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Course
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">AI Fundamentals</span>
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

<<<<<<< HEAD
              {/* AI for Sales & Business Strategy — from database */}
              <div className="flex min-w-[300px] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card sm:min-w-[360px]">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-violet-400 to-purple-500 p-4">
=======
              {/* Unify Taxes combined card: gradient left + info right */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-[#79a8ff] to-[#2f76ff] p-4">
>>>>>>> 11d5f34791207c375258b64a37c27b02a5b2cfc3
                  <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Course
                  </span>
                  <span className="text-base font-semibold text-white">AI for Sales & Business Strategy</span>
                </div>
                <div className="flex h-28 w-56 flex-col justify-between p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                    Course
                  </span>
                  <div>
                    <span className="text-sm font-semibold text-foreground">AI for Sales & Business Strategy</span>
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

<<<<<<< HEAD
              {/* Unify Taxes — from database (peek card) */}
              <div className="flex min-w-[300px] flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card sm:min-w-[360px]">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-purple-300 to-violet-400 p-4 opacity-80">
=======
              {/* Partially visible card peeking from the right */}
              <div className="flex flex-shrink-0 overflow-hidden rounded-xl border border-border bg-card">
                <div className="flex h-28 w-44 flex-col justify-end bg-gradient-to-br from-[#b8d1ff] to-[#6ea3ff] p-4 opacity-80">
>>>>>>> 11d5f34791207c375258b64a37c27b02a5b2cfc3
                  <span className="mb-1 inline-block w-fit rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
                    Course
                  </span>
                  <span className="text-base font-semibold text-white">
                    Unify Taxes
                  </span>
                </div>
              </div>
            </div>

            {/* Carousel buttons — identical style */}
            <button
              type="button"
              onClick={scrollLeft}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="absolute left-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={scrollRight}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="absolute right-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-card shadow-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronRight className="h-5 w-5" />
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
