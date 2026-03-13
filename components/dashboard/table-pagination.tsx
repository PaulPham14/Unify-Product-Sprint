"use client"

import type { ReactNode } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export function TablePagination({
  currentPage,
  totalPages,
  pageNumbers,
  onPageChange,
  leftSlot,
}: {
  currentPage: number
  totalPages: number
  pageNumbers: Array<number | "...">
  onPageChange: (page: number) => void
  leftSlot?: ReactNode
}) {
  return (
    <div className="grid w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
      <div className="justify-self-start">{leftSlot}</div>
      <div className="justify-self-center">
        <div className="inline-flex items-center gap-[10px]">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex size-[34px] items-center justify-center rounded-[4px] bg-[#f9f9f9] text-black disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-[14.9px] w-[14.9px]" strokeWidth={2.2} />
          </button>
          <div className="inline-flex items-center">
            {pageNumbers.map((pageNumber, index) => (
              <button
                key={`${pageNumber}-${index}`}
                type="button"
                onClick={() => typeof pageNumber === "number" && onPageChange(pageNumber)}
                disabled={pageNumber === "..."}
                className="flex w-[35px] items-center justify-center rounded-[4px] px-[10px] py-[10px] disabled:cursor-default"
                aria-current={pageNumber === currentPage ? "page" : undefined}
              >
                <span
                  className={`leading-[1.4] ${
                    pageNumber === currentPage
                      ? "text-[10px] font-bold text-[#025dfe]"
                      : pageNumber === "..."
                        ? "text-[12.774px] font-medium text-[#5b5b5b]"
                        : "text-[10px] font-medium text-[#5b5b5b]"
                  }`}
                >
                  {pageNumber}
                </span>
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="flex size-[34px] items-center justify-center rounded-[4px] bg-[#f2f2f2] text-black disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="h-[14.9px] w-[14.9px]" strokeWidth={2.2} />
          </button>
        </div>
      </div>
      <div aria-hidden className="justify-self-end" />
    </div>
  )
}
