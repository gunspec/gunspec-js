/**
 * AbortSignal composition for the GunSpec HTTP client.
 *
 * Combines a per-request timeout signal with an optional caller-supplied
 * signal so that either can abort an in-flight request. Extracted from the
 * {@link HttpClient} so the transport class can focus on orchestration.
 *
 * @module
 */

import { TimeoutError } from './errors/index.js';

/**
 * Compose two optional `AbortSignal`s into a single signal that aborts when
 * **either** source fires.
 *
 * Uses `AbortSignal.any()` when available (Node 20+, modern browsers) and
 * falls back to a manual composition for older runtimes.
 */
export function composeSignals(
  timeoutMs: number,
  externalSignal?: AbortSignal,
): { signal: AbortSignal; cleanup: () => void } {
  const timeoutController = new AbortController();
  const timer = setTimeout(() => timeoutController.abort(new TimeoutError(timeoutMs)), timeoutMs);

  // If AbortSignal.any is available, use it for clean composition.
  if (typeof AbortSignal !== 'undefined' && 'any' in AbortSignal) {
    const signals: AbortSignal[] = [timeoutController.signal];
    if (externalSignal) signals.push(externalSignal);
    const composed = (AbortSignal as { any: (signals: AbortSignal[]) => AbortSignal }).any(signals);
    return {
      signal: composed,
      cleanup: () => clearTimeout(timer),
    };
  }

  // Fallback: manual composition via a new AbortController.
  const composed = new AbortController();

  const onTimeoutAbort = () => composed.abort(timeoutController.signal.reason);
  const onExternalAbort = () => {
    if (externalSignal) composed.abort(externalSignal.reason);
  };

  timeoutController.signal.addEventListener('abort', onTimeoutAbort, { once: true });
  externalSignal?.addEventListener('abort', onExternalAbort, { once: true });

  return {
    signal: composed.signal,
    cleanup: () => {
      clearTimeout(timer);
      timeoutController.signal.removeEventListener('abort', onTimeoutAbort);
      externalSignal?.removeEventListener('abort', onExternalAbort);
    },
  };
}
