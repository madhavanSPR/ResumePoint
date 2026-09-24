import { useEffect, useMemo, useState } from "react";
import type { CapturedPosition, ResumeCheckpoint } from "../types/checkpoint";
import type { ExtensionResponse } from "../types/messages";
import {
  deleteCheckpoint,
  findByNormalizedUrl,
  saveCheckpoint,
} from "../storage/checkpoint-store";
import { captureTab, checkpointFromCapture } from "../extension/save-current";
import { consumeLastNotice } from "../extension/notices";
import { findMatchingCheckpoint, findMatchingTab } from "../utils/matching";
import { orderCheckpoints } from "../utils/ordering";
import { RESTRICTED_PAGE_MESSAGE, isRestrictedUrl } from "../utils/restricted";
import { filterCheckpoints } from "../utils/search";
import { displayUrl, normalizeUrl, urlsMatch } from "../utils/url";
import { CheckpointCard } from "./components/CheckpointCard";
import { Dialog } from "./components/Dialog";
import { EmptyState } from "./components/EmptyState";
import { BackIcon, BookmarkIcon, PlusIcon, SettingsIcon } from "./components/Icons";
import { Settings } from "./components/Settings";
import { useActiveTab } from "./hooks/useActiveTab";
import { useCheckpoints } from "./hooks/useCheckpoints";

type View = "list" | "settings";

type DialogState =
  | { type: "save"; position: CapturedPosition }
  | { type: "already-saved"; position: CapturedPosition; existing: ResumeCheckpoint }
  | { type: "rename"; checkpoint: ResumeCheckpoint }
  | { type: "delete"; checkpoint: ResumeCheckpoint }
  | {
      type: "retarget";
      checkpoint: ResumeCheckpoint;
      position: CapturedPosition;
      collision?: ResumeCheckpoint;
    }
  | { type: "message"; title: string; body: string }
  | null;

