import { GameMode } from '../../../runtime-contracts/src/game';

export interface QuackQuestion {
  prompt: string;
  options: string[];
  answer: string;
}

export interface QuackObstacle {
  id: number;
  xPct: number;
  lane: 'ground' | 'air';
  type: 'fire' | 'arrow';
}

export interface QuackState {
  mode: GameMode;
  status: 'menu' | 'lobby' | 'playing' | 'quiz' | 'gameover' | 'match_result';
  score: number;
  highScore: number;
  opponentScore: number;
  opponentAlive: boolean;
  livesUsed: number;
  sensitivity: number;
  volume: number;
  playerY: number;
  velocity: number;
  obstacles: QuackObstacle[];
  quizQuestion: QuackQuestion | null;
  quizTimeLeftSec: number;
  quizTotalTimeSec: number;
  matchResult: 'win' | 'loss' | null;
  nextObstacleId: number;
}

export type QuackInput =
  | { type: 'tick' }
  | { type: 'open_lobby' }
  | { type: 'return_menu' }
  | { type: 'start_single' }
  | { type: 'start_multi' }
  | { type: 'boost' }
  | { type: 'set_sensitivity'; value: number }
  | { type: 'answer_quiz'; answer: string }
  | { type: 'add_opponent_score'; amount: number }
  | { type: 'set_opponent_alive'; alive: boolean }
  | { type: 'force_finish'; result: 'win' | 'loss' };

export type QuackEvent =
  | { type: 'score_changed'; score: number }
  | { type: 'quiz_started'; question: QuackQuestion; totalTimeSec: number }
  | { type: 'game_over'; score: number }
  | { type: 'match_result'; result: 'win' | 'loss'; score: number; opponentScore: number };
