'use client'; // Les error boundaries doivent toujours être des Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionnel: Envoyer l'erreur à un service de tracking (Sentry, etc.)
    console.error('Erreur interceptée par le Boundary du Dashboard :', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Alert variant="destructive" className="mb-6 bg-red-50 dark:bg-red-950/20 text-left border-red-200 dark:border-red-900 shadow-sm rounded-xl">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle className="text-lg font-bold mb-2">Erreur Inattendue</AlertTitle>
          <AlertDescription className="text-sm opacity-90 overflow-hidden text-ellipsis">
            Un problème technique est survenu lors du chargement de cette section. L'interface principale reste sécurisée.
            <br />
            <br />
            <code className="text-xs font-mono bg-red-100 dark:bg-red-900/40 p-1.5 rounded-md block break-all text-red-800 dark:text-red-200">
              {error.message || "Client-Side Exception"}
            </code>
          </AlertDescription>
        </Alert>

        <Button 
          onClick={() => reset()} 
          size="lg"
          className="w-full sm:w-auto shadow-md gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Réessayer le chargement
        </Button>
      </div>
    </div>
  );
}
