import { ReactNode } from 'react';
import { Demo1Layout } from '@/layouts/demo1/layout';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
    children,
}: {
    children: ReactNode;
}) {
    const session = await auth();

    if (!session?.user) {
        redirect('/login');
    }

    return <Demo1Layout>{children}</Demo1Layout>;
}
