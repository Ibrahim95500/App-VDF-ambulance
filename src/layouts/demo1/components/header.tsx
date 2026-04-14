'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchDialog } from '@/partials/dialogs/search/search-dialog';
import { AppsDropdownMenu } from '@/partials/topbar/apps-dropdown-menu';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { NotificationBell } from '@/partials/topbar/notification-bell';
import { SupportTicketModal } from '@/components/support/support-ticket-modal';
import { useSession } from 'next-auth/react';
import {
  LayoutGrid,
  Menu,
  MessageCircleMore,
  Search,
  LifeBuoy
} from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useScrollPosition } from '@/hooks/use-scroll-position';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Container } from '@/components/common/container';

import { Breadcrumb } from './breadcrumb';
import { MegaMenu } from './mega-menu';
import { SidebarMenu } from './sidebar-menu';
import { VdfLogo } from '@/components/vdf-logo';

export function Header({ notificationsCount = 0 }: { notificationsCount?: number }) {
  const [isSidebarSheetOpen, setIsSidebarSheetOpen] = useState(false);
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [hasUnreadSupport, setHasUnreadSupport] = useState(false);

  const pathname = usePathname();
  const mobileMode = useIsMobile();
  const { data: session } = useSession();
  const [imgError, setImgError] = useState(false);

  // Reset error state when session changes (e.g. after image upload)
  useEffect(() => { setImgError(false) }, [(session?.user as any)?.image])

  // Poll for support badge
  useEffect(() => {
    if (session?.user?.id) {
      const fetchSupportBadge = async () => {
        try {
          const res = await fetch('/api/support/ticket/badge');
          if (res.ok) {
            const data = await res.json();
            setHasUnreadSupport(data.hasUnreadResolved);
          }
        } catch (e) {
          // Silent fail
        }
      };

      fetchSupportBadge();
      const interval = setInterval(fetchSupportBadge, 10000); // 10 secondes polling
      return () => clearInterval(interval);
    }
  }, [session?.user?.id]);

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-[40] start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex gap-1 lg:hidden items-center gap-2">
          <Link href="/dashboard" className="shrink-0 flex items-center gap-2">
            <VdfLogo className="h-10 w-auto" />
            <span className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-blue-600 tracking-tight leading-none">
              VDF Ambulance
            </span>
          </Link>
          <div className="flex items-center">
            {/* Hamburger menu restored to give full menu access alongside BottomTabBar */}
            <Sheet open={isSidebarSheetOpen} onOpenChange={setIsSidebarSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-foreground">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] p-0 border-r-0 bg-background flex flex-col">
                <SheetHeader className="p-4 border-b border-border bg-muted/20">
                  <SheetTitle className="flex items-center gap-2 text-left">
                    <VdfLogo className="w-8 h-8" />
                    <span className="text-base font-bold" style={{ color: '#2c3e8a' }}>VDF Menu</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <SidebarMenu />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Main Content (Breadcrumbs) hidden on small mobile to avoid overlapping the burger menu */}
        <div className="hidden md:flex flex-1 items-center px-4">
          {pathname.startsWith('/dashboard') && <Breadcrumb />}
        </div>

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              onClick={() => setIsSupportModalOpen(true)}
              title="Support Technique IT"
            >
              <LifeBuoy className="h-5 w-5" />
            </Button>
            {hasUnreadSupport && (
              <span className="absolute top-0 right-0 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
              </span>
            )}
          </div>
          <NotificationBell initialCount={notificationsCount} />
          <UserDropdownMenu trigger={
            <div className="size-9 rounded-full border-2 border-green-500 shrink-0 cursor-pointer overflow-hidden flex items-center justify-center bg-primary/10 text-primary font-bold text-xs">
              {(session?.user as any)?.image && !imgError ? (
                <img
                  className="w-full h-full object-cover"
                  src={(session?.user as any).image}
                  alt="User Avatar"
                  onError={() => setImgError(true)}
                />
              ) : (
                <span>{session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || '?'}</span>
              )}
            </div>
          } />
        </div>
      </Container>
      
      <SupportTicketModal isOpen={isSupportModalOpen} onClose={() => setIsSupportModalOpen(false)} />
    </header>
  );
}
