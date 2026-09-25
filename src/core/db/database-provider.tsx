import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { type ReactNode, useEffect, useState } from 'react';

import { openDatabase } from './client';
import migrations from './migrations/migrations';

type State = { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error };

type DatabaseProviderProps = {
  children: ReactNode;
  fallback: ReactNode;
  renderError: (error: Error) => ReactNode;
};

/** Opens the encrypted database and runs pending migrations before rendering children. */
export function DatabaseProvider({ children, fallback, renderError }: DatabaseProviderProps) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    openDatabase()
      .then((db) => migrate(db, migrations))
      .then(() => !cancelled && setState({ status: 'ready' }))
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (state.status === 'loading') return fallback;
  if (state.status === 'error') return renderError(state.error);
  return children;
}
