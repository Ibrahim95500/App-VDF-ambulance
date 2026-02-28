import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/actions/notifications.actions"
import { getBrandedEmailHtml } from "@/lib/email-templates"
import nodemailer from "nodemailer"

/**
 * API Route for external service requests (WhatsApp, Email via n8n)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const { email, subject, description, category, source, secret } = body

        // Basic Security Check
        const apiSecret = process.env.EXTERNAL_API_SECRET || "vdf_external_secret_2026"
        if (secret !== apiSecret) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        if (!email || !subject || !description) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email }
        })

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        // Create the Service Request
        const request = await prisma.serviceRequest.create({
            data: {
                userId: user.id,
                subject,
                description,
                category: category || "AUTRE",
                source: source || "WHATSAPP", // Default to WhatsApp for n8n
            }
        })

        // Notify RH
        const rhUsers = await prisma.user.findMany({ where: { role: 'RH' } })
        for (const rh of rhUsers) {
            await createNotification({
                userId: rh.id,
                title: `Demande (${source || 'WHATSAPP'})`,
                message: `${user.firstName || user.name} a envoyé une demande via ${source || 'WhatsApp'}.`,
                type: "SERVICE",
                status: "PENDING",
                link: "/dashboard/rh/services"
            })
        }

        // Email to RH
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
                port: Number(process.env.EMAIL_SERVER_PORT) || 587,
                secure: false,
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                }
            } as any);

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: process.env.EMAIL_ADMIN_NOTIFY || "ibrahim.nifa01@gmail.com",
                subject: `[${source || 'EXT'} Request] ${subject} - ${user.name}`,
                html: getBrandedEmailHtml({
                    title: `Nouvelle Demande (${source || 'WhatsApp'})`,
                    preheader: `Message de ${user.name}`,
                    content: `
                        <p>Une demande a été reçue via un canal externe (n8n).</p>
                        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; border: 1px solid #dcfce7; margin: 20px 0;">
                            <p><strong>Collaborateur :</strong> ${user.name}</p>
                            <p><strong>Source :</strong> ${source || 'WhatsApp'}</p>
                            <p><strong>Sujet :</strong> ${subject}</p>
                            <p><strong>Description :</strong></p>
                            <p style="white-space: pre-wrap;">${description}</p>
                        </div>
                    `,
                    actionUrl: `${process.env.NEXTAUTH_URL}/dashboard/rh/services`,
                    actionText: "Traiter la demande"
                })
            });
        } catch (e) {
            console.error("External request email failed:", e);
        }

        return NextResponse.json({ success: true, requestId: request.id })

    } catch (error: any) {
        console.error("External API error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
