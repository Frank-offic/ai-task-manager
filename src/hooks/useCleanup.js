import { useEffect, useRef } from 'react';

/**
 * Hook for cleanup operations to prevent memory leaks
 * @param {Function} cleanup - Function to call on component unmount
 */
export const useCleanup = (cleanup) => {
  useEffect(() => cleanup, [cleanup]);
};

/**
 * Hook for managing timers and intervals
 * @param {Function} callback - Function to call
 * @param {number} delay - Delay in milliseconds
 * @param {boolean} immediate - Whether to call immediately
 */
export const useInterval = (callback, delay, immediate = false) => {
  const savedCallback = useRef();
  const intervalRef = useRef();

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (immediate) {
      savedCallback.current();
    }

    if (delay !== null) {
      intervalRef.current = setInterval(() => savedCallback.current(), delay);
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [delay, immediate]);

  return () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };
};

/**
 * Hook for managing timeouts
 * @param {Function} callback - Function to call
 * @param {number} delay - Delay in milliseconds
 */
export const useTimeout = (callback, delay) => {
  const timeoutRef = useRef();
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay !== null) {
      timeoutRef.current = setTimeout(() => savedCallback.current(), delay);
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }
  }, [delay]);

  return () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };
};

export default useCleanup;
