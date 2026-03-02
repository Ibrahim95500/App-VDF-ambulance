import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link';
import { VdfLogo } from '@/components/vdf-logo';

export default async function LoginPage({
    searchParams
}: {
    searchParams: Promise<{ error?: string }>
}) {
    const params = await searchParams;
    const error = params?.error;

    return (
        <div
            className="flex grow min-h-screen items-center justify-center bg-gray-50 p-4 w-full relative"
            style={{
                backgroundImage: 'url("/media/app/login-bg.png")',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80"></div>
            <Card className="w-full max-w-md border-gray-200 shadow-2xl rounded-2xl overflow-hidden relative z-10">
                <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-orange-500"></div>
                <CardContent className="p-8 sm:p-10">
                    <div className="flex flex-col items-center text-center mb-8">
                        <Link href="/">
                            <VdfLogo className="h-24 w-auto mb-4" />
                        </Link>
                        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent pb-1">
                            Bienvenue
                        </h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Connectez-vous pour accéder à votre espace
                        </p>
                    </div>

                    {error === "UserNotFound" && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                            Cet utilisateur (email) n'existe pas dans l'application.
                        </div>
                    )}

                    {error === "InvalidPassword" && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                            Mot de passe incorrect. Veuillez vérifier votre saisie.
                        </div>
                    )}

                    {error === "AccountDeactivated" && (
                        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-md text-center font-medium">
                            Ce compte a été suspendu par l'administration.
                        </div>
                    )}

                    {error === "CredentialsSignin" && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                            Identifiants incorrects. Veuillez réessayer.
                        </div>
                    )}

                    {error === "DatabaseError" && (
                        <div className="mb-6 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm rounded-md text-center font-medium">
                            Le service de base de données est temporairement indisponible. Veuillez contacter l'administrateur.
                        </div>
                    )}

                    <div className="space-y-6">

                        {/* Credentials Auth */}
                        <form
                            action={async (formData) => {
                                "use server"
                                const email = formData.get("email") as string;
                                const password = formData.get("password") as string;

                                try {
                                    // Pre-check for better error messages
                                    const { prisma } = await import("@/lib/prisma");
                                    const user = await prisma.user.findUnique({
                                        where: { email: email?.trim().toLowerCase() }
                                    });

                                    if (!user) {
                                        redirect("/login?error=UserNotFound");
                                    }

                                    if (user.isActive === false) {
                                        redirect("/login?error=AccountDeactivated");
                                    }

                                    await signIn("credentials", {
                                        email: email,
                                        password: password,
                                        redirectTo: "/dashboard"
                                    })
                                } catch (error: any) {
                                    // Handle redirects first
                                    if (error.digest?.includes('NEXT_REDIRECT') || error.message === 'NEXT_REDIRECT') {
                                        throw error;
                                    }

                                    if (error instanceof AuthError) {
                                        redirect("/login?error=InvalidPassword")
                                    }

                                    // Check for DB connection errors
                                    const errorMessage = error.message || "";
                                    if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("Can't reach database")) {
                                        redirect("/login?error=DatabaseError")
                                    }

                                    throw error
                                }
                            }}
                            className="space-y-4"
                        >
                            <div className="space-y-2 relative">
                                <Label htmlFor="email" className="font-semibold text-gray-700 text-sm">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="jean.dupont@ambulance.com"
                                    required
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>
                            <div className="space-y-2 relative">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="font-semibold text-gray-700 text-sm">Mot de passe</Label>
                                    <Link
                                        href="/login/forgot-password"
                                        className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <Button type="submit" className="w-full h-11 font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm mt-2">
                                Se connecter
                            </Button>
                        </form>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
