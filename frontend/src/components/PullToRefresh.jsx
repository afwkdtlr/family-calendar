import { useEffect, useRef, useState } from "react";

const THRESHOLD = 64;
const MAX_PULL = 88;

function isFormField(node) {
  return Boolean(node?.closest?.("input, textarea, select, [contenteditable='true']"));
}

function isAtTop(startNode, root) {
  let node = startNode;
  if (node && node.nodeType !== 1) {
    node = node.parentElement;
  }
  while (node && node !== root) {
    const style = window.getComputedStyle(node);
    const canScroll =
      node.scrollHeight > node.clientHeight + 1 &&
      /(auto|scroll|overlay)/.test(`${style.overflowY}${style.overflow}`);
    if (canScroll && node.scrollTop > 1) {
      return false;
    }
    node = node.parentElement;
  }
  return window.scrollY <= 1;
}

export function PullToRefresh({
  children,
  className = "",
  onRefresh,
  ignoreSelector = "",
  disabled = false,
}) {
  const rootRef = useRef(null);
  const indicatorRef = useRef(null);
  const onRefreshRef = useRef(onRefresh);
  const ignoreRef = useRef(ignoreSelector);
  const disabledRef = useRef(disabled);
  const refreshingRef = useRef(false);
  const [refreshing, setRefreshing] = useState(false);

  onRefreshRef.current = onRefresh;
  ignoreRef.current = ignoreSelector;
  disabledRef.current = disabled;

  useEffect(() => {
    const root = rootRef.current;
    const indicator = indicatorRef.current;
    if (!root || !indicator) {
      return undefined;
    }

    const session = {
      tracking: false,
      pulling: false,
      axis: "",
      x: 0,
      y: 0,
      dy: 0,
    };

    function showPull(dy) {
      const pulled = Math.max(0, Math.min(dy, MAX_PULL));
      indicator.style.opacity = pulled > 6 || refreshingRef.current ? "1" : "0";
      indicator.style.transform = `translate(-50%, ${pulled * 0.7}px)`;
    }

    function resetPull() {
      if (!refreshingRef.current) {
        indicator.style.opacity = "0";
        indicator.style.transform = "translate(-50%, 0)";
      }
    }

    function onStart(event) {
      if (disabledRef.current || refreshingRef.current || !onRefreshRef.current) {
        session.tracking = false;
        return;
      }
      const touch = event.touches[0];
      const target = event.target;
      if (
        !touch ||
        isFormField(target) ||
        (ignoreRef.current && target.closest?.(ignoreRef.current)) ||
        !isAtTop(target, root)
      ) {
        session.tracking = false;
        return;
      }
      session.tracking = true;
      session.pulling = false;
      session.axis = "";
      session.x = touch.clientX;
      session.y = touch.clientY;
      session.dy = 0;
    }

    function onMove(event) {
      if (!session.tracking || disabledRef.current) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) {
        return;
      }
      const dx = touch.clientX - session.x;
      const dy = touch.clientY - session.y;
      if (!session.axis && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        session.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      }
      if (session.axis !== "y" || dy <= 0) {
        session.pulling = false;
        resetPull();
        return;
      }
      session.pulling = true;
      session.dy = dy;
      event.preventDefault();
      showPull(dy);
    }

    function onEnd() {
      if (!session.tracking) {
        return;
      }
      const shouldRefresh = session.pulling && session.dy >= THRESHOLD && !disabledRef.current;
      session.tracking = false;
      session.pulling = false;
      session.axis = "";
      if (!shouldRefresh) {
        resetPull();
        return;
      }
      refreshingRef.current = true;
      setRefreshing(true);
      indicator.style.opacity = "1";
      indicator.style.transform = `translate(-50%, ${THRESHOLD * 0.7}px)`;
      Promise.all([
        Promise.resolve().then(() => onRefreshRef.current?.()),
        new Promise((resolve) => window.setTimeout(resolve, 350)),
      ])
        .catch(() => {})
        .finally(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          indicator.style.opacity = "0";
          indicator.style.transform = "translate(-50%, 0)";
        });
    }

    root.addEventListener("touchstart", onStart, { passive: true });
    root.addEventListener("touchmove", onMove, { passive: false });
    root.addEventListener("touchend", onEnd, { passive: true });
    root.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      root.removeEventListener("touchstart", onStart);
      root.removeEventListener("touchmove", onMove);
      root.removeEventListener("touchend", onEnd);
      root.removeEventListener("touchcancel", onEnd);
    };
  }, []);

  return (
    <div ref={rootRef} className={`ptr-host${className ? ` ${className}` : ""}`}>
      <div
        ref={indicatorRef}
        className={`ptr-indicator${refreshing ? " is-busy" : ""}`}
        aria-hidden="true"
      >
        <span />
      </div>
      {children}
    </div>
  );
}
