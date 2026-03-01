"use client"

import { ReactNode, useEffect, useState } from 'react';

export function ClientHydration({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-background z-[9999]">
                <div className="flex flex-col items-center gap-4">
                    <div className="size-16 animate-pulse bg-secondary/10 rounded-full flex items-center justify-center">
                        <div className="size-8 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground animate-pulse">Chargement de VDF Ambu...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
