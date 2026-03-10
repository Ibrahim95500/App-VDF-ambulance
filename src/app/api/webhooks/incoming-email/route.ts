import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendPushNotification } from '@/actions/web-push.actions';

const WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'vdf-auto-secret-key-2026';

export async function POST(req: Request) {
    try {
        // 1. Authenticate the webhook request
        const authHeader = req.headers.get('authorization');
        if (!authHeader || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { senderEmail, subject, category, description } = body;

        // 2. Validate input
        if (!senderEmail || !description) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 3. Find the user by their email address
        const user = await prisma.user.findUnique({
            where: { email: senderEmail }
        });

        if (!user) {
            console.error(`Received email from unknown user: ${senderEmail}`);
            // We can decide to either drop it or save it under a generic "System" user.
            // For now, let's reject it to avoid spam.
            return NextResponse.json({ error: 'User not found for this email address' }, { status: 404 });
        }

        // 4. Create the ServiceRequest in the database
        // We set the source to EMAIL so RH knows where it came from.
        const serviceRequest = await prisma.serviceRequest.create({
            data: {
                userId: user.id,
                source: 'EMAIL',
                subject: subject || 'Demande par Email',
                category: category || 'General',
                description: description,
                status: 'PENDING'
            }
        });

        // 5. Notify RH via Push (if any RH users have push subscriptions)
        try {
            const rhUsers = await prisma.user.findMany({
                where: { roles: { has: 'RH' }, isActive: true }
            });

            const pushPromises = rhUsers.map(rh =>
                sendPushNotification(
                    rh.id,
                    '📧 Nouvelle demande par Email',
                    `${user.firstName} ${user.lastName} a envoyé une nouvelle demande automatique par email.`,
                    `/dashboard/rh/services?id=${serviceRequest.id}`
                )
            );

            await Promise.allSettled(pushPromises);
        } catch (pushError) {
            console.error('Error sending push notifications to RH:', pushError);
            // Don't fail the webhook if push fails.
        }

        return NextResponse.json({
            success: true,
            message: 'Service request created successfully',
            requestId: serviceRequest.id
        });

    } catch (error) {
        console.error('Error in email webhook:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
