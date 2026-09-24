import { useEffect, useId, useRef, useState } from "react";
import type { ResumeCheckpoint } from "../../types/checkpoint";
import { formatLastUpdated } from "../../utils/time";
import { MoreIcon } from "./Icons";

interface CheckpointCardProps {
  checkpoint: ResumeCheckpoint;
  isCurrent: boolean;
  busy?: boolean;
  onResume: () => void;
  onUpdate: () => void;
  onRename: () => void;
  onDelete: () => void;
  onAutoUpdateChange: (enabled: boolean) => void;
}

export function CheckpointCard({
  checkpoint,
  isCurrent,
  busy = false,
  onResume,
  onUpdate,
  onRename,
  onDelete,
  onAutoUpdateChange,
}: CheckpointCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <article className={isCurrent ? "card is-current" : "card"}>
      <div className="card-top">
        <div>
          {isCurrent ? (
            <p className="current-label">
              <span className="dot" aria-hidden="true" />
              Current page
            </p>
          ) : null}
          <h2 className="card-title">{checkpoint.name}</h2>
          <p className="card-meta">Last updated: {formatLastUpdated(checkpoint.updatedAt)}</p>
          <label className="auto-update" title="When on, this save follows you as you scroll, leave, or close the browser.">
            <input
              type="checkbox"
              checked={Boolean(checkpoint.autoUpdate)}
              disabled={busy}
              onChange={(event) => onAutoUpdateChange(event.target.checked)}
            />
            Auto-update
          </label>
        </div>
        <div className="menu" ref={menuRef}>
          <button
            type="button"
            className="icon-button"
            aria-label={`More actions for ${checkpoint.name}`}
            title="More actions"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MoreIcon />
          </button>
          {menuOpen ? (
            <div className="menu-list" id={menuId} role="menu">
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
              >
                Rename
              </button>
              <button
                type="button"
                className="menu-item danger"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
      <div className="card-actions">
        <button type="button" className="button primary" onClick={onResume} disabled={busy}>
          Resume
        </button>
        <button type="button" className="button secondary" onClick={onUpdate} disabled={busy}>
          Update
        </button>
      </div>
    </article>
  );
}
