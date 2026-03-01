"use server"

import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import nodemailer from "nodemailer"
import { auth } from "@/auth"
import { randomUUID } from "crypto"
import { z } from "zod"

// Validation Schemas
const CreateCollaboratorSchema = z.object({
    email: z.string().email("Format d'email invalide").toLowerCase().max(100, "L'email ne doit pas dépasser 100 caractères"),
    firstName: z.string().min(2, "Le prénom doit faire au moins 2 caractères").max(50, "Le prénom ne doit pas dépasser 50 caractères"),
    lastName: z.string().min(2, "Le nom doit faire au moins 2 caractères").max(50, "Le nom ne doit pas dépasser 50 caractères"),
    phone: z.string().max(12, "Le numéro de téléphone ne doit pas dépasser 12 caractères").optional(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)").optional().nullable(),
    role: z.enum(["SALARIE", "RH"]).default("SALARIE"),
});

const UpdateProfileSchema = z.object({
    firstName: z.string().min(1, "Le prénom est requis").max(50, "Le prénom ne doit pas dépasser 50 caractères"),
    lastName: z.string().min(1, "Le nom est requis").max(50, "Le nom ne doit pas dépasser 50 caractères"),
    phone: z.string().max(12, "Le numéro de téléphone ne doit pas dépasser 12 caractères").optional().nullable(),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (AAAA-MM-JJ)").optional().nullable(),
});

const UpdatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z.string().min(6, "Le nouveau mot de passe doit faire au moins 6 caractères"),
    confirmPassword: z.string().min(6, "La confirmation est requise"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les nouveaux mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

// Helper to generate a random password
function generateRandomPassword(length = 10) {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

export async function createCollaborator(formData: FormData) {
    const validatedFields = CreateCollaboratorSchema.safeParse({
        email: formData.get("email"),
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        birthDate: formData.get("birthDate"),
        role: formData.get("role") || "SALARIE",
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { email, firstName, lastName, phone, birthDate: birthDateStr, role } = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { error: "Cet utilisateur (email) est déjà renseigné dans l'application." };
        }

        const rawPassword = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        const birthDate = birthDateStr ? new Date(birthDateStr) : null;
        if (birthDate && birthDate > new Date()) {
            return { error: "La date de naissance ne peut pas être dans le futur." };
        }
        const fullName = `${firstName} ${lastName}`;

        await prisma.user.create({
            data: {
                email,
                name: fullName,
                firstName,
                lastName,
                phone,
                birthDate,
                password: hashedPassword,
                role: role as "SALARIE" | "RH"
            }
        });

        try {
            // Send email with credentials
            const smtpConfig = process.env.EMAIL_SERVER
                ? process.env.EMAIL_SERVER
                : {
                    host: process.env.EMAIL_SERVER_HOST,
                    port: Number(process.env.EMAIL_SERVER_PORT),
                    auth: {
                        user: process.env.EMAIL_SERVER_USER,
                        pass: process.env.EMAIL_SERVER_PASSWORD,
                    }
                };

            const transporter = nodemailer.createTransport(smtpConfig);

            const { getBrandedEmailHtml } = await import("@/lib/email-templates");

            await transporter.sendMail({
                from: process.env.EMAIL_FROM,
                to: email,
                subject: "Vos accès App Ambulance",
                html: getBrandedEmailHtml({
                    title: "Bienvenue chez VDF Ambulance",
                    preheader: "Vos accès à l'application sont disponibles",
                    content: `
                        <p>Bonjour ${firstName},</p>
                        <p>Votre compte a été créé par l'administration RH avec succès.</p>
                        <p>Voici vos informations de connexion personnelles :</p>
                        <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                            <p style="margin: 5px 0;"><strong>Email :</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Mot de passe temporaire :</strong> ${rawPassword}</p>
                        </div>
                        <p>Lors de votre première connexion, nous vous recommandons de modifier votre mot de passe pour plus de sécurité.</p>
                        <p>À très bientôt sur notre plateforme !</p>
                    `,
                    actionUrl: process.env.NEXTAUTH_URL || 'https://vdf-ambulance.fr',
                    actionText: "Se connecter à l'espace"
                })
            });
        } catch (emailError) {
            console.error("Failed to send email. SMTP is likely misconfigured. Raw Password is:", rawPassword);
            console.error(emailError);
            revalidatePath("/dashboard/rh/collaborateurs");
            return { success: `Compte créé avec succès. (Le mot de passe temporaire est ${rawPassword}). Note: L'envoi de l'email a échoué car le serveur SMTP n'est pas configuré.` };
        }

        revalidatePath("/dashboard/rh/collaborateurs");
        return { success: "Le collaborateur a été créé avec succès et un email a été envoyé." };
    } catch (error) {
        console.error("User creation error:", error);
        return { error: "Une erreur s'est produite lors de la création." };
    }
}

export async function updateUserProfile(formData: FormData) {
    const validatedFields = UpdateProfileSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        phone: formData.get("phone"),
        birthDate: formData.get("birthDate"),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { firstName, lastName, phone, birthDate: birthDateStr } = validatedFields.data;

    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Non autorisé." };
    }

    try {
        const birthDate = birthDateStr ? new Date(birthDateStr) : null;
        if (birthDate && birthDate > new Date()) {
            return { error: "La date de naissance ne peut pas être dans le futur." };
        }
        const fullName = `${firstName} ${lastName}`;

        await prisma.user.update({
            where: { email: session.user.email },
            data: {
                name: fullName,
                firstName,
                lastName,
                phone,
                birthDate
            }
        });

        revalidatePath("/dashboard/profil");
        return { success: "Profil mis à jour avec succès !" };
    } catch (error) {
        console.error("Profile update error:", error);
        return { error: "Une erreur s'est produite lors de la mise à jour du profil." };
    }
}

export async function updateUserImage(base64Image: string) {
    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Non autorisé." };
    }

    try {
        await prisma.user.update({
            where: { email: session.user.email },
            data: { image: base64Image }
        });

        revalidatePath("/");
        return { success: "Photo de profil mise à jour !", image: base64Image };
    } catch (error) {
        console.error("Image update error:", error);
        return { error: "Une erreur s'est produite lors de la mise à jour de la photo." };
    }
}

