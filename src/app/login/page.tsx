import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import Link from 'next/link';
import { VdfLogo } from '@/components/vdf-logo';

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
    const error = searchParams?.error;

    return (
        <div className="flex grow min-h-screen items-center justify-center bg-gray-50 p-4 w-full">
            <Card className="w-full max-w-md border-gray-200 shadow-lg rounded-2xl overflow-hidden">
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
                        {/* Google Auth */}
                        <form
                            action={async () => {
                                "use server"
                                await signIn("google", { redirectTo: "/dashboard" })
                            }}
                        >
                            <Button
                                type="submit"
                                variant="outline"
                                className="w-full h-11 font-medium bg-white hover:bg-gray-50 text-gray-700 border-gray-300 transition-colors"
                            >
                                <svg viewBox="0 0 32 32" fill="none" role="img" className="mr-2 h-5 w-5">
                                    <path d="M16.2449 13.8184V18.4657H22.8349C22.5455 19.9602 21.6771 21.2257 20.3747 22.0766L24.3487 25.0985C26.6642 23.004 28 19.9276 28 16.273C28 15.4221 27.9221 14.6039 27.7773 13.8185L16.2449 13.8184Z" fill="#4285F4" />
                                    <path d="M5.3137 10.6221C4.47886 12.2366 4.00024 14.0584 4.00024 16.0002C4.00024 17.942 4.47886 19.7639 5.3137 21.3784C5.3137 21.3892 9.388 18.2802 9.388 18.2802C9.14311 17.5602 8.99835 16.7966 8.99835 16.0001C8.99835 15.2036 9.14311 14.44 9.388 13.72L5.3137 10.6221Z" fill="#FBBC05" />
                                    <path d="M16.2448 8.77821C18.0482 8.77821 19.6511 9.3891 20.9313 10.5673L24.4378 7.13097C22.3116 5.18917 19.551 4 16.2448 4C11.4582 4 7.32833 6.69456 5.31348 10.6219L9.38766 13.7201C10.3561 10.8837 13.0611 8.77821 16.2448 8.77821Z" fill="#EA4335" />
                                    <path d="M9.38238 18.2842L8.48609 18.9566L5.31348 21.3784C7.32833 25.2947 11.4579 28.0002 16.2445 28.0002C19.5506 28.0002 22.3224 26.9311 24.3484 25.0984L20.3744 22.0766C19.2835 22.7966 17.892 23.233 16.2445 23.233C13.0609 23.233 10.3559 21.1275 9.38739 18.2911L9.38238 18.2842Z" fill="#34A853" />
                                </svg>
                                Continuer avec Google
                            </Button>
                        </form>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-3 text-gray-500 font-medium">Ou avec email</span>
                            </div>
                        </div>

                        {/* Credentials Auth */}
                        <form
                            action={async (formData) => {
                                "use server"
                                try {
                                    await signIn("credentials", {
                                        email: formData.get("email"),
                                        password: formData.get("password"),
                                        redirectTo: "/dashboard"
                                    })
                                } catch (error: any) {
                                    if (error instanceof AuthError) {
                                        redirect("/login?error=CredentialsSignin")
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
