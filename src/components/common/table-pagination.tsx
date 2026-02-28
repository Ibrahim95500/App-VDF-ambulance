'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
    currentPage: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export function TablePagination({
    currentPage,
    totalItems,
    pageSize,
    onPageChange,
}: TablePaginationProps) {
    const totalPages = Math.ceil(totalItems / pageSize);
    if (totalPages <= 1) return null;

    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);

    // Build page numbers to display (max 5 around current)
    const getPages = () => {
        const pages: (number | '...')[] = [];
        if (totalPages <= 7) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        pages.push(1);
        if (currentPage > 3) pages.push('...');
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            pages.push(i);
        }
        if (currentPage < totalPages - 2) pages.push('...');
        pages.push(totalPages);
        return pages;
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-muted/5">
            <span className="text-xs text-muted-foreground">
                {start}–{end} sur {totalItems} résultats
            </span>
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft size={14} />
                </Button>
                {getPages().map((p, i) =>
                    p === '...' ? (
                        <span key={`dots-${i}`} className="px-1 text-xs text-muted-foreground">…</span>
                    ) : (
                        <Button
                            key={p}
                            variant={p === currentPage ? 'primary' : 'ghost'}
                            size="icon"
                            className="size-7 text-xs"
                            onClick={() => onPageChange(p as number)}
                        >
                            {p}
                        </Button>
                    )
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                >
                    <ChevronRight size={14} />
                </Button>
            </div>
        </div>
    );
}
