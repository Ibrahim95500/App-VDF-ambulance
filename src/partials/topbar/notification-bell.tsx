'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsSheet } from './notifications-sheet';
import { getUnreadNotificationsCount } from '@/actions/notifications.actions';

export function NotificationBell({ initialCount = 0 }: { initialCount?: number }) {
    const [count, setCount] = useState(initialCount);

    // Sync count with initialCount prop (from server revalidation)
    useEffect(() => {
        setCount(initialCount);
    }, [initialCount]);

    const fetchCount = async () => {
        try {
            const c = await getUnreadNotificationsCount();
            setCount(c);
        } catch (err) {
            console.error("Error fetching notifications count:", err);
        }
    };

    useEffect(() => {
        // Only fetch if we're not using the initialCount from revalidation
        // or for regular polling
        const interval = setInterval(fetchCount, 60000);

        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationsSheet
            onAllRead={fetchCount}
            trigger={
                <div className="relative inline-flex">
                    <Button variant="ghost" mode="icon" className="size-9 rounded-full bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 transition-colors shadow-sm">
                        <Bell size={20} />
                    </Button>
                    {count > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white ring-2 ring-white">
                            {count > 9 ? '9+' : count}
                        </span>
                    )}
                </div>
            }
        />
    );
}
