'use client';

import { useState } from 'react';
import { requestPasswordReset } from '@/actions/users';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toAbsoluteUrl } from '@/lib/helpers';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [status, setStatus] = useState<{ error?: string; success?: string }>({});
    const [loading, setLoading] = useState(false);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setStatus({});

        const formData = new FormData(event.currentTarget);
        const result = await requestPasswordReset(formData);

        setLoading(false);
        setStatus(result);
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
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Mot de passe oublié</h1>
                        <p className="text-sm text-gray-500 mt-2">
                            Saisissez votre email pour recevoir un lien de réinitialisation.
                        </p>
                    </div>

                    {status.error && (
                        <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md text-center font-medium">
                            {status.error}
                        </div>
                    )}

                    {status.success && (
                        <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-md text-center font-medium">
                            {status.success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
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

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 font-semibold bg-secondary hover:bg-secondary/90 text-white transition-colors shadow-sm"
                        >
                            {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4 mr-1" />
                                Retour à la connexion
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
