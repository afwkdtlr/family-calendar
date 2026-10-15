import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AppDialog } from "../components/AppDialog.jsx";
import { useLockBody } from "../hooks/useLockBody.js";

const AlertContext = createContext(null);

export function AlertProvider({ children }) {
  const [dialog, setDialog] = useState(null);
  const [toasts, setToasts] = useState([]);
  const resolverRef = useRef(null);

  useLockBody(Boolean(dialog));

  const closeDialog = useCallback((result) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setDialog(null);
  }, []);

  const confirm = useCallback((options) => {
    return new Promise((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setDialog({
        type: "confirm",
        title: options.title || "확인",
        message: options.message || "",
        confirmLabel: options.confirmLabel || "확인",
        cancelLabel: options.cancelLabel || "취소",
        tone: options.tone || "danger",
      });
    });
  }, []);

  const alert = useCallback((options) => {
    const payload = typeof options === "string" ? { message: options } : options;
    return new Promise((resolve) => {
      resolverRef.current?.(false);
      resolverRef.current = resolve;
      setDialog({
        type: "alert",
        title: payload.title || "알림",
        message: payload.message || "",
        confirmLabel: payload.confirmLabel || "확인",
        tone: payload.tone || "info",
      });
    });
  }, []);

  const toast = useCallback((message, tone = "info") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((list) => list.filter((item) => item.id !== id));
    }, 2800);
  }, []);

  const value = useMemo(() => ({ confirm, alert, toast }), [confirm, alert, toast]);

  return (
    <AlertContext.Provider value={value}>
      {children}
      {dialog && <AppDialog dialog={dialog} onClose={closeDialog} />}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((item) => (
          <div key={item.id} className={`app-toast is-${item.tone}`}>
            <span>{item.tone === "success" ? "✓" : item.tone === "error" ? "!" : "•"}</span>
            <p>{item.message}</p>
          </div>
        ))}
      </div>
    </AlertContext.Provider>
  );
}

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert는 AlertProvider 안에서만 사용할 수 있습니다.");
  }
  return context;
}
