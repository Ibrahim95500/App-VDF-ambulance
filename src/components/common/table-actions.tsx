"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
    Download,
    Search,
    CalendarDays,
    ChevronDown,
    FileText,
    FileSpreadsheet,
    FileCode
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { exportToCSV, exportToExcel, exportToPDF } from "@/lib/export-utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

interface TableActionsProps {
    data: any[]
    onSearch?: (term: string) => void
    onDateRangeChange?: (range: DateRange | undefined) => void
    onStatusChange?: (status: string) => void
    statusOptions?: { label: string, value: string }[]
    counts?: Record<string, number>
    filename?: string
    pdfTitle?: string
}

export function TableActions({
    data,
    onSearch,
    onDateRangeChange,
    onStatusChange,
    statusOptions,
    counts,
    filename = "export",
    pdfTitle = "Export Data"
}: TableActionsProps) {
    const [date, setDate] = useState<DateRange | undefined>()
    const [localStatus, setLocalStatus] = useState("ALL")

    const handleDateChange = (range: DateRange | undefined) => {
        setDate(range)
        if (onDateRangeChange) onDateRangeChange(range)
    }

    const handleStatusClick = (statusValue: string) => {
        setLocalStatus(statusValue)
        if (onStatusChange) onStatusChange(statusValue)
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="flex flex-1 flex-wrap gap-3 w-full">
                {/* Search */}
                {onSearch && (
                    <div className="relative w-full md:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher..."
                            className="pl-10 h-10"
                            onChange={(e) => onSearch(e.target.value)}
                        />
                    </div>
                )}

                {/* Status Filter (Pills) */}
                {onStatusChange && statusOptions && (
                    <div className="flex flex-wrap items-center gap-2 bg-muted/40 p-1.5 rounded-lg border border-border w-full md:w-auto">
                        <button
                            onClick={() => handleStatusClick("ALL")}
                            className={cn(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                                localStatus === "ALL"
                                    ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                        >
                            <span>Tous</span>
                            {counts && counts["ALL"] !== undefined && (
                                <span className={cn(
                                    "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none min-w-[20px] text-center",
                                    localStatus === "ALL" ? "bg-muted text-foreground" : "bg-foreground/10 text-muted-foreground"
                                )}>
                                    {counts["ALL"]}
                                </span>
                            )}
                        </button>
                        {statusOptions.map(option => (
                            <button
                                key={option.value}
                                onClick={() => handleStatusClick(option.value)}
                                className={cn(
                                    "px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-1.5",
                                    localStatus === option.value
                                        ? (option.value === "APPROVED" ? "bg-green-50 text-green-700 ring-1 ring-green-200 shadow-sm" :
                                            option.value === "REJECTED" ? "bg-red-50 text-red-700 ring-1 ring-red-200 shadow-sm" :
                                                option.value === "PENDING" ? "bg-yellow-50 text-yellow-700 ring-1 ring-yellow-200 shadow-sm" :
                                                    option.value === "SALARIE" ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-sm" :
                                                        option.value === "RH" ? "bg-purple-50 text-purple-700 ring-1 ring-purple-200 shadow-sm" :
                                                            option.value === "RESCHEDULE_PENDING" ? "bg-cyan-50 text-cyan-700 ring-1 ring-cyan-200 shadow-sm" :
                                                                "bg-background text-foreground shadow-sm ring-1 ring-border")
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                )}
                            >
                                <span>{option.label}</span>
                                {counts && counts[option.value] !== undefined && (
                                    <span className={cn(
                                        "px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none min-w-[20px] text-center",
                                        localStatus === option.value ? "bg-background/60" : "bg-foreground/10 text-muted-foreground"
                                    )}>
                                        {counts[option.value]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}

                {/* Date Filter */}
                {onDateRangeChange && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "w-full md:w-[260px] h-10 justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                )}
                            >
                                <CalendarDays className="mr-2 size-4" />
                                {date?.from ? (
                                    date.to ? (
                                        <>
                                            {format(date.from, "dd/MM/yyyy")} -{" "}
                                            {format(date.to, "dd/MM/yyyy")}
                                        </>
                                    ) : (
                                        format(date.from, "dd/MM/yyyy")
                                    )
                                ) : (
                                    <span>Filtrer par date</span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={date?.from}
                                selected={date}
                                onSelect={handleDateChange}
                                numberOfMonths={2}
                                locale={fr}
                            />
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* Export Dropdown */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="secondary" className="h-10 w-full md:w-auto">
                        <Download className="mr-2 size-4" />
                        Exporter
                        <ChevronDown className="ml-2 size-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => exportToExcel(data, filename)}>
                        <FileSpreadsheet className="mr-2 size-4 text-green-600" />
                        Excel (.xlsx)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToCSV(data, filename)}>
                        <FileCode className="mr-2 size-4 text-blue-600" />
                        CSV (.csv)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => exportToPDF(data, filename, pdfTitle)}>
                        <FileText className="mr-2 size-4 text-red-600" />
                        PDF (.pdf)
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
