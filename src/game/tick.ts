export type TickController = { stop: () => void };

export function startTimestampLoop(onTick: (elapsedMilliseconds: number, now: number) => void): TickController {
  let stopped = false;
  let lastTimestamp = Date.now();
  let expected = lastTimestamp + 100;
  let timer: ReturnType<typeof setTimeout>;

  const loop = () => {
    if (stopped) return;
    const now = Date.now();
    const elapsed = Math.max(0, Math.min(now - lastTimestamp, 5_000));
    lastTimestamp = now;
    onTick(elapsed, now);
    const drift = now - expected;
    expected += 100;
    timer = setTimeout(loop, Math.max(10, 100 - drift));
  };

  timer = setTimeout(loop, 100);
  return {
    stop: () => {
      stopped = true;
      clearTimeout(timer);
    },
  };
}
