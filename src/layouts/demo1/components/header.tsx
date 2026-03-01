'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SearchDialog } from '@/partials/dialogs/search/search-dialog';
import { AppsDropdownMenu } from '@/partials/topbar/apps-dropdown-menu';
import { ChatSheet } from '@/partials/topbar/chat-sheet';
import { NotificationsSheet } from '@/partials/topbar/notifications-sheet';
import { UserDropdownMenu } from '@/partials/topbar/user-dropdown-menu';
import { NotificationBell } from '@/partials/topbar/notification-bell';
import { useSession } from 'next-auth/react';
import {
  LayoutGrid,
  Menu,
  MessageCircleMore,
  Search,
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

  const pathname = usePathname();
  const mobileMode = useIsMobile();
  const { data: session } = useSession();
  const [imgError, setImgError] = useState(false);

  // Reset error state when session changes (e.g. after image upload)
  useEffect(() => { setImgError(false) }, [(session?.user as any)?.image])

  const scrollPosition = useScrollPosition();
  const headerSticky: boolean = scrollPosition > 0;

  // Close sheet when route changes
  useEffect(() => {
    setIsSidebarSheetOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        'header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-transparent bg-background end-0 pe-[var(--removed-body-scroll-bar-size,0px)]',
        headerSticky && 'border-b border-border',
      )}
    >
      <Container className="flex justify-between items-stretch lg:gap-4">
        {/* HeaderLogo */}
        <div className="flex gap-1 lg:hidden items-center gap-2">
          <Link href="/dashboard" className="shrink-0 flex items-center gap-2">
            <VdfLogo className="w-8 h-8" />
            <span className="text-base font-bold hidden sm:inline" style={{ color: '#2c3e8a' }}>
              VDF Ambulance
            </span>
          </Link>
          <div className="flex items-center">
            {mobileMode && (
              <Sheet
                open={isSidebarSheetOpen}
                onOpenChange={setIsSidebarSheetOpen}
              >
                <SheetTrigger asChild>
                  <Button variant="ghost" mode="icon">
                    <Menu className="text-muted-foreground/70" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  className="p-0 gap-0 w-[275px]"
                  side="left"
                  close={false}
                >
                  <SheetHeader className="p-0 space-y-0">
                    <SheetTitle className="sr-only">Menu principal</SheetTitle>
                  </SheetHeader>
                  <SheetBody className="p-0 overflow-y-auto">
                    <SidebarMenu />
                  </SheetBody>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>

        {/* Main Content (Breadcrumbs) */}
        {pathname.startsWith('/dashboard') && <Breadcrumb />}

        {/* HeaderTopbar */}
        <div className="flex items-center gap-3">
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
    </header>
  );
}
