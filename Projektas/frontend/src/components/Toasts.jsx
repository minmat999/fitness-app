import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

// Toast - mazas pranesimas kampe, kuris pats dingsta. Naudojamas vietoj narsykles alert().
// Context leidzia bet kuriam komponentui kviesti notify() be props perdavinejimo.
const ToastContext = createContext(() => {});

const ICONS = { success: CheckCircle2, error: AlertCircle, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    // Pirma pazymime "leaving", kad suveiktu isnykimo animacija, tada isimame is saraso.
    setToasts((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 250);
  }, []);

  const notify = useCallback((text, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((list) => [...list, { id, text, type, leaving: false }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          const Icon = ICONS[toast.type] || Info;
          return (
            <div key={toast.id} className={`toast toast-${toast.type} ${toast.leaving ? "leaving" : ""}`} role="status">
              <Icon size={20} />
              <span>{toast.text}</span>
              <button type="button" className="icon-button" onClick={() => remove(toast.id)} aria-label="Uždaryti pranešimą">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
