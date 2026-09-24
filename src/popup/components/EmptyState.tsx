import { BookmarkIcon, PlusIcon } from "./Icons";

interface EmptyStateProps {
  onSave: () => void;
  disabled?: boolean;
}

export function EmptyState({ onSave, disabled }: EmptyStateProps) {
  return (
    <div className="empty">
      <BookmarkIcon className="empty-mark" />
      <h2>No saved pages yet</h2>
      <p>Save a page to quickly return to where you stopped.</p>
      <button type="button" className="button primary" onClick={onSave} disabled={disabled}>
        <PlusIcon />
        Save current page
      </button>
    </div>
  );
}
