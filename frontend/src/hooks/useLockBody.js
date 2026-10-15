import { useEffect } from "react";

export function useLockBody(locked) {
  useEffect(() => {
    if (!locked) {
      return undefined;
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
