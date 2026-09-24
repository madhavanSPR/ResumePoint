import { useRef, useState } from "react";
import { exportStore, importStore } from "../../storage/checkpoint-store";

interface SettingsProps {
  onImported: () => Promise<void>;
}

export function Settings({ onImported }: SettingsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    const store = await exportStore();
    const blob = new Blob([JSON.stringify(store, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "resumepoint-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Exported your saved pages.");
  }

  async function handleImport(file: File) {
    setError(null);
    setStatus(null);
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      const count = await importStore(parsed);
      await onImported();
      setStatus(`Imported ${count} checkpoint${count === 1 ? "" : "s"}.`);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Could not import that file.",
      );
    }
  }

  return (
    <section className="settings">
      <h2>Settings</h2>
      <div className="settings-card">
        <h3>Backup</h3>
        <p>Export and import stay on this computer. Nothing is uploaded.</p>
        <div className="settings-actions">
          <button type="button" className="button secondary" onClick={() => void handleExport()}>
            Export data
          </button>
          <button type="button" className="button secondary" onClick={() => fileRef.current?.click()}>
            Import data
          </button>
        </div>
        <input
          ref={fileRef}
          className="visually-hidden"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleImport(file);
            }
            event.target.value = "";
          }}
        />
        {status ? <p>{status}</p> : null}
        {error ? <p className="banner error">{error}</p> : null}
      </div>
      <div className="settings-card">
        <h3>Keyboard shortcuts</h3>
        <ul>
          <li>Alt+Shift+R opens ResumePoint</li>
          <li>Alt+Shift+S saves or updates the current page</li>
        </ul>
        <p>
          Change them in chrome://extensions/shortcuts or
          brave://extensions/shortcuts.
        </p>
      </div>
      <div className="settings-card">
        <h3>Privacy</h3>
        <p>
          ResumePoint stores checkpoints only in this browser. It does not collect
          history, show ads, or send URLs to a server.
        </p>
      </div>
    </section>
  );
}
