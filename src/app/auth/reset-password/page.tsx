'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { resetPassword } from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const [status, setStatus] = useState<{ error?: string; success?: string }>({});
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setStatus({});

        const formData = new FormData(event.currentTarget);
        if (token) formData.append('token', token);

        const result = await resetPassword(formData);

        setLoading(false);
        setStatus(result);
    }

    if (!token) {
        return (
            <div className="flex grow min-h-screen items-center justify-center bg-gray-50 p-4 w-full">
                <Card className="w-full max-w-md p-8 border-gray-200 shadow-lg rounded-2xl text-center">
                    <h2 className="text-xl font-bold text-red-600 mb-4">Lien invalide</h2>
                    <p className="text-gray-600 mb-6">Le jeton de réinitialisation est manquant.</p>
                    <Link href="/login" className="text-primary font-medium hover:underline">
                        Retour à la connexion
                    </Link>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex grow min-h-screen items-center justify-center bg-gray-50 p-4 w-full">
            <Card className="w-full max-w-md border-gray-200 shadow-lg rounded-2xl overflow-hidden">
                <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-orange-500"></div>
                <CardContent className="p-8 sm:p-10">
                    <div className="flex flex-col items-center text-center mb-8">
                        <Link href="/">
                            <img
                                src={toAbsoluteUrl('/media/app/logo.png?v=2')}
                                className="h-16 w-auto mb-6 object-contain drop-shadow-sm"
                                alt="App Ambulance"
                            />
                        </Link>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Nouveau mot de passe</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Choisissez votre nouveau mot de passe sécurisé.
                        </p>
                    </div>

                    {status.error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                            {status.error}
                        </div>
                    )}

                    {status.success ? (
                        <div className="text-center">
                            <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-md text-center font-medium">
                                {status.success}
                            </div>
                            <Link href="/login">
                                <Button className="w-full bg-primary hover:bg-primary/90">
                                    Se connecter
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2 relative">
                                <Label htmlFor="password" className="font-semibold text-gray-700 text-sm">Nouveau mot de passe</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <div className="space-y-2 relative">
                                <Label htmlFor="confirmPassword" className="font-semibold text-gray-700 text-sm">Confirmer le mot de passe</Label>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    placeholder="••••••••"
                                    required
                                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 font-semibold bg-secondary hover:bg-secondary/90 text-white transition-colors shadow-sm"
                            >
                                {loading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
