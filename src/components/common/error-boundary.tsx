'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error (ErrorBoundary):', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-8 m-4 border-2 border-dashed border-red-200 rounded-xl bg-red-50/50">
          <AlertCircle className="size-12 text-red-500 mb-4" />
          <h2 className="text-lg font-bold text-red-900 mb-2">Oups ! Un petit problème technique...</h2>
          <p className="text-sm text-red-700 text-center mb-6 max-w-md">
            Cette section de l'application a rencontré une erreur d'affichage. 
            Pas d'inquiétude, le reste de l'application fonctionne toujours.
          </p>
          <Button 
            variant="outline" 
            className="border-red-200 text-red-700 hover:bg-red-100"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCw className="mr-2 size-4" /> Réessayer l'affichage
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Version simplifiée (pas besoin de hooks car c'est un class component)
export default ErrorBoundary;
