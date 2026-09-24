# ResumePoint

**Save where you stopped. Resume exactly there.**

ResumePoint is a local Chromium extension for Chrome and Brave. It is a resume-position manager, not a bookmark manager. One click opens a saved page and returns you to the heading or paragraph where you stopped.

It works on ordinary websites: documentation, tutorials, blogs, forums, articles, course pages, and similar reading surfaces. It does not include course-specific logic or fake completion percentages.

## Why it exists

Closing a browser or switching tabs should not mean hunting for the same lesson and scrolling back to the same sentence. ResumePoint stores a checkpoint: the URL, a name, the reading position, and a content anchor. Later, **Resume** opens that page and restores the location.

```text
Save → study → Update when you stop → later, Resume
```

## Features

- Save the current page as one checkpoint
- Custom name on save; rename later
- Update replaces the saved position only when you ask
- Resume opens or focuses the page and restores the location
- Current page is pinned and labeled at the top of the popup
- Search by name, title, or URL
- Delete with confirmation
- JSON export and import
- Dark mode follows `prefers-color-scheme`
- Works entirely offline after install

Video playback timestamps are reserved in the data model but not used in v1.

## Install locally

ResumePoint is not published to a store. Clone the repo, build it, and load the folder as an unpacked extension.

```bash
git clone https://github.com/USERNAME/ResumePoint.git
cd ResumePoint
npm install
npm run build
```

This type-checks the project and writes a Manifest V3 bundle to `dist/`.

### Chrome

1. Open `chrome://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Choose the `dist` folder in this project

### Brave

1. Open `brave://extensions`
2. Turn on **Developer mode**
3. Click **Load unpacked**
4. Choose the same `dist` folder

Edge and Vivaldi can load the same folder the same way (`edge://extensions`, `vivaldi://extensions`).

After you rebuild, click **Reload** on the extension card.

## Daily use

1. Open a page and read to where you want to stop.
2. Click the ResumePoint icon, then **Save current page**.
3. Optionally edit the name.
4. Before you leave, open the popup again and click **Update**.
5. Later, click **Resume**. The page opens and scrolls back.

If the current tab is already saved, that card is marked **Current page** and sits at the top.

If you click **Update** while the tab has moved to a different URL — for example ChatGPT going from `/?temporary-chat=true` to `/c/...` — ResumePoint shows the saved link and the current link, then lets you move the checkpoint to this page. Same-page updates still happen immediately.

Saving the same page again does not create a duplicate. ResumePoint asks whether to update the stored position.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Alt+Shift+R` | Open the popup |
| `Alt+Shift+S` | Save a new checkpoint, or update the existing one for this page |

These are suggested keys. Change them in `chrome://extensions/shortcuts` or `brave://extensions/shortcuts`. ResumePoint does not bind `Ctrl+Shift+R` or `Ctrl+S`.

## Development

```bash
npm install
npm run dev
```

`npm run dev` starts the CRXJS Vite server with extension hot reload. Load `dist/` unpacked, then keep the dev server running while you edit.

```bash
npm test
npm run build
```

`npm run build` must be run with the dev server stopped so the production bundle is written cleanly to `dist/`.

## Architecture

```text
src/
├── background/service-worker.ts   Resume, shortcuts, pending restore
├── content/                       Capture anchors and restore position
├── popup/                         React popup UI
├── storage/                       chrome.storage.local repository
├── extension/                     Tab injection and resume helpers
├── utils/                         URL matching, search, ordering
└── types/                         Checkpoint and message types
```

Save and update talk to the content script in the active tab, then write `chrome.storage.local`. Resume is handled by the service worker so it still works after the popup closes: it focuses a matching tab or opens the URL, stores a pending restore in `chrome.storage.session`, and the content script restores the anchor or scroll position with bounded retries.

Restoration order:

1. Find the stored heading or paragraph
2. If it is missing, scroll to the saved `scrollY` to wake lazy content, then search again
3. Align the found element using the stored viewport offset
4. Fall back to `scrollX` / `scrollY`
5. Retry on a short schedule plus a debounced `MutationObserver`, then stop

## Permissions

| Permission | Why |
| --- | --- |
| `storage` | Save checkpoints locally |
| `tabs` | Read the active tab, detect the current page, and focus an existing tab on Resume |
| `scripting` | Inject the content script if a page was already open when the extension loaded |
| `http://*/*` and `https://*/*` | Capture and restore position on the pages you save |

Host access is required for Resume. `activeTab` is revoked when a tab navigates, and Resume must restore a page after opening it. Content scripts are not registered for `chrome://`, `brave://`, `edge://`, `vivaldi://`, extension pages, or the Chrome Web Store.

## Privacy

- Checkpoints stay in `chrome.storage.local` on this browser
- No accounts, backend, analytics, or advertising
- No browsing history collection
- Export is a local JSON file you choose to download

## Limitations

- Restricted browser pages cannot be saved
- Pages that never expose a stable heading or paragraph may only restore a pixel scroll
- Infinite-scroll feeds can shift after ads or new items load
- Video timestamps are not restored in v1
- Chrome and Brave do not share `chrome.storage.local`. Use export/import to copy checkpoints

## Troubleshooting

**The popup says it cannot access this page.** You are on a browser UI page or the extension store. Open an `http` or `https` page.

**Resume opens the page but stays at the top.** The site may have replaced the original content. Click **Update** on the new location. Dynamic sites get several restore attempts; if they all miss, ResumePoint shows a short on-page notice.

**Unable to open this page.** The URL may have moved or the site may be down.

**A shortcut does nothing.** Another extension or the OS may own that combination. Reassign it in the browser shortcut settings.

## Manual test checklist

These flows need a real Chrome or Brave window. Automated tests cover URL matching, ordering, search, storage validation, anchor lookup, and bounded restore retries.

1. Save a page, close the tab, click Resume. The page opens at the saved position.
2. Save a Java page, switch to a saved Python page, open the popup. Python is at the top and marked current.
3. Switch to a saved SQL page. SQL becomes the current item.
4. Save, scroll further, click Update, close, Resume. The new position is restored.
5. Save three pages, quit the browser, reopen. Checkpoints remain.
6. Search. Matching names, titles, and URLs appear.
7. Delete a checkpoint. It disappears and cannot be resumed.
8. Resume on a page that renders late. Restoration waits and then lands.
9. Resume after a small content edit. The original heading or paragraph is preferred over raw `scrollY`.
10. Open `chrome://extensions` or `brave://settings` and try Save. You get a clear error, not a crash.

## Contributing

Issues and pull requests are welcome. Keep v1 focused on reliable save, update, and resume.

## Support

If ResumePoint is useful, you can [buy Madhav a coffee](https://buymeacoffee.com/problem_solver).

## License

[MIT](LICENSE)