export function App() {
  const { checkpoints, refresh } = useCheckpoints();
  const activeTab = useActiveTab();
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [draftName, setDraftName] = useState("");
  const [draftAutoUpdate, setDraftAutoUpdate] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const currentNormalizedUrl = useMemo(() => {
    if (!activeTab.url || isRestrictedUrl(activeTab.url)) {
      return undefined;
    }
    try {
      return normalizeUrl(activeTab.url);
    } catch {
      return undefined;
    }
  }, [activeTab.url]);

  const currentCheckpoint = useMemo(
    () => findMatchingCheckpoint(checkpoints, activeTab.url),
    [checkpoints, activeTab.url],
  );

  const visible = useMemo(() => {
    return orderCheckpoints(filterCheckpoints(checkpoints, query), currentNormalizedUrl);
  }, [checkpoints, query, currentNormalizedUrl]);

  useEffect(() => {
    void consumeLastNotice().then((message) => {
      if (message) {
        setBanner(message);
      }
    });
  }, []);

  async function beginSave() {
    setBanner(null);
    if (!activeTab.id || isRestrictedUrl(activeTab.url)) {
      setDialog({
        type: "message",
        title: "This page can't be saved",
        body: RESTRICTED_PAGE_MESSAGE,
      });
      return;
    }

    try {
      setBusy(true);
      const position = await captureTab(activeTab.id);
      const existing = await findByNormalizedUrl(normalizeUrl(position.url));
      if (existing) {
        setDialog({ type: "already-saved", position, existing });
        return;
      }
      setDraftName(position.title || position.url);
      setDraftAutoUpdate(false);
      setDialog({ type: "save", position });
    } catch (error) {
      setDialog({
        type: "message",
        title: "This page can't be saved",
        body: error instanceof Error ? error.message : RESTRICTED_PAGE_MESSAGE,
      });
    } finally {
      setBusy(false);
    }
  }

  async function persistCapture(
    position: CapturedPosition,
    name?: string,
    existing?: ResumeCheckpoint,
    autoUpdate?: boolean,
  ) {
    const checkpoint = checkpointFromCapture(position, { name, existing, autoUpdate });
    await saveCheckpoint(checkpoint);
    await refresh();
    setDialog(null);
  }

  async function handleAutoUpdateChange(checkpoint: ResumeCheckpoint, enabled: boolean) {
    await saveCheckpoint({
      ...checkpoint,
      autoUpdate: enabled,
    });
    await refresh();
  }

  async function handleUpdate(checkpoint: ResumeCheckpoint) {
    setBanner(null);
    try {
      setBusy(true);
      const tabs = await chrome.tabs.query({});
      const activeUsable =
        activeTab.id && activeTab.url && !isRestrictedUrl(activeTab.url)
          ? { id: activeTab.id, url: activeTab.url }
          : undefined;
      const matching = findMatchingTab(tabs, checkpoint.url);
      const preferred = activeUsable ?? matching;

      if (!preferred?.id) {
        setDialog({
          type: "message",
          title: "Open this page first",
          body: "Open this page before updating. Update saves the position you are at now.",
        });
        return;
      }

      if (isRestrictedUrl(preferred.url)) {
        setDialog({
          type: "message",
          title: "This page can't be updated",
          body: RESTRICTED_PAGE_MESSAGE,
        });
        return;
      }

      const position = await captureTab(preferred.id);
      if (urlsMatch(position.url, checkpoint.url)) {
        await persistCapture(position, checkpoint.name, checkpoint);
        return;
      }

      const collision = checkpoints.find(
        (item) =>
          item.id !== checkpoint.id && urlsMatch(item.url, position.url),
      );
      setDialog({
        type: "retarget",
        checkpoint,
        position,
        collision,
      });
    } catch (error) {
      setDialog({
        type: "message",
        title: "Update failed",
        body: error instanceof Error ? error.message : "Could not update this checkpoint.",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleResume(checkpoint: ResumeCheckpoint) {
    setBanner(null);
    setBusy(true);
    try {
      const response = (await chrome.runtime.sendMessage({
        type: "RESUME_CHECKPOINT",
        checkpointId: checkpoint.id,
      })) as ExtensionResponse | undefined;
      if (response?.type === "ERROR") {
        setBanner(response.message);
      }
    } catch {
      setBanner("Unable to open this page. The URL may no longer be available.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRename() {
    if (dialog?.type !== "rename") {
      return;
    }
    const name = draftName.trim();
    if (!name) {
      return;
    }
    await saveCheckpoint({ ...dialog.checkpoint, name, updatedAt: Date.now() });
    await refresh();
    setDialog(null);
  }

  async function handleDelete() {
    if (dialog?.type !== "delete") {
      return;
    }
    await deleteCheckpoint(dialog.checkpoint.id);
    await refresh();
    setDialog(null);
  }

  const empty = checkpoints.length === 0 && view === "list";

  return (
    <div className={empty ? "app is-empty" : "app"}>
      <header className="header">
        <div className="brand">
          <BookmarkIcon className="brand-mark" />
          <h1 className="brand-title">ResumePoint</h1>
        </div>
        {view === "settings" ? (
          <button
            type="button"
            className="icon-button"
            aria-label="Back to saved pages"
            title="Back"
            onClick={() => setView("list")}
          >
            <BackIcon />
          </button>
        ) : (
          <button
            type="button"
            className="icon-button"
            aria-label="Open settings"
            title="Settings"
            onClick={() => setView("settings")}
          >
            <SettingsIcon />
          </button>
        )}
      </header>

      {banner ? (
        <div className="banner error" role="status">
          {banner}
        </div>
      ) : null}

      {view === "settings" ? (
        <Settings onImported={refresh} />
      ) : empty ? (
        <EmptyState onSave={() => void beginSave()} disabled={busy} />
      ) : (
        <>
          <div className="search">
            <label className="visually-hidden" htmlFor="checkpoint-search">
              Search saved pages
            </label>
            <input
              id="checkpoint-search"
              className="search-input"
              type="search"
              placeholder="Search saved pages..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="list">
            {visible.length === 0 ? (
              <p className="banner">No saved pages match that search.</p>
            ) : (
              visible.map((checkpoint) => (
                <CheckpointCard
                  key={checkpoint.id}
                  checkpoint={checkpoint}
                  isCurrent={checkpoint.id === currentCheckpoint?.id}
                  busy={busy}
                  onResume={() => void handleResume(checkpoint)}
                  onUpdate={() => void handleUpdate(checkpoint)}
                  onRename={() => {
                    setDraftName(checkpoint.name);
                    setDialog({ type: "rename", checkpoint });
                  }}
                  onDelete={() => setDialog({ type: "delete", checkpoint })}
                  onAutoUpdateChange={(enabled) => void handleAutoUpdateChange(checkpoint, enabled)}
                />
              ))
            )}
          </div>
          <div className="footer">
            <button
              type="button"
              className="button secondary block"
              onClick={() => void beginSave()}
              disabled={busy}
            >
              <PlusIcon />
              Save current page
            </button>
          </div>
        </>
      )}

      {dialog?.type === "save" ? (
        <Dialog title="Save current page" onClose={() => setDialog(null)}>
          <p>Give this checkpoint a name you will recognize later.</p>
          <label className="visually-hidden" htmlFor="save-name">
            Checkpoint name
          </label>
          <input
            id="save-name"
            className="text-input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void persistCapture(dialog.position, draftName, undefined, draftAutoUpdate);
              }
            }}
          />
          <label className="auto-update dialog-auto-update">
            <input
              type="checkbox"
              checked={draftAutoUpdate}
              onChange={(event) => setDraftAutoUpdate(event.target.checked)}
            />
            Auto-update this page as I keep reading
          </label>
          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => void persistCapture(dialog.position, draftName, undefined, draftAutoUpdate)}
            >
              Save
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.type === "already-saved" ? (
        <Dialog title="This page is already saved" onClose={() => setDialog(null)}>
          <p className="dialog-name">{dialog.existing.name}</p>
          <p>Update the saved position to where you are now, or cancel to leave it unchanged.</p>
          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() => void persistCapture(dialog.position, dialog.existing.name, dialog.existing)}
            >
              Update position
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.type === "rename" ? (
        <Dialog title="Rename checkpoint" onClose={() => setDialog(null)}>
          <label className="visually-hidden" htmlFor="rename-name">
            Checkpoint name
          </label>
          <input
            id="rename-name"
            className="text-input"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleRename();
              }
            }}
          />
          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button type="button" className="button primary" onClick={() => void handleRename()}>
              Save
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.type === "retarget" ? (
        <Dialog title="This page is different" onClose={() => setDialog(null)}>
          <p>
            The saved checkpoint still points to a different link. Update can
            move it to the page you are on now.
          </p>
          <dl className="url-compare">
            <div className="url-row">
              <dt>Saved page</dt>
              <dd title={dialog.checkpoint.url}>{displayUrl(dialog.checkpoint.url)}</dd>
            </div>
            <div className="url-row">
              <dt>Current page</dt>
              <dd title={dialog.position.url}>{displayUrl(dialog.position.url)}</dd>
            </div>
          </dl>
          {dialog.collision ? (
            <p>
              The current page is already saved as “{dialog.collision.name}”.
              That save will be replaced.
            </p>
          ) : null}
          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="button primary"
              onClick={() =>
                void persistCapture(dialog.position, dialog.checkpoint.name, dialog.checkpoint)
              }
            >
              Update to this page
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.type === "delete" ? (
        <Dialog title="Delete this saved checkpoint?" onClose={() => setDialog(null)}>
          <p className="dialog-name">{dialog.checkpoint.name}</p>
          <p>This cannot be undone.</p>
          <div className="dialog-actions">
            <button type="button" className="button ghost" onClick={() => setDialog(null)}>
              Cancel
            </button>
            <button type="button" className="button danger" onClick={() => void handleDelete()}>
              Delete
            </button>
          </div>
        </Dialog>
      ) : null}

      {dialog?.type === "message" ? (
        <Dialog title={dialog.title} onClose={() => setDialog(null)}>
          <p>{dialog.body}</p>
          <div className="dialog-actions">
            <button type="button" className="button primary" onClick={() => setDialog(null)}>
              OK
            </button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
