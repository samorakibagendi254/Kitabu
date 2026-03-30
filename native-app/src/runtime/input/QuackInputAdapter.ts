import { useMemo } from 'react';

export interface QuackInputState {
  source: 'button_fallback' | 'microphone_runtime';
  status: 'idle' | 'ready' | 'unavailable';
  inputLevel: number;
}

export interface QuackInputAdapter {
  state: QuackInputState;
  triggerBoost: () => void;
}

interface UseQuackInputAdapterOptions {
  onBoost: () => void;
  inputLevel: number;
}

export function useQuackInputAdapter({
  onBoost,
  inputLevel,
}: UseQuackInputAdapterOptions): QuackInputAdapter {
  return useMemo(
    () => ({
      state: {
        source: 'button_fallback',
        status: 'ready',
        inputLevel,
      },
      triggerBoost: onBoost,
    }),
    [inputLevel, onBoost],
  );
}
