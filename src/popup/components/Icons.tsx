export function BookmarkIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3.75A1.75 1.75 0 0 0 5.25 5.5v15.1c0 .5.54.82.97.57L12 17.7l5.78 3.47c.43.25.97-.07.97-.57V5.5A1.75 1.75 0 0 0 17 3.75H7Z"
      />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Zm8.1 2.6-.9-.16a6.9 6.9 0 0 0-.7-1.7l.55-.73a.75.75 0 0 0-.08-.98l-1.9-1.9a.75.75 0 0 0-.98-.08l-.73.55c-.54-.3-1.11-.53-1.7-.7L13.9 4a.75.75 0 0 0-.74-.6h-2.32a.75.75 0 0 0-.74.6l-.16.9c-.59.17-1.16.4-1.7.7l-.73-.55a.75.75 0 0 0-.98.08L4.43 7.03a.75.75 0 0 0-.08.98l.55.73c-.3.54-.53 1.11-.7 1.7l-.9.16a.75.75 0 0 0-.6.74v2.32c0 .36.26.67.6.74l.9.16c.17.59.4 1.16.7 1.7l-.55.73a.75.75 0 0 0 .08.98l1.9 1.9c.27.27.7.3.98.08l.73-.55c.54.3 1.11.53 1.7.7l.16.9c.07.34.38.6.74.6h2.32c.36 0 .67-.26.74-.6l.16-.9c.59-.17 1.16-.4 1.7-.7l.73.55c.28.22.71.19.98-.08l1.9-1.9a.75.75 0 0 0 .08-.98l-.55-.73c.3-.54.53-1.11.7-1.7l.9-.16c.34-.07.6-.38.6-.74v-2.32a.75.75 0 0 0-.6-.74Z"
      />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M15.5 5.5 8 12l7.5 6.5-1.4 1.4L5.2 12l8.9-7.9 1.4 1.4Z"
      />
    </svg>
  );
}

export function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="6" r="1.7" fill="currentColor" />
      <circle cx="12" cy="12" r="1.7" fill="currentColor" />
      <circle cx="12" cy="18" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z" />
    </svg>
  );
}
