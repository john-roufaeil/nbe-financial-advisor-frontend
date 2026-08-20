/**
 * Pads a promise's settlement time to at least `ms`, on both success and
 * failure. Used to keep sign-in response timing from leaking whether an
 * email exists (e.g. an "email not found" rejection is normally much
 * faster than a "wrong password" one, since the latter involves a hash
 * comparison on the backend).
 */
export function withMinDelay<T>(promise: Promise<T>, ms: number): Promise<T> {
  const start = Date.now();
  const waitRemaining = () =>
    new Promise<void>((resolve) =>
      setTimeout(resolve, Math.max(0, ms - (Date.now() - start))),
    );

  return promise.then(
    async (value) => {
      await waitRemaining();
      return value;
    },
    async (error: unknown) => {
      await waitRemaining();
      throw error;
    },
  );
}
