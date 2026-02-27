'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NotificationsSheet } from './notifications-sheet';
import { getUnreadNotificationsCount } from '@/actions/notifications.actions';

export function NotificationBell() {
    const [count, setCount] = useState(0);

    const fetchCount = async () => {
        try {
            const c = await getUnreadNotificationsCount();
            setCount(c);
        } catch (err) {
            console.error("Error fetching notifications count:", err);
        }
    };

    useEffect(() => {
        fetchCount();
        // Poll every 1 minute for basic real-time feel if needed
        const interval = setInterval(fetchCount, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <NotificationsSheet
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
