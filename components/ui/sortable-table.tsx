"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"

interface Column {
  key: string
  title: string
  render?: (value: any, item: any) => React.ReactNode
  sortable?: boolean
}

interface SortableTableProps {
  columns: Column[]
  data: any[]
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  emptyMessage?: string
  className?: string
}

export function SortableTable({
  columns,
  data,
  searchable = false,
  searchPlaceholder = "Search...",
  searchKeys = [],
  emptyMessage = "No data found.",
  className = "",
}: SortableTableProps) {
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [searchTerm, setSearchTerm] = useState("")

  // Handle sorting
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(columnKey)
      setSortDirection("asc")
    }
  }

  // Filter data based on search term
  const filteredData =
    searchable && searchTerm
      ? data.filter((item) => {
          return searchKeys.some((key) => {
            const value = key.split(".").reduce((obj, k) => obj && obj[k], item)
            return value && String(value).toLowerCase().includes(searchTerm.toLowerCase())
          })
        })
      : data

  // Sort data based on sort column and direction
  const sortedData = sortColumn
    ? [...filteredData].sort((a, b) => {
        const aValue = sortColumn.split(".").reduce((obj, key) => obj && obj[key], a)
        const bValue = sortColumn.split(".").reduce((obj, key) => obj && obj[key], b)

        if (aValue === bValue) return 0

        // Handle different data types
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
        }

        if (aValue === null || aValue === undefined) return sortDirection === "asc" ? -1 : 1
        if (bValue === null || bValue === undefined) return sortDirection === "asc" ? 1 : -1

        return sortDirection === "asc" ? (aValue > bValue ? 1 : -1) : aValue > bValue ? -1 : 1
      })
    : filteredData

  // Render sort icon
  const renderSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortDirection === "asc" ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />
  }

  return (
    <div className="w-full">
      {searchable && (
        <div className="flex mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10 placeholder:text-muted-foreground/40 placeholder:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className={`rounded-md border overflow-x-auto ${className}`}>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key} className={column.sortable ? "cursor-pointer" : ""}>
                  {column.sortable ? (
                    <Button
                      variant="ghost"
                      onClick={() => handleSort(column.key)}
                      className="p-0 h-auto font-medium hover:bg-transparent hover:text-primary"
                    >
                      {column.title}
                      {renderSortIcon(column.key)}
                    </Button>
                  ) : (
                    column.title
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => (
                <TableRow key={index}>
                  {columns.map((column) => (
                    <TableCell key={`${index}-${column.key}`}>
                      {column.render
                        ? column.render(
                            column.key.split(".").reduce((obj, key) => obj && obj[key], item),
                            item,
                          )
                        : column.key.split(".").reduce((obj, key) => obj && obj[key], item)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-4">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
