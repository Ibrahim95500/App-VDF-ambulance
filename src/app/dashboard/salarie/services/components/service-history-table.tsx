"use client"

import { useState, useMemo } from "react"
import { MyServiceRequest } from "@/services/my-requests"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Calendar, MessageSquare, Clock } from "lucide-react"
import { TablePagination } from "@/components/common/table-pagination"

export function ServiceHistoryTable({ initialData }: { initialData: MyServiceRequest[] }) {
    const [currentPage, setCurrentPage] = useState(1)
    const PAGE_SIZE = 10

    const paginatedData = useMemo(() => {
        const start = (currentPage - 1) * PAGE_SIZE
        return initialData.slice(start, start + PAGE_SIZE)
    }, [initialData, currentPage])

    if (initialData.length === 0) {
        return (
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mb-4 opacity-20" />
                <p>Vous n'avez pas encore de demandes de service.</p>
            </Card>
        )
    }

    return (
        <Card className="border-border shadow-none bg-transparent overflow-hidden">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl flex items-center gap-2">
                    <Clock className="size-5 text-muted-foreground" />
                    Historique de mes demandes
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table className="min-w-[700px]">
                        <TableHeader>
                            <TableRow className="bg-muted/20">
                                <TableHead className="font-semibold">Catégorie</TableHead>
                                <TableHead className="font-semibold">Sujet</TableHead>
                                <TableHead className="font-semibold text-center">Date</TableHead>
                                <TableHead className="font-semibold text-right">Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedData.map((req) => (
                                <TableRow key={req.id} className="hover:bg-muted/10 transition-colors">
                                    <TableCell>
                                        <Badge variant="secondary" className="font-medium">
                                            {req.category}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="max-w-[200px] truncate font-medium">
                                        {req.subject}
                                    </TableCell>
                                    <TableCell className="text-center text-muted-foreground text-sm">
                                        <div className="flex items-center justify-center gap-1.5">
                                            <Calendar className="size-3" />
                                            {new Date(req.createdAt).toLocaleDateString('fr-FR')}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {req.status === 'PENDING' && (
                                            <Badge variant="outline" className="text-yellow-600 bg-yellow-50 border-yellow-200">En attente</Badge>
                                        )}
                                        {req.status === 'APPROVED' && (
                                            <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">Approuvée</Badge>
                                        )}
                                        {req.status === 'REJECTED' && (
                                            <Badge variant="outline" className="text-red-600 bg-red-50 border-red-200">Refusée</Badge>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <TablePagination
                currentPage={currentPage}
                totalItems={initialData.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
            />
        </Card>
    )
}
