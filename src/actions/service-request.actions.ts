"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { createNotification, createManyNotifications } from "./notifications.actions"
import { sendBrandedEmail } from "@/lib/mail"
import { z } from "zod"

const ServiceRequestSchema = z.object({
    category: z.string().min(1, "La catégorie est requise"),
    subject: z.string().min(3, "Le sujet doit faire au moins 3 caractères"),
    description: z.string().min(10, "La description doit faire au moins 10 caractères"),
});


/**
 * Create a new service request
 */
export async function createServiceRequest(category: string, subject: string, description: string) {
    console.log("--- DEBUG: createServiceRequest started ---");
    const session = await auth()
    console.log("Session User ID:", session?.user?.id);
    if (!session?.user?.id) throw new Error("Unauthorized")

    const validatedFields = ServiceRequestSchema.safeParse({ category, subject, description })
    if (!validatedFields.success) {
        throw new Error(validatedFields.error.issues[0].message)
    }

    console.log("Fields validated, creating request in DB...");
    const request = await prisma.serviceRequest.create({
        data: {
            category,
            subject,
            description,
            userId: session.user.id,
            source: 'APP'
        },
        include: { user: true }
    })
    console.log("Request created in DB:", request.id);

    // 1. In-app notifications for RH & Employee
    const rhUsers = await prisma.user.findMany({ where: { role: 'RH' } })
    const userName = session.user.name || "Utilisateur";

    const notifications: any[] = rhUsers.map(rh => ({
        userId: rh.id,
        title: "Nouvelle demande de service",
        message: `${userName} a soumis une demande (${category}).`,
        type: "SERVICE",
        status: "PENDING",
        link: "/dashboard/rh/services"
    }));

    // Add self-notification for the employee
    notifications.push({
        userId: session.user.id,
        title: "Demande de service soumise",
        message: `Votre demande (${category}) a été envoyée aux RH.`,
        type: "SERVICE",
        status: "PENDING",
        link: "/dashboard/salarie/services"
    });

    await createManyNotifications(notifications)

    // 2. Email notification to Admin/RH
    console.log("Sending email notification to admin...");
    try {
        await sendBrandedEmail({
            to: "ibrahim.nifa01@gmail.com",
            subject: `[Demande Service] ${subject} - ${session.user.name}`,
            title: "Nouvelle Demande de Service",
            preheader: `Nouvelle demande de ${session.user.name}`,
            content: `
                <p>Une nouvelle demande de service a été déposée sur l'application.</p>
                <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 20px 0;">
                    <p><strong>Collaborateur :</strong> ${session.user.name}</p>
                    <p><strong>Catégorie :</strong> ${category}</p>
                    <p><strong>Sujet :</strong> ${subject}</p>
                    <p><strong>Description :</strong></p>
                    <p style="white-space: pre-wrap; font-style: italic; color: #4b5563;">${description}</p>
                </div>
            `,
            actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/services`,
            actionText: "Voir la demande"
        });
        console.log("--- DEBUG: Email sent successfully ---");
    } catch (emailError) {
        console.error("--- DEBUG: Email sending FAILED ---");
        console.error(emailError);
    }

    revalidatePath('/dashboard/rh/services')
    revalidatePath('/dashboard/salarie/services')
    console.log("--- DEBUG: createServiceRequest finished successfully ---");
    return { success: true }
}

/**
 * Update service request status (Approve/Reject)
 */
export async function updateServiceRequestStatus(requestId: string, status: "APPROVED" | "REJECTED") {
    const session = await auth()
    if ((session?.user as any)?.role !== "RH") throw new Error("Unauthorized")

    const request = await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status },
        include: { user: true }
    })

    // 1. In-app notification for the user
    await createNotification({
        userId: request.userId,
        title: `Demande de service ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
        message: `Votre demande "${request.subject}" a été traitée par la RH.`,
        type: "SERVICE",
        status,
        link: "/dashboard/salarie/services"
    })

    // 2. Email notification to the User
    if (request.user.email) {
        try {
            await sendBrandedEmail({
                to: request.user.email,
                subject: `Décision : Votre demande de service "${request.subject}"`,
                title: `Demande ${status === 'APPROVED' ? 'Approuvée' : 'Refusée'}`,
                preheader: `Réponse à votre demande de service`,
                content: `
                    <p>Bonjour ${request.user.firstName || request.user.name},</p>
                    <p>Votre demande de service concernant "<strong>${request.subject}</strong>" a été examinée par le service RH.</p>
                    <p>Le statut de votre demande est désormais : 
                       <strong style="color: ${status === 'APPROVED' ? '#16a34a' : '#dc2626'};">
                         ${status === 'APPROVED' ? 'APPROUVÉE' : 'REFUSÉE'}
                       </strong>.
                    </p>
                    <p>Vous pouvez consulter les détails dans votre espace personnel.</p>
                `,
                actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/salarie/services`,
                actionText: "Accéder à mes demandes"
            });
        } catch (emailError) {
            console.error("Failed to send status update email:", emailError);
        }
    }

    revalidatePath('/dashboard/rh/services')
    revalidatePath('/dashboard/salarie/services')
    return { success: true }
}
