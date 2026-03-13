'use client';
'use client';

import { JSX, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon } from 'lucide-react';
import { MENU_MEGA_MOBILE } from '@/config/menu.config';
import { cn } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { getNotificationStats } from '@/actions/notification-stats.actions';
import { useState, useEffect } from 'react';
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

export interface MenuItem {
  title?: string;
  icon?: LucideIcon;
  path?: string;
  rootPath?: string;
  childrenIndex?: number;
  heading?: string;
  children?: MenuItem[];
  disabled?: boolean;
  collapse?: boolean;
  collapseTitle?: string;
  expandTitle?: string;
  badge?: string;
  separator?: boolean;
}

export type MenuConfig = MenuItem[];

export function MegaMenuMobile() {
  const pathname = usePathname();

  // Memoize matchPath to prevent unnecessary re-renders
  const matchPath = useCallback(
    (path: string): boolean =>
      path === pathname || (path.length > 1 && pathname.startsWith(path)),
    [pathname],
  );

  // Global classNames for consistent styling
  const classNames: AccordionMenuClassNames = {
    root: 'space-y-1',
    group: 'gap-px',
    label:
      'uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px',
    separator: '',
    item: 'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    sub: '',
    subTrigger:
      'h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium',
    subContent: 'py-0',
    indicator: '',
  };

  const buildMenu = (items: MenuConfig): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (item.heading) {
        return buildMenuHeading(item, index);
      } else if (!item.disabled) {
        return buildMenuItemRoot(item, index);
      } else {
        return <></>;
      }
    });
  };

  const buildMenuItemRoot = (item: MenuItem, index: number): JSX.Element => {
    if (item.children) {
      return (
        <AccordionMenuSub key={index} value={item.path || `root-${index}`}>
          <AccordionMenuSubTrigger className="text-sm font-medium">
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <div className="flex items-center justify-between grow gap-2">
              <span data-slot="accordion-menu-title">{item.title}</span>
              {item.badge && (
                <Badge variant="secondary" size="sm" className="ms-auto">
                  {item.badge}
                </Badge>
              )}
            </div>
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
          <Link href={item.path || '#'} className="">
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <div className="flex items-center justify-between grow gap-2">
              <span data-slot="accordion-menu-title">{item.title}</span>
              {(() => {
                let count = 0;
                const path = item.path || '';
                
                if (path.startsWith('/dashboard/rh')) {
                  if (path.includes('acomptes')) count = stats.global.advances;
                  if (path.includes('services')) count = stats.global.services + stats.global.leaves;
                  if (path.includes('rendez-vous')) count = stats.global.appointments;
                  if (path.includes('regulation')) count = stats.global.regulation;
                } else if (path.startsWith('/dashboard/salarie')) {
                  if (path.includes('acomptes')) count = stats.personal.advances;
                  if (path.includes('services')) count = stats.personal.services + stats.personal.leaves;
                  if (path.includes('rendez-vous')) count = stats.personal.appointments;
                  if (path.includes('regulation')) count = stats.personal.mission;
                }

                if (count > 0) {
                  return (
                    <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                      {count > 99 ? '99+' : count}
                    </span>
                  );
                }
                
                if (item.badge) {
                  return (
                    <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {item.badge}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuItemChildren = (
    items: MenuConfig,
    level: number = 0,
  ): JSX.Element[] => {
    return items.map((item: MenuItem, index: number) => {
      if (!item.disabled) {
        return buildMenuItemChild(item, index, level);
      } else {
        return <></>;
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
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
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
            {(() => {
              let count = 0;
              const path = item.path || '';
              
              if (path.startsWith('/dashboard/rh')) {
                if (path.includes('acomptes')) count = stats.global.advances;
                if (path.includes('services')) count = stats.global.services + stats.global.leaves;
                if (path.includes('rendez-vous')) count = stats.global.appointments;
                if (path.includes('regulation')) count = stats.global.regulation;
              } else if (path.startsWith('/dashboard/salarie')) {
                if (path.includes('acomptes')) count = stats.personal.advances;
                if (path.includes('services')) count = stats.personal.services + stats.personal.leaves;
                if (path.includes('rendez-vous')) count = stats.personal.appointments;
                if (path.includes('regulation')) count = stats.personal.mission;
              }

              if (count > 0) {
                return (
                  <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                    {count > 99 ? '99+' : count}
                  </span>
                );
              }
              
              if (item.badge) {
                return (
                  <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                    {item.badge}
                  </span>
                );
              }
              return null;
            })()}
          </AccordionMenuSubTrigger>
          <AccordionMenuSubContent
            type="single"
            collapsible
            parentValue={item.path || `child-${level}-${index}`}
            className={cn('ps-4', !item.collapse && 'relative')}
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
          <Link href={item.path || '#'}>
            {item.icon && <item.icon data-slot="accordion-menu-icon" />}
            <div className="flex items-center justify-between grow gap-2">
              <span>{item.title}</span>
              {(() => {
                let count = 0;
                const path = item.path || '';
                
                if (path.startsWith('/dashboard/rh')) {
                  if (path.includes('acomptes')) count = stats.global.advances;
                  if (path.includes('services')) count = stats.global.services + stats.global.leaves;
                  if (path.includes('rendez-vous')) count = stats.global.appointments;
                  if (path.includes('regulation')) count = stats.global.regulation;
                } else if (path.startsWith('/dashboard/salarie')) {
                  if (path.includes('acomptes')) count = stats.personal.advances;
                  if (path.includes('services')) count = stats.personal.services + stats.personal.leaves;
                  if (path.includes('rendez-vous')) count = stats.personal.appointments;
                  if (path.includes('regulation')) count = stats.personal.mission;
                }

                if (count > 0) {
                  return (
                    <span className="ms-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-lg">
                      {count > 99 ? '99+' : count}
                    </span>
                  );
                }
                
                if (item.badge) {
                  return (
                    <span className="ms-auto text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                      {item.badge}
                    </span>
                  );
                }
                return null;
              })()}
            </div>
          </Link>
        </AccordionMenuItem>
      );
    }
  };

  const buildMenuHeading = (item: MenuItem, index: number): JSX.Element => {
    return <AccordionMenuLabel key={index}>{item.heading}</AccordionMenuLabel>;
  };

  return (
    <div className="flex grow shrink-0 py-5 px-5">
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
      >
        {buildMenu(MENU_MEGA_MOBILE)}
      </AccordionMenu>
    </div>
  );
}
