'use client'; // Exigence technique stricte Next.js

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr" data-theme="light">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground text-center p-6 bg-red-50 dark:bg-zinc-950">
          <div className="max-w-md w-full p-8 rounded-2xl shadow-xl bg-white border border-red-100 dark:bg-zinc-900 border-zinc-800">
            <h1 className="text-3xl font-black text-red-600 mb-4 tracking-tight">Erreur Critique</h1>
            <p className="text-zinc-600 dark:text-zinc-400 font-medium mb-6">
              L'application a soudainement perdu sa connexion au moteur de rendu. Ce problème peut arriver lors d'un basculement de compte rapide sur téléphone mobile.
            </p>
            
            <pre className="text-xs bg-red-50 dark:bg-zinc-950 text-red-800 p-3 rounded text-left overflow-auto break-all font-mono border border-red-200">
                 {error.message || "Erreur de Type (Hydration/Client-Side)"}
            </pre>

            <div className="mt-8">
              <Button 
                onClick={() => reset()}
                size="lg"
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold tracking-wide"
              >
                Tenter une reconnexion système
              </Button>
              <br/>
              <a href="/dashboard/salarie" className="text-xs text-blue-500 hover:underline mt-4 inline-block font-semibold">
                  Forcer le rafraîchissement au menu Salarié
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
