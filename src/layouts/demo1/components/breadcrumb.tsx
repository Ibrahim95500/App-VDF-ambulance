'use client';

import { Fragment } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { MENU_SIDEBAR } from '@/config/menu.config';
import { MenuItem } from '@/config/types';
import { cn } from '@/lib/utils';
import { useMenu } from '@/hooks/use-menu';

export function Breadcrumb() {
  const pathname = usePathname();
  const { getBreadcrumb, isActive } = useMenu(pathname);
  const items: MenuItem[] = getBreadcrumb(MENU_SIDEBAR);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.25 text-sm lg:text-base font-medium mb-2.5 lg:mb-0">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const active = item.path ? isActive(item.path) : false;

        const isDashboardTitle = item.title === 'Dashboard VDF Ambulance';

        return (
          <Fragment key={`root-${index}`}>
            <span
              className={cn(
                active ? 'text-mono' : 'text-secondary-foreground',
                isDashboardTitle && "text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-blue-600 tracking-tight leading-none px-1"
              )}
              key={`item-${index}`}
            >
              {item.title}
            </span>
            {!last && (
              <ChevronRight
                className="size-3.5 text-muted-foreground"
                key={`separator-${index}`}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
