import { QuackState } from '../../../../packages/game-core/src';

export interface QuackRenderState {
  score: number;
  playerBottom: number;
  volumeWidthPct: number;
  obstacles: Array<{
    id: number;
    xPct: number;
    lane: 'ground' | 'air';
    type: 'fire' | 'arrow';
  }>;
}

export function mapQuackRenderState(state: QuackState): QuackRenderState {
  return {
    score: state.score,
    playerBottom: 28 + (72 - state.playerY),
    volumeWidthPct: Math.min(100, state.volume * 2),
    obstacles: state.obstacles.map(obstacle => ({
      id: obstacle.id,
      xPct: obstacle.xPct,
      lane: obstacle.lane,
      type: obstacle.type,
    })),
  };
}
