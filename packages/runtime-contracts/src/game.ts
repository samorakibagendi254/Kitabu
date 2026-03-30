export type GameMode = 'single' | 'multi';

export interface SeededRandom {
  next(): number;
}

export interface GameEngine<State, Input, Event> {
  create(initial?: Partial<State>): State;
  update(state: State, input: Input, dtMs: number): State;
  collectEvents(state?: State): Event[];
}
