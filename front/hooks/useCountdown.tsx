// hooks/useCountdown.ts
import { useState, useRef, useCallback, useEffect } from "react";

interface UseCountdownReturn {
  countdown: number;
  isRunning: boolean;
  start: (seconds: number) => void;
  stop: () => void;
  reset: () => void;
}

export function useCountdown(initialSeconds: number = 0): UseCountdownReturn {
  const [countdown, setCountdown] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 停止倒计时
  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRunning(false);
  }, []);

  // 开始倒计时
  const start = useCallback(
    (seconds: number) => {
      // 先停止之前的倒计时
      stop();

      setCountdown(seconds);
      setIsRunning(true);

      intervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            stop();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [stop]
  );

  // 重置倒计时
  const reset = useCallback(() => {
    stop();
    setCountdown(initialSeconds);
  }, [initialSeconds, stop]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    countdown,
    isRunning,
    start,
    stop,
    reset
  };
}
