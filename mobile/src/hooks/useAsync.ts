import { useCallback, useEffect, useState } from 'react';

// Runs an async loader when deps change and tracks its data, error and loading state.
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fn, deps);

  const load = useCallback(() => {
    let live = true;
    setLoading(true);
    setError(null);
    run()
      .then(d => live && setData(d))
      .catch(e => live && setError(e instanceof Error ? e.message : String(e)))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, [run]);

  useEffect(load, [load]);
  const reload = useCallback(() => {
    load();
  }, [load]);
  return { data, error, loading, reload, setData };
}
