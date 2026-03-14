'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, CalendarClock, Euro, Users, User, LayoutList, LifeBuoy, CalendarRange, Siren, Banknote, CalendarDays, ArrowLeftRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { getNotificationStats } from '@/actions/notification-stats.actions';

export function BottomTabBar() {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const isMobile = useIsMobile();
    const hasPrivilege = (session?.user as any)?.roles?.some((r: string) => ['RH', 'ADMIN', 'REGULATEUR'].includes(r));
    const isRegulateur = (session?.user as any)?.roles?.includes('REGULATEUR') || (session?.user as any)?.isRegulateur;

    const isRealRH = (session?.user as any)?.roles?.includes('RH') || (session?.user as any)?.roles?.includes('ADMIN');

    // Desktop: hidden.
    if (!isMobile) return null;

    // If loading or roles not yet synchronized, assume basic privileges to prevent empty bar
    const isLoadingOrEmpty = status === 'loading' || !session?.user || (session.user as any)?.roles?.length === 0;
    const safeHasPrivilege = isLoadingOrEmpty ? true : hasPrivilege;
    const safeIsRegulateur = isLoadingOrEmpty ? true : isRegulateur;
    const safeIsAdmin = isLoadingOrEmpty ? true : (session?.user as any)?.roles?.includes('ADMIN');
    const safeIsRealRH = isLoadingOrEmpty ? true : isRealRH;

    const [stats, setStats] = useState({
        global: { advances: 0, services: 0, appointments: 0, leaves: 0, regulation: 0, total: 0 },
        personal: { advances: 0, services: 0, appointments: 0, leaves: 0, mission: 0, total: 0 }
    });

    useEffect(() => {
        const loadStats = async () => {
            const userId = (session?.user as any)?.id;
            if (!userId) return; // Sécurisation supplémentaire
            const data = await getNotificationStats(userId);
            if (data) setStats(data);
        };
        if (status === 'authenticated') {
            loadStats();
            const interval = setInterval(loadStats, 5000);
            return () => clearInterval(interval);
        }
    }, [status, session?.user]);

    const isRHSection = pathname.startsWith('/dashboard/rh');

    // Determine tabs based on current view
    const navItems = isRHSection
        ? [
            safeIsRealRH ? { label: 'Accueil', href: '/dashboard/rh', icon: Home } : null,
            { label: 'Régule RH', href: '/dashboard/rh/regulation', icon: Siren, badgeCount: stats.global.regulation },
            safeIsRealRH ? { label: 'Équipe', href: '/dashboard/rh/collaborateurs', icon: Users } : null,
            { label: 'Côté Salarié', href: '/dashboard/salarie', icon: ArrowLeftRight, isSwitch: true }
        ].filter(Boolean) as any[]
        : [
            { label: 'Acomptes', href: '/dashboard/salarie/acomptes', icon: Banknote, badgeCount: stats.personal.advances },
            { label: 'Mon Espace', href: '/dashboard/salarie/collaborateurs', icon: Users },
            { label: 'Services', href: '/dashboard/salarie/services', icon: LifeBuoy, badgeCount: stats.personal.services + stats.personal.leaves },
            { label: safeIsRegulateur ? 'Régulation' : 'Régule Salarié', href: '/dashboard/salarie/regulation', icon: Siren, badgeCount: stats.personal.mission },
            safeHasPrivilege ? { label: 'Côté RH', href: safeIsRealRH ? '/dashboard/rh' : '/dashboard/rh/regulation', icon: ArrowLeftRight, isSwitch: true } : null
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
                                    "flex items-center justify-center p-1.5 rounded-full transition-all duration-200 relative",
                                    isActive && "bg-primary/10 dark:bg-blue-500/10"
                                )}>
                                    <Icon className={cn("size-5", isActive && "stroke-[2.5px]")} />
                                    {item.badgeCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background animate-in zoom-in">
                                            {item.badgeCount > 99 ? '99+' : item.badgeCount}
                                        </span>
                                    )}
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
