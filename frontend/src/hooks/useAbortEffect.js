import { useEffect, useRef } from 'react';

/**
 * useEffect with AbortController support
 * Automatically aborts previous request when dependencies change or component unmounts
 * @param {function} effect - Effect function that receives AbortSignal
 * @param {Array} deps - Dependencies array
 */
export function useAbortEffect(effect, deps) {
  const controllerRef = useRef(null);

  useEffect(() => {
    // Abort previous request
    if (controllerRef.current) {
      controllerRef.current.abort();
    }

    // Create new controller
    const controller = new AbortController();
    controllerRef.current = controller;

    // Run effect with signal
    const cleanup = effect(controller.signal);

    return () => {
      controller.abort();
      if (typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, deps);
}

/**
 * Create an AbortController that is cleaned up on unmount
 * @returns {{ controller: AbortController, signal: AbortSignal }}
 */
export function useAbortController() {
  const controllerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    };
  }, []);

  const getController = () => {
    if (!controllerRef.current || controllerRef.current.signal.aborted) {
      controllerRef.current = new AbortController();
    }
    return controllerRef.current;
  };

  return {
    getController,
    get signal() {
      return getController().signal;
    },
    abort() {
      if (controllerRef.current) {
        controllerRef.current.abort();
      }
    },
  };
}
