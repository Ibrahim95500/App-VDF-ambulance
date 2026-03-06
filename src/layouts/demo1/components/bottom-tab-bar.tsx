'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Home, CalendarClock, Euro, Users, User, LayoutList, LifeBuoy, CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from 'motion/react';

export function BottomTabBar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const isMobile = useIsMobile();
    const isRH = (session?.user as any)?.role === 'RH';

    // Desktop: hidden.
    if (!isMobile) return null;

    const navItems = isRH
        ? [
            { label: 'Accueil', href: '/dashboard/rh', icon: Home },
            // { label: 'Congés', href: '/dashboard/rh/conges', icon: CalendarClock },
            { label: 'Acomptes', href: '/dashboard/rh/acomptes', icon: Euro },
            { label: 'Rendez-vous', href: '/dashboard/rh/rendez-vous', icon: CalendarRange },
            { label: 'Services', href: '/dashboard/rh/services', icon: LifeBuoy },
            { label: 'Équipe', href: '/dashboard/rh/collaborateurs', icon: Users },
            { label: 'Profil', href: '/dashboard/profil', icon: User },
        ]
        : [
            { label: 'Acomptes', href: '/dashboard/salarie', icon: Euro },
            // { label: 'Congés', href: '/dashboard/salarie/conges', icon: CalendarClock },
            { label: 'Rendez-vous', href: '/dashboard/salarie/rendez-vous', icon: CalendarRange },
            { label: 'Services', href: '/dashboard/salarie/services', icon: LifeBuoy },
            { label: 'Profil', href: '/dashboard/profil', icon: User },
        ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pb-[env(safe-area-inset-bottom)]">
            <div className="flex items-center justify-around h-16">
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
