import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { openDatabase } from './client';
import migrations from './migrations/migrations';

type State = { status: 'loading' } | { status: 'ready' } | { status: 'error'; error: Error };

type DatabaseProviderProps = {
  children: ReactNode;
  fallback: ReactNode;
  renderError: (error: Error) => ReactNode;
};

/**
 * Unmounts everything that uses the database, runs `task` (e.g. erase all data) and opens a
 * fresh connection afterwards.
 */
type Restart = (task: () => Promise<void>) => Promise<void>;

const RestartContext = createContext<Restart | null>(null);

/** Opens the encrypted database and runs pending migrations before rendering children. */
export function DatabaseProvider({ children, fallback, renderError }: DatabaseProviderProps) {
  const [state, setState] = useState<State>({ status: 'loading' });
  const [generation, setGeneration] = useState(0);
  const [pendingTask, setPendingTask] = useState<{ run: () => Promise<void> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (pendingTask ? pendingTask.run() : Promise.resolve())
      .then(() => openDatabase())
      .then((db) => migrate(db, migrations))
      .then(() => !cancelled && setState({ status: 'ready' }))
      .catch((e: unknown) => {
        if (cancelled) return;
        setState({ status: 'error', error: e instanceof Error ? e : new Error(String(e)) });
      });
    return () => {
      cancelled = true;
    };
    // pendingTask changes together with generation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generation]);

  const restart = useCallback<Restart>(
    (task) =>
      new Promise((resolve, reject) => {
        setState({ status: 'loading' });
        setPendingTask({
          run: () => task().then(resolve, (e) => (reject(e), Promise.reject(e))),
        });
        setGeneration((g) => g + 1);
      }),
    [],
  );

  return (
    <RestartContext.Provider value={restart}>
      {state.status === 'loading'
        ? fallback
        : state.status === 'error'
          ? renderError(state.error)
          : children}
    </RestartContext.Provider>
  );
}

export function useDatabaseRestart(): Restart {
  const restart = useContext(RestartContext);
  if (!restart) throw new Error('useDatabaseRestart must be used inside <DatabaseProvider>');
  return restart;
}
