import { useEffect, useState } from "react";
import { X, Trash2, TriangleAlert } from "lucide-react";

// Bendras modalinis langas. Uzsidaro paspaudus X, Escape arba paspaudus uz lango ribu.
export function Modal({ title, children, onClose }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Uždaryti">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Patvirtinimo modalas trynimui (vietoj narsykles window.confirm).
export function ConfirmModal({ title, text, confirmLabel = "Ištrinti", onConfirm, onClose }) {
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    onClose();
  }

  return (
    <Modal title={title} onClose={onClose}>
      <div className="confirm-body">
        <TriangleAlert size={36} className="confirm-icon" />
        <p>{text}</p>
      </div>
      <div className="modal-actions">
        <button type="button" className="secondary" onClick={onClose} disabled={busy}>Atšaukti</button>
        <button type="button" className="danger" onClick={handleConfirm} disabled={busy}>
          <Trash2 size={18} /> {busy ? "Trinama..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
