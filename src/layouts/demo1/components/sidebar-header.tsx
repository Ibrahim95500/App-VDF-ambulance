'use client';

import Link from 'next/link';
import { ChevronFirst } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';
import { VdfLogo } from '@/components/vdf-logo';

export function SidebarHeader() {
  const { settings, storeOption } = useSettings();

  const handleToggleClick = () => {
    storeOption(
      'layouts.demo1.sidebarCollapse',
      !settings.layouts.demo1.sidebarCollapse,
    );
  };

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link href="/">
        <div className="flex items-center gap-2">
          <VdfLogo className="h-10 w-auto" />
          {!settings.layouts.demo1.sidebarCollapse && (
            <span className="text-lg font-bold text-foreground truncate pl-2" style={{ color: '#2c3e8a' }}>
              App Ambulance
            </span>
          )}
        </div>
      </Link>
      <Button
        onClick={handleToggleClick}
        size="sm"
        variant="outline"
        className={cn(
          'size-8 absolute -end-4 top-1/2 -translate-y-1/2 z-[100] rounded-full bg-background border-border shadow-md hover:text-primary hover:bg-slate-50 transition-all duration-300',
          settings.layouts.demo1.sidebarCollapse && 'translate-x-0'
        )}
      >
        <div className={cn(
          "transition-transform duration-500",
          settings.layouts.demo1.sidebarCollapse ? "rotate-180" : "rotate-0"
        )}>
          <ChevronFirst className="size-4" />
        </div>
      </Button>
    </div>
  );
}
