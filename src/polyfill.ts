interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
}

interface IdleRequestOptions {
  timeout?: number;
}

export function simulateRequestIdleCallback(
  callback: (deadline: IdleDeadline) => void,
  options: IdleRequestOptions = {}
): void {
  const start: number = Date.now();
  const timeout: number = options.timeout ?? 50;

  const checkTimeRemaining = (): number => {
    return Math.max(0, 50 - (Date.now() - start));
  };

  const timeoutId: number = window.setTimeout(() => {
    callback({
      didTimeout: true,
      timeRemaining: () => 0
    });
  }, timeout);

  window.setTimeout(() => {
    window.clearTimeout(timeoutId);
    if (Date.now() - start < timeout) {
      callback({
        didTimeout: false,
        timeRemaining: checkTimeRemaining
      });
    }
  }, 0);
}