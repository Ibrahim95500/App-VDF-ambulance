'use client';

import { JSX, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuConfig, MenuItem } from '@/config/types';
import { cn } from '@/lib/utils';
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
  AccordionMenuSub,
  AccordionMenuSubContent,
  AccordionMenuSubTrigger,
} from '@/components/ui/accordion-menu';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

export function SidebarMenu() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const roles = (session?.user as any)?.roles || [];
  let userRole = roles.includes('RH') || roles.includes('ADMIN') ? 'RH' : '';

  if (!userRole && status !== 'loading') {
    // If not loading and no role in session, check pathname as fallback
    if (pathname.startsWith('/dashboard/rh')) {
      userRole = 'RH';
    } else {
      userRole = 'SALARIE';
    }
  }

  // Filter menu based on role
  const filteredSidebarMenu = MENU_SIDEBAR.filter((item) => {
    // 0bis. Si c'est l'accueil général, tout le monde le voit
    if (item.path === '/dashboard') return true;

    // 1. ADMIN voit TOUT sans exception
    if (roles.includes('ADMIN')) return true;

    const isRH = roles.includes('RH');
    const isSalarie = roles.includes('SALARIE');
    const isRegulateur = roles.includes('REGULATEUR') || (session?.user as any)?.isRegulateur;

    // 2. Section "Mes Démarches" (SALARIE)
    if (item.heading === 'Mes Démarches' || item.path?.startsWith('/dashboard/salarie')) {
      return isSalarie || isRegulateur;
    }

    // 3. Section "Espace RH" (RH)
    if (item.heading === 'Espace RH' || (item.path?.startsWith('/dashboard/rh') && item.path !== '/dashboard/rh/regulation')) {
      return isRH;
    }

    // 4. Module Régulation spécifique (Régule RH)
    if (item.path === '/dashboard/rh/regulation') {
      return isRegulateur;
    }

    return false;
  });

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean => {
      if (path === '/dashboard/rh' && pathname === '/dashboard/rh') {
        return true;
      }
      if (path === '/dashboard' || path === '/dashboard/rh') {
        return pathname === '/dashboard' || pathname === '/dashboard/rh' || pathname === '/dashboard/salarie';
      }
      return path === pathname || (path.length > 1 && pathname.startsWith(path));
    },
    [pathname],
  );

  // Global classNames for consistent styling
  const classNames: AccordionMenuClassNames = {
    root: 'lg:ps-1 space-y-3',
    group: 'gap-px',
    label:
      'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
    separator: '',
    item: 'h-8 hover:bg-transparent text-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium data-[selected=true]:border-s-[3px] data-[selected=true]:border-secondary data-[selected=true]:ps-1.5 transition-all',
    sub: '',
    subTrigger:
      'h-8 hover:bg-transparent text-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium data-[selected=true]:border-s-[3px] data-[selected=true]:border-secondary data-[selected=true]:ps-1.5 transition-all',
    subContent: 'py-0',
    indicator: '',
  };

  const buildMenu = (items: MenuConfig): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (item.disabled) {
        return buildMenuItemRootDisabled(item, index);
      } else {
        return buildMenuItemRoot(item, index);
      }
    });
  };

  const buildMenuItemRoot = (item: MenuItem, index: number): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `root-${index}`}>
          <AccordionMenuSubTrigger className="text-sm font-medium">
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{item.title}</span>
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `root-${index}`}
            className="ps-6"
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(item.children, 1)}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem
          key={index}
          value={item.path || ''}
          className="text-sm font-medium"
        >
          <Link
            href={item.path || '#'}
            className="flex items-center justify-between grow gap-2"
          >
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <span data-slot="accordion-menu-title">{item.title}</span>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemRootDisabled = (
    item: MenuItem,
    index: number,
  ): JSX.Element => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-${index}`}
        className="text-sm font-medium"
      >
        {item.icon && <item.icon data-slot="accordion-menu-icon" />}
        <span data-slot="accordion-menu-title">{item.title}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuItemChildren = (
    items: MenuConfig,
    level: number = 0,
  ): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.disabled) {
        return buildMenuItemChildDisabled(item, index, level);
      } else {
        return buildMenuItemChild(item, index, level);
      }
    });
  };

  const buildMenuItemChild = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub
          key={index}
          value={item.path || `child-${level}-${index}`}
        >
          <AccordionMenuSubTrigger className="text-[13px]">
            {item.collapse ? (
              <span className="text-muted-foreground">
                <span className="hidden [[data-state=open]>span>&]:inline">
                  {item.collapseTitle}
                </span>
                <span className="inline [[data-state=open]>span>&]:hidden">
                  {item.expandTitle}
                </span>
              </span>
            ) : (
              item.title
            )}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn(
              'ps-4',
              !item.collapse && 'relative',
              !item.collapse && (level > 0 ? '' : ''),
            )}
          >
            <AccordionMenuGroup>
              {buildMenuItemChildren(
                item.children,
                item.collapse ? level : level + 1,
              )}
            </AccordionMenuGroup>
          </AccordionMenuSubContent>
        </AccordionMenuSub>
      );
    } else {
      return (
        <AccordionMenuItem
          key={index}
          value={item.path || ''}
          className="text-[13px]"
        >
          <Link href={item.path || '#'}>{item.title}</Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemChildDisabled = (
    item: MenuItem,
    index: number,
    level: number = 0,
  ): JSX.Element => {
    return (
      <AccordionMenuItem
        key={index}
        value={`disabled-child-${level}-${index}`}
        className="text-[13px]"
      >
        <span data-slot="accordion-menu-title">{item.title}</span>
        {item.disabled && (
          <Badge variant="secondary" size="sm" className="ms-auto me-[-10px]">
            Soon
          </Badge>
        )}
      </AccordionMenuItem>
    );
  };

  const buildMenuHeading = (item: MenuItem, index: number): JSX.Element => {
    return <AccordionMenuLabel key={index}>{item.heading}</AccordionMenuLabel>;
  };

  if (status === 'loading' || (status === 'authenticated' && roles.length === 0)) {
    return (
      <div className="kt-scrollable-y-hover flex grow shrink-0 py-5 px-5 lg:max-h-[calc(100vh-5.5rem)] opacity-50">
        {/* Fake Dashboard */}
        <div className="flex items-center gap-3 py-1">
          <div className="w-5 h-5 rounded-md bg-muted-foreground/20 animate-pulse" />
          <div className="h-4 w-32 bg-muted-foreground/20 rounded-md animate-pulse" />
        </div>

        {/* Fake Heading */}
        <div className="h-3 w-20 bg-muted-foreground/10 rounded-md animate-pulse mt-4 mb-2" />
        <div className="flex items-center gap-3 py-1">
          <div className="w-5 h-5 rounded-md bg-muted-foreground/20 animate-pulse" />
          <div className="h-4 w-28 bg-muted-foreground/20 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-3 py-1">
          <div className="w-5 h-5 rounded-md bg-muted-foreground/20 animate-pulse" />
          <div className="h-4 w-24 bg-muted-foreground/20 rounded-md animate-pulse" />
        </div>
        <div className="flex items-center gap-3 py-1">
          <div className="w-5 h-5 rounded-md bg-muted-foreground/20 animate-pulse" />
          <div className="h-4 w-32 bg-muted-foreground/20 rounded-md animate-pulse" />
        </div>

        {/* Fake Heading 2 */}
        <div className="h-3 w-20 bg-muted-foreground/10 rounded-md animate-pulse mt-4 mb-2" />
        <div className="flex items-center gap-3 py-1">
          <div className="w-5 h-5 rounded-md bg-muted-foreground/20 animate-pulse" />
          <div className="h-4 w-24 bg-muted-foreground/20 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="kt-scrollable-y-hover flex grow shrink-0 py-5 px-5 lg:max-h-[calc(100vh-5.5rem)]">
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
      >
        {buildMenu(filteredSidebarMenu)}
      </AccordionMenu>
    </div>
  );
}
