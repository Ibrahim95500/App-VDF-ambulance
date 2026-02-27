'use client';

import { ReactNode } from 'react';

// Simplified provider for App Ambulance (removed demo-specific store-client and calendar providers)
export function ModulesProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
