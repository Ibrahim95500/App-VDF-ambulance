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
    filename?: string
    pdfTitle?: string
}

export function TableActions({
    data,
    onSearch,
    onDateRangeChange,
    onStatusChange,
    statusOptions,
    filename = "export",
    pdfTitle = "Export Data"
}: TableActionsProps) {
    const [date, setDate] = useState<DateRange | undefined>()

    const handleDateChange = (range: DateRange | undefined) => {
        setDate(range)
        if (onDateRangeChange) onDateRangeChange(range)
    }

    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 items-center justify-between">
            <div className="flex flex-1 flex-col md:flex-row gap-3 w-full">
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

                {/* Status Filter */}
                {onStatusChange && statusOptions && (
                    <Select onValueChange={onStatusChange}>
                        <SelectTrigger className="w-full md:w-[180px] h-10">
                            <SelectValue placeholder="Statut" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">Tous les statuts</SelectItem>
                            {statusOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
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