export async function updateUserPassword(formData: FormData) {
    const validatedFields = UpdatePasswordSchema.safeParse({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.issues[0].message };
    }

    const { currentPassword, newPassword } = validatedFields.data;

    const session = await auth();
    if (!session?.user?.email) {
        return { error: "Non autorisé." };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email }
        });

        if (!user || !user.password) {
            return { error: "Utilisateur non trouvé ou compte externe (Google)." };
        }

        const isCorrect = await bcrypt.compare(currentPassword, user.password);
        if (!isCorrect) {
            return { error: "Le mot de passe actuel est incorrect." };
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { email: session.user.email },
            data: { password: hashedNewPassword }
        });

        return { success: "Mot de passe mis à jour avec succès !" };
    } catch (error) {
        console.error("Password update error:", error);
        return { error: "Une erreur s'est produite lors de la mise à jour." };
    }
}

export async function requestPasswordReset(formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
        return { error: "L'email est requis." };
    }

    try {
        console.log(`[RESET] Request for email: ${email}`);
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log(`[RESET] User not found: ${email}`);
            return { error: "Utilisateur non trouvé dans la base de données pour cet email." };
        }

        console.log(`[RESET] User found: ${user.name} (${user.id})`);

        const token = randomUUID();
        const expires = new Date(Date.now() + 3600 * 1000); // 1 hour

        // Using standard VerificationToken model
        await prisma.verificationToken.deleteMany({ where: { identifier: email } });
        await prisma.verificationToken.create({
            data: { identifier: email, token, expires }
        });

        console.log(`[RESET] Token created and saved in VerificationToken for ${email}`);

        const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/login/reset-password?token=${token}`;

        console.log(`[RESET] Attempting to send email to ${email} via ${process.env.EMAIL_SERVER_HOST}`);

        const smtpConfig = process.env.EMAIL_SERVER
            ? process.env.EMAIL_SERVER
            : {
                host: process.env.EMAIL_SERVER_HOST,
                port: Number(process.env.EMAIL_SERVER_PORT),
                auth: {
                    user: process.env.EMAIL_SERVER_USER,
                    pass: process.env.EMAIL_SERVER_PASSWORD,
                }
            };

        const transporter = nodemailer.createTransport(smtpConfig);

        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: "Réinitialisation de votre mot de passe - App Ambulance",
            html: `
                <h2>Réinitialisation de mot de passe</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe pour App Ambulance.</p>
                <p>Cliquez sur le lien ci-dessous pour choisir un nouveau mot de passe :</p>
                <a href="${resetLink}">${resetLink}</a>
                <p>Ce lien expirera dans une heure.</p>
                <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
            `
        });

        console.log(`[RESET] Email sent successfully to ${email}. MessageId: ${info.messageId}`);

        return { success: "Si un compte existe pour cet email, un lien de réinitialisation a été envoyé." };
    } catch (error: any) {
        console.error("[RESET] Error during password reset process:", error);
        return { error: `Une erreur s'est produite: ${error.message || 'Erreur inconnue'}` };
    }
}

