import { ReactNode } from 'react';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getUnreadNotificationsCount } from '@/actions/notifications.actions';

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    const unreadCount = await getUnreadNotificationsCount();

    return <Demo1Layout notificationsCount={unreadCount}>{children}</Demo1Layout>;
}
