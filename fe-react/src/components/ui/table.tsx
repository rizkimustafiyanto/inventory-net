"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { tableStyles } from "@/theme/components/table.theme"

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
        className={cn(tableStyles.container, containerClassName)}
      >
        <table
          data-slot="table"
          className={cn(tableStyles.table, className)}
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
      className={cn(tableStyles.header, className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn(tableStyles.body, className)}
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
        tableStyles.footer,
        shouldWrap ? tableStyles.footerWrap : tableStyles.footer,
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
      className={cn(tableStyles.row, className)}
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
        tableStyles.head,
        shouldWrap && tableStyles.headWrap,
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
        tableStyles.cell,
        shouldWrap ? tableStyles.cellWrap : tableStyles.cellNowrap,
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
      <TableCell colSpan={colSpan} className={tableStyles.empty}>
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2">
            <Loader2 className={tableStyles.emptyLoadingIcon} />
            <span className={tableStyles.emptySubtext}>Memuat data...</span>
          </div>
        ) : (
          <div>
            <p className={tableStyles.emptyMessage}>{message}</p>
          </div>
        )}
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
