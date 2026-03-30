import { GameEngine, SeededRandom } from '../../../runtime-contracts/src/game';
import { QUACK_RESCUE_QUESTIONS } from './questions';
import { QuackEvent, QuackInput, QuackObstacle, QuackQuestion, QuackState } from './types';

const BOOST_BASE = 36;
const BOOST_MIN = 12;
const MAX_PLAYER_Y = 72;
const MIN_PLAYER_Y = 0;
const MAX_VELOCITY = 3.2;
const GRAVITY = 0.38;
const PASS_THRESHOLD = 8;
const COLLISION_MIN_X = 20;
const COLLISION_MAX_X = 74;
const AIR_THRESHOLD = 28;
const SPAWN_CHANCE = 0.12;

function createBaseState(initial?: Partial<QuackState>): QuackState {
  return {
    mode: 'single',
    status: 'menu',
    score: 0,
    highScore: 0,
    opponentScore: 0,
    opponentAlive: true,
    livesUsed: 0,
    sensitivity: 20,
    volume: 0,
    playerY: 0,
    velocity: 0,
    obstacles: [],
    quizQuestion: null,
    quizTimeLeftSec: 0,
    quizTotalTimeSec: 0,
    matchResult: null,
    nextObstacleId: 1,
    ...initial,
  };
}

function shuffleOptions(question: QuackQuestion, rng: SeededRandom): QuackQuestion {
  const options = [...question.options];
  for (let index = options.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(rng.next() * (index + 1));
    [options[index], options[swapIndex]] = [options[swapIndex], options[index]];
  }
  return { ...question, options };
}

function pickQuestion(rng: SeededRandom) {
  const index = Math.floor(rng.next() * QUACK_RESCUE_QUESTIONS.length);
  return shuffleOptions(QUACK_RESCUE_QUESTIONS[index], rng);
}

function createObstacle(nextObstacleId: number, score: number, rng: SeededRandom): QuackObstacle {
  const lane = score >= 25 && rng.next() > 0.55 ? 'air' : 'ground';
  return {
    id: nextObstacleId,
    xPct: 104,
    lane,
    type: lane === 'air' ? 'arrow' : 'fire',
  };
}

export function createQuackEngine(rng: SeededRandom): GameEngine<QuackState, QuackInput, QuackEvent> {
  let pendingEvents: QuackEvent[] = [];

  function emit(event: QuackEvent) {
    pendingEvents.push(event);
  }

  function finishRun(state: QuackState, result: 'win' | 'loss'): QuackState {
    const highScore = Math.max(state.highScore, state.score);
    const nextState: QuackState = {
      ...state,
      highScore,
      matchResult: result,
      quizQuestion: null,
      quizTimeLeftSec: 0,
      quizTotalTimeSec: 0,
      status: state.mode === 'multi' ? 'match_result' : 'gameover',
    };

    if (state.mode === 'multi') {
      emit({
        type: 'match_result',
        result,
        score: nextState.score,
        opponentScore: nextState.opponentScore,
      });
    } else {
      emit({ type: 'game_over', score: nextState.score });
    }

    return nextState;
  }

  function startQuiz(state: QuackState): QuackState {
    const totalTimeSec = state.livesUsed === 0 ? 5 : 3;
    const question = pickQuestion(rng);
    emit({ type: 'quiz_started', question, totalTimeSec });
    return {
      ...state,
      status: 'quiz',
      quizQuestion: question,
      quizTimeLeftSec: totalTimeSec,
      quizTotalTimeSec: totalTimeSec,
    };
  }

  return {
    create(initial) {
      pendingEvents = [];
      return createBaseState(initial);
    },
    update(state, input, dtMs) {
      pendingEvents = [];

      switch (input.type) {
        case 'open_lobby':
          return createBaseState({ mode: 'multi', status: 'lobby', sensitivity: state.sensitivity, highScore: state.highScore });
        case 'return_menu':
          return createBaseState({ status: 'menu', sensitivity: state.sensitivity, highScore: state.highScore });
        case 'start_single':
          return createBaseState({ mode: 'single', status: 'playing', sensitivity: state.sensitivity, highScore: state.highScore });
        case 'start_multi':
          return createBaseState({ mode: 'multi', status: 'playing', sensitivity: state.sensitivity, highScore: state.highScore });
        case 'set_sensitivity':
          return { ...state, sensitivity: input.value };
        case 'boost': {
          if (state.status !== 'playing') {
            return state;
          }
          const boost = Math.max(BOOST_MIN, BOOST_BASE - state.sensitivity / 2);
          return {
            ...state,
            velocity: -boost / 6,
            volume: boost,
          };
        }
        case 'add_opponent_score':
          return { ...state, opponentScore: state.opponentScore + input.amount };
        case 'set_opponent_alive':
          return { ...state, opponentAlive: input.alive };
        case 'force_finish':
          return finishRun(state, input.result);
        case 'answer_quiz': {
          if (state.status !== 'quiz' || !state.quizQuestion) {
            return state;
          }
          if (input.answer === state.quizQuestion.answer) {
            return {
              ...state,
              status: 'playing',
              livesUsed: state.livesUsed + 1,
              velocity: -1.5,
              quizQuestion: null,
              quizTimeLeftSec: 0,
              quizTotalTimeSec: 0,
            };
          }
          return finishRun(state, 'loss');
        }
        case 'tick': {
          if (state.status === 'quiz' && state.quizQuestion) {
            const quizTimeLeftSec = Math.max(0, state.quizTimeLeftSec - dtMs / 1000);
            if (quizTimeLeftSec <= 0) {
              return finishRun({ ...state, quizTimeLeftSec }, 'loss');
            }
            return { ...state, quizTimeLeftSec };
          }

          if (state.status !== 'playing') {
            return state;
          }

          const volume = Math.max(0, state.volume - 4);
          const velocity = Math.min(MAX_VELOCITY, state.velocity + GRAVITY);
          const playerY = Math.max(MIN_PLAYER_Y, Math.min(MAX_PLAYER_Y, state.playerY + velocity));

          let collided = false;
          let passedCount = 0;

          let obstacles = state.obstacles
            .map(obstacle => ({ ...obstacle, xPct: obstacle.xPct - 7 }))
            .filter(obstacle => {
              if (obstacle.xPct < PASS_THRESHOLD) {
                passedCount += 1;
                return false;
              }

              const inPlayerZone = obstacle.xPct <= COLLISION_MAX_X && obstacle.xPct >= COLLISION_MIN_X;
              const playerFlying = playerY < AIR_THRESHOLD;
              const hitsGround = obstacle.lane === 'ground' && !playerFlying;
              const hitsAir = obstacle.lane === 'air' && playerFlying;

              if (inPlayerZone && (hitsGround || hitsAir)) {
                collided = true;
                return false;
              }

              return true;
            });

          let score = state.score;
          if (passedCount > 0) {
            score += passedCount * 5;
            emit({ type: 'score_changed', score });
          }

          let nextObstacleId = state.nextObstacleId;
          if (rng.next() < SPAWN_CHANCE) {
            obstacles = [...obstacles, createObstacle(nextObstacleId, score, rng)];
            nextObstacleId += 1;
          }

          const nextState: QuackState = {
            ...state,
            score,
            volume,
            velocity,
            playerY,
            obstacles,
            nextObstacleId,
          };

          if (collided) {
            if (state.livesUsed >= 2) {
              return finishRun(nextState, 'loss');
            }
            return startQuiz(nextState);
          }

          return nextState;
        }
        default:
          return state;
      }
    },
    collectEvents() {
      const events = pendingEvents;
      pendingEvents = [];
      return events;
    },
  };
}
