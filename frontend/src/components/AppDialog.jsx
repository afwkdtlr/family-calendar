const ICONS = {
  danger: "!",
  info: "i",
  success: "✓",
};

export function AppDialog({ dialog, onClose }) {
  const icon = ICONS[dialog.tone] || ICONS.info;

  return (
    <div className="dialog-overlay" onClick={() => onClose(false)} role="presentation">
      <section
        className={`dialog-card is-${dialog.tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`dialog-icon is-${dialog.tone}`} aria-hidden="true">
          {icon}
        </div>
        <h2 id="app-dialog-title">{dialog.title}</h2>
        {dialog.message && <p className="muted">{dialog.message}</p>}
        <div className="dialog-actions">
          {dialog.type === "confirm" && (
            <button className="ghost-btn" type="button" onClick={() => onClose(false)}>
              {dialog.cancelLabel}
            </button>
          )}
          <button
            className={`primary-btn${dialog.tone === "danger" ? " dialog-danger" : ""}`}
            type="button"
            onClick={() => onClose(true)}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
