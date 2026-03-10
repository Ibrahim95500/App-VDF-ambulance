'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, CalendarClock, Euro, Users, User, LayoutList, LifeBuoy, CalendarRange, Siren, Banknote, CalendarDays, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'motion/react';

export function BottomTabBar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isMobile = useIsMobile();
    const hasPrivilege = (session?.user as any)?.roles?.some((r: string) => ['RH', 'ADMIN', 'REGULATEUR'].includes(r));
    const isRegulateur = (session?.user as any)?.roles?.includes('REGULATEUR') || (session?.user as any)?.isRegulateur;

    // Desktop: hidden.
    if (!isMobile) return null;

    // If loading or roles not yet synchronized, assume basic privileges to prevent empty bar
    const isLoadingOrEmpty = status === 'loading' || !session?.user || (session.user as any)?.roles?.length === 0;
    const safeHasPrivilege = isLoadingOrEmpty ? true : hasPrivilege;
    const safeIsRegulateur = isLoadingOrEmpty ? true : isRegulateur;
    const safeIsAdmin = isLoadingOrEmpty ? true : (session?.user as any)?.roles?.includes('ADMIN');

    const isRHSection = pathname.startsWith('/dashboard/rh');

    // Determine tabs based on current view
    const navItems = isRHSection
        ? [
            { label: 'Accueil', href: '/dashboard/rh', icon: Home },
            { label: 'Régule RH', href: '/dashboard/rh/regulation', icon: Siren },
            { label: 'Équipe', href: '/dashboard/rh/collaborateurs', icon: Users },
            { label: 'Côté Salarié', href: '/dashboard/salarie', icon: ArrowLeftRight, isSwitch: true }
        ]
        : [
            { label: 'Acomptes', href: '/dashboard/salarie', icon: Banknote },
            { label: 'RDV', href: '/dashboard/salarie/rendez-vous', icon: CalendarDays },
            { label: 'Services', href: '/dashboard/salarie/services', icon: LifeBuoy },
            { label: safeIsRegulateur ? 'Régulation' : 'Régule Salarié', href: '/dashboard/salarie/regulation', icon: Siren },
            safeHasPrivilege ? { label: 'Côté' + (safeIsAdmin ? ' RH' : ' RH'), href: '/dashboard/rh', icon: ArrowLeftRight, isSwitch: true } : null
        ].filter(Boolean) as any[];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] pb-[max(env(safe-area-inset-bottom),0.75rem)]">
            <div className="flex items-center justify-around h-14">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard/rh' && item.href !== '/dashboard/salarie');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors",
                                isActive ? "text-primary dark:text-blue-400" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <motion.div
                                className="flex flex-col items-center justify-center w-full"
                                whileTap={{ scale: 0.85 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                                <div className={cn(
                                    "flex items-center justify-center p-1.5 rounded-full transition-all duration-200",
                                    isActive && "bg-primary/10 dark:bg-blue-500/10"
                                )}>
                                    <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
                                </div>
                                <span className={cn(
                                    "text-[10px] font-medium leading-none",
                                    isActive && "font-bold"
                                )}>
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
