export class IntervalGameLoop {
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly intervalMs: number) {}

  start(onFrame: (dtMs: number) => void) {
    this.stop();
    this.timer = setInterval(() => onFrame(this.intervalMs), this.intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