export async function resetPassword(formData: FormData) {
    const token = formData.get("token") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!token || !password || !confirmPassword) {
        return { error: "Tous les champs sont requis." };
    }

    if (password !== confirmPassword) {
        return { error: "Les mots de passe ne correspondent pas." };
    }

    if (password.length < 6) {
        return { error: "Le mot de passe doit faire au moins 6 caractères." };
    }

    try {
        const resetTokenRecord = await prisma.verificationToken.findUnique({
            where: { token }
        });

        if (!resetTokenRecord || resetTokenRecord.expires < new Date()) {
            return { error: "Jeton invalide ou expiré." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.$transaction([
            prisma.user.update({
                where: { email: resetTokenRecord.identifier },
                data: { password: hashedPassword }
            }),
            prisma.verificationToken.delete({
                where: { token }
            })
        ]);

        return { success: "Votre mot de passe a été réinitialisé avec succès !" };
    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "Une erreur s'est produite lors de la réinitialisation." };
    }
}

export async function deactivateUser(userId: string, reason: string) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;

        console.log(`[DEACTIVATE] User: ${session?.user?.email}, Role: ${role}, Target ID: ${userId}`);

        if (!session?.user || (role !== "ADMIN" && role !== "RH")) {
            return { error: `Non autorisé. Votre rôle est : ${role || 'Inconnu'}. Seul un RH peut suspendre un compte.` };
        }

        if (!reason || reason.trim().length < 5) {
            return { error: "Un motif de suspension valide (au moins 5 caractères) est requis." };
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            return { error: "L'utilisateur à suspendre n'a pas été trouvé." };
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                isActive: false,
                deletionReason: reason,
            }
        });

        revalidatePath("/dashboard/rh/collaborateurs");
        return { success: `Le compte de ${targetUser.name || targetUser.email} a été suspendu.` };
    } catch (error: any) {
        console.error("Deactivate user error details:", error);
        return { error: `Erreur technique lors de la suspension: ${error.message || 'Erreur inconnue'}` };
    }
}

export async function reactivateUser(userId: string) {
    try {
        const session = await auth();
        const role = (session?.user as any)?.role;

        if (!session?.user || (role !== "ADMIN" && role !== "RH")) {
            return { error: "Non autorisé. Seul un RH peut réactiver un compte." };
        }

        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) {
            return { error: "L'utilisateur n'a pas été trouvé." };
        }

        await prisma.user.update({
            where: { id: userId },
            data: { isActive: true, deletionReason: null }
        });

        revalidatePath("/dashboard/rh/collaborateurs");
        return { success: `Le compte de ${targetUser.name || targetUser.email} a été réactivé avec succès.` };
    } catch (error: any) {
        console.error("Reactivate user error:", error);
        return { error: `Erreur technique: ${error.message || 'Erreur inconnue'}` };
    }
}
