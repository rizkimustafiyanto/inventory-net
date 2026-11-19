"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TableContextValue {
  wrapHeader: boolean
  wrapBody: boolean
  wrapFooter: boolean
}

const TableContext = React.createContext<TableContextValue>({
  wrapHeader: false,
  wrapBody: false,
  wrapFooter: false,
})

export interface TableProps extends React.ComponentProps<"table"> {
  minWidth?: string | number
  wrapHeader?: boolean
  wrapBody?: boolean
  wrapFooter?: boolean
  containerClassName?: string
}

function Table({
  className,
  minWidth = "700px",
  wrapHeader = false,
  wrapBody = false,
  wrapFooter = false,
  containerClassName,
  style,
  ...props
}: TableProps) {
  const contextValue = React.useMemo(
    () => ({ wrapHeader, wrapBody, wrapFooter }),
    [wrapHeader, wrapBody, wrapFooter]
  )

  const minWidthStyle = typeof minWidth === "number" ? `${minWidth}px` : minWidth

  return (
    <TableContext.Provider value={contextValue}>
      <div
        data-slot="table-container"
        className={cn(
          "relative w-full overflow-x-auto scroll-smooth overscroll-x-contain touch-pan-x",
          containerClassName
        )}
      >
        <table
          data-slot="table"
          className={cn("w-full caption-bottom text-sm", className)}
          style={{ minWidth: minWidthStyle, ...style }}
          {...props}
        />
      </div>
    </TableContext.Provider>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b border-slate-100 bg-slate-50/75 dark:border-slate-800 dark:bg-slate-800/50", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0 divide-y divide-slate-100 dark:divide-slate-800", className)}
      {...props}
    />
  )
}

function TableFooter({
  className,
  wrap,
  ...props
}: React.ComponentProps<"tfoot"> & { wrap?: boolean }) {
  const ctx = React.useContext(TableContext)
  const shouldWrap = wrap ?? ctx.wrapFooter

  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0 whitespace-nowrap",
        shouldWrap ? "whitespace-normal break-words" : "whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-slate-100 transition-colors hover:bg-slate-50/60 dark:border-slate-800/60 dark:hover:bg-slate-800/50",
        className
      )}
      {...props}
    />
  )
}

export interface TableHeadProps extends React.ComponentProps<"th"> {
  wrap?: boolean
}

function TableHead({ className, wrap, ...props }: TableHeadProps) {
  const ctx = React.useContext(TableContext)
  const shouldWrap = wrap ?? ctx.wrapHeader

  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-5 text-left align-middle text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap [&:has([role=checkbox])]:pr-0",
        shouldWrap ? "whitespace-normal break-words" : "whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

export interface TableCellProps extends React.ComponentProps<"td"> {
  wrap?: boolean
}

function TableCell({ className, wrap, ...props }: TableCellProps) {
  const ctx = React.useContext(TableContext)
  const shouldWrap = wrap ?? ctx.wrapBody

  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-5 py-4 align-middle text-sm text-slate-700 dark:text-slate-300 [&:has([role=checkbox])]:pr-0",
        shouldWrap ? "whitespace-normal break-words" : "whitespace-nowrap",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

interface TableEmptyProps {
  colSpan: number
  message?: string
  loading?: boolean
}

function TableEmpty({ colSpan, message = "Belum ada data.", loading = false }: TableEmptyProps) {
  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="py-12 text-center text-slate-400">
        {loading ? "Memuat data..." : message}
      </TableCell>
    </TableRow>
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  TableEmpty,
}
