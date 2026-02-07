import { useEffect, useRef, useState, useCallback } from 'react';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export function useAutosave(
  value: string,
  onSave: (value: string) => Promise<void>,
  delay = 2000,
  enabled = true
) {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const lastSavedRef = useRef(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback(async (val: string) => {
    if (val === lastSavedRef.current) return;

    setStatus('saving');
    try {
      await onSave(val);
      lastSavedRef.current = val;
      setStatus('saved');
      savedTimerRef.current = setTimeout(() => setStatus('idle'), 3000);
    } catch {
      setStatus('error');
    }
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;
    if (value === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);

    timerRef.current = setTimeout(() => save(value), delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay, enabled, save]);

  useEffect(() => {
    lastSavedRef.current = value;
  }, []);

  return status;
}
