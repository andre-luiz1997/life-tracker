import { getTableName, type Table } from 'drizzle-orm';
import { addDatabaseChangeListener } from 'expo-sqlite';
import { type DependencyList, useEffect, useEffectEvent, useState } from 'react';

type QueryState<T> =
  | { status: 'loading'; data: undefined; error: undefined }
  | { status: 'success'; data: T; error: undefined }
  | { status: 'error'; data: undefined; error: Error };

/**
 * Runs `query` and re-runs it whenever any of `tables` changes. Unlike drizzle's useLiveQuery
 * (which only watches the root table), this also refreshes on changes to joined tables.
 */
export function useDbQuery<T>(
  query: () => Promise<T> | T,
  tables: Table[],
  deps: DependencyList = [],
): QueryState<T> {
  const [state, setState] = useState<QueryState<T>>({
    status: 'loading',
    data: undefined,
    error: undefined,
  });
  const runQuery = useEffectEvent(() => query());

  const tableNames = tables.map(getTableName).join(',');

  useEffect(() => {
    let active = true;
    const run = () => {
      Promise.resolve()
        .then(() => runQuery())
        .then((data) => active && setState({ status: 'success', data, error: undefined }))
        .catch((e: unknown) => {
          if (!active) return;
          const error = e instanceof Error ? e : new Error(String(e));
          setState({ status: 'error', data: undefined, error });
        });
    };
    run();

    const watched = new Set(tableNames.split(','));
    const subscription = addDatabaseChangeListener(({ tableName }) => {
      if (watched.has(tableName)) run();
    });
    return () => {
      active = false;
      subscription.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNames, ...deps]);

  return state;
}
