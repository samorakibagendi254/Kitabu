import { useEffect, useState } from 'react';

import { QuackEvent } from '../../../../packages/game-core/src';

export type QuackVisualEffect =
  | 'score_pulse'
  | 'quiz_flash'
  | 'victory_flash'
  | 'defeat_flash'
  | null;

export function useQuackEffects(events: QuackEvent[]) {
  const [effect, setEffect] = useState<QuackVisualEffect>(null);

  useEffect(() => {
    if (events.length === 0) {
      return undefined;
    }

    const latest = events[events.length - 1];

    switch (latest.type) {
      case 'score_changed':
        setEffect('score_pulse');
        break;
      case 'quiz_started':
        setEffect('quiz_flash');
        break;
      case 'match_result':
        setEffect(latest.result === 'win' ? 'victory_flash' : 'defeat_flash');
        break;
      case 'game_over':
        setEffect('defeat_flash');
        break;
      default:
        setEffect(null);
        break;
    }

    const timer = setTimeout(() => setEffect(null), 420);
    return () => clearTimeout(timer);
  }, [events]);

  return effect;
}
