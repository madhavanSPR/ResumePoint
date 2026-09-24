# ResumePoint

**Save where you stopped. Resume exactly there.**

ResumePoint is a free, open-source **Chrome extension** and **Brave extension** that remembers the exact place you stopped on a webpage.

It is a **reading resume tool**, a **scroll position saver**, and a **webpage checkpoint manager**.

It is **not** a bookmark manager.
It is **not** a course tracker.
It does **not** show fake progress like "67% complete".

You click **Save**.
Later you click **Resume**.
The browser opens that page and takes you back to the same heading, paragraph, or scroll place.

Repository: [https://github.com/madhavanSPR/ResumePoint](https://github.com/madhavanSPR/ResumePoint)

---

## What problem does this solve?

People ask AI tools and search engines questions like:

- How do I save my scroll position in Chrome?
- How do I continue reading a webpage where I left off?
- Is there a Chrome extension to remember reading position?
- How do I resume a documentation page after closing the browser?
- How do I save progress on a tutorial without using bookmarks?
- Brave extension to restore scroll position
- Remember where I stopped studying online

Normal bookmarks only save the link. They open the top of the page. You still have to scroll and hunt for the section.

ResumePoint saves:

- the page URL
- a name you choose
- the reading position
- a nearby heading or paragraph (content anchor)
- the last updated time

Then one click restores it.

```text
Open page
    |
    v
Read / study / research
    |
    v
Save current page
    |
    v
Keep reading
    |
    v
Click Update when you stop
    |
    v
Close the tab or the browser
    |
    v
Later: click Resume
    |
    v
Page opens at the same place
```

---

## Who is this for?

Anyone who reads on the web and comes back later:

- students reading Java, Python, SQL, or other lessons
- developers reading docs, Stack Overflow, GitHub, or blogs
- people reading articles, Reddit, research pages, or news
- anyone who closes Chrome or Brave and does not want to scroll again

It works on ordinary websites. It does not assume you are in a course.

Examples of pages you can save:

- Java documentation
- Python tutorials
- SQL lessons
- MDN, Oracle docs, official language docs
- Udemy or other lesson pages in the browser
- blogs and articles
- Reddit and forum threads
- Stack Overflow answers
- ChatGPT chats after the URL becomes a real `/c/...` link
- research papers and news articles

---

## What browsers work?

ResumePoint is a **Manifest V3 Chromium extension**.

| Browser | Works? | How to open the extensions page |
| --- | --- | --- |
| Google Chrome | Yes | `chrome://extensions` |
| Brave Browser | Yes | `brave://extensions` |
| Microsoft Edge | Yes, in most cases | `edge://extensions` |
| Vivaldi | Yes, in most cases | `vivaldi://extensions` |
| Firefox | No | Different extension system |
| Safari | No | Different extension system |

It is not in the Chrome Web Store. You download this GitHub repo, build it, and load the `dist` folder as an **unpacked extension**.

---

## Features

- Save the current webpage as one checkpoint
- Give the save a clear name, such as `Java - Constructor Invocation`
- **Resume** opens the page and restores the place
- **Update** means "I am here now" and replaces the old position
- If the site changes URL, for example ChatGPT moving from `/?temporary-chat=true` to `/c/...`, Update asks before moving the save
- The page you are looking at is marked **Current page** and moves to the top
- Search saved pages by name, title, or URL
- Delete a save only after a confirm step
- Export and import JSON backups
- Works offline after you install it
- Stores data only in this browser
- No account, no cloud, no ads, no analytics
- Light and dark mode follow the system theme
- Keyboard shortcuts

It does **not** restore YouTube video time in v1. It restores page position.

---

## Quick start

You need [Node.js](https://nodejs.org/) and [Git](https://git-scm.com/).

```text
1. Clone this repo
2. Install packages
3. Build the extension
4. Load the dist folder in Chrome or Brave
5. Pin ResumePoint and use Save / Update / Resume
```

```bash
git clone https://github.com/madhavanSPR/ResumePoint.git
cd ResumePoint
npm install
npm run build
```

The build creates a `dist` folder. That folder is the extension.

### Load in Google Chrome

```text
chrome://extensions
        |
        v
Turn on Developer mode (top right)
        |
        v
Click "Load unpacked"
        |
        v
Select the dist folder
        |
        v
Pin ResumePoint from the puzzle-piece icon
```

1. Open Chrome.
2. Go to `chrome://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Choose the `dist` folder inside this project.
6. Click the puzzle-piece icon and pin **ResumePoint**.

### Load in Brave Browser

```text
brave://extensions
        |
        v
Turn on Developer mode
        |
        v
Click "Load unpacked"
        |
        v
Select the same dist folder
```

1. Open Brave.
2. Go to `brave://extensions`.
3. Turn on **Developer mode**.
4. Click **Load unpacked**.
5. Choose the same `dist` folder.

### Load in Edge or Vivaldi

Use `edge://extensions` or `vivaldi://extensions`, turn on Developer mode, then load the same `dist` folder.

After you change code and run `npm run build` again, open the extensions page and click **Reload** on ResumePoint.

---

## How to use it

```text
Save
  |
  v
Study
  |
  v
Update when you stop
  |
  v
Later, Resume
```

### Save a page

1. Open the webpage you are reading.
2. Scroll to the place you want to remember.
3. Click the ResumePoint icon.
4. Click **Save current page**.
5. Keep the title or type a shorter name.
6. Click **Save**.

If that page is already saved, ResumePoint will not make a second copy. It asks if you want to **Update position**.

You cannot save browser pages such as `chrome://`, `brave://`, or the Chrome Web Store.

### Come back later

1. Click the ResumePoint icon. You do not need to open the website first.
2. Click **Resume** on that saved page.
3. Chrome or Brave opens the link, or focuses the tab if it is already open.
4. ResumePoint waits for the page to load, then scrolls to the saved place.

### Update the saved place

If you kept reading after the last save:

1. Stay on that page.
2. Open ResumePoint.
3. Click **Update**.

That means: "I am here now. Make this the new resume point."

ResumePoint does **not** auto-update just because you visited the page.

If the tab URL changed, you will see:

```text
Saved page:    chatgpt.com/?temporary-chat=true
Current page:  chatgpt.com/c/6ab38ce5-...

[ Cancel ]   [ Update to this page ]
```

### Find, rename, or delete

- Use the search box to filter by name, title, or URL.
- Open the `...` menu on a card to **Rename** or **Delete**.
- Delete asks for confirmation.

### Backup

Open the gear icon.

- **Export data** downloads a JSON file.
- **Import data** loads a JSON backup.

Chrome and Brave do not share saved pages. Export from one and import into the other if you want a copy.

---

## Keyboard shortcuts

| Shortcut | What it does |
| --- | --- |
| `Alt+Shift+R` | Open ResumePoint |
| `Alt+Shift+S` | Save this page, or update it if it is already saved |

Change them here:

- Chrome: `chrome://extensions/shortcuts`
- Brave: `brave://extensions/shortcuts`

ResumePoint does not use `Ctrl+S` or `Ctrl+Shift+R`.

---

## How restore works

Bookmarks only store a URL. ResumePoint also stores a **content anchor** so the page can change a little and still land near the same text.

```text
Click Resume
    |
    v
Open or focus the saved URL
    |
    v
Wait for the page (including late-loading sites)
    |
    v
1. Find the saved heading or paragraph
    |
    +-- found --> scroll to that text
    |
    +-- missing --> scroll to the saved pixel position
                    then look again
    |
    v
Retry a few times, then stop
```

This helps on React, Vue, Next.js, and other pages that draw content after load.

---

## Privacy

ResumePoint runs on your computer.

- Saved pages stay in `chrome.storage.local`
- No login
- No server
- No ads
- No analytics
- No browsing history upload

Your saved URLs never leave the browser unless you export the JSON file yourself.

---

## Permissions, in plain words

| Permission | Why it is needed |
| --- | --- |
| `storage` | Remember your saved pages |
| `tabs` | See the current tab and jump back to a saved tab |
| `scripting` | Read and restore the place on the page |
| Access to `http` and `https` pages | Resume has to open a saved website and scroll it |

It does not run on `chrome://`, `brave://`, `edge://`, extension pages, or the Chrome Web Store.

---

## Project commands

```bash
npm install      # first time
npm run build    # make the dist folder you load in the browser
npm test         # run unit tests
npm run dev      # live reload while you edit
```

Stop `npm run dev` before `npm run build`.

Need help:

- Node.js 18 or newer
- npm
- Git

---

## Folder map

```text
ResumePoint/
├── src/
│   ├── background/     opens pages and runs Resume
│   ├── content/        reads and restores the place on the page
│   ├── popup/          the small window you click
│   ├── storage/        local save and backup
│   └── utils/          URL matching, search, time
├── public/icons/       extension icons
├── dist/               built extension (created after npm run build)
└── README.md
```

---

## Common problems

**"ResumePoint can't access this page"**  
You are on a browser settings page or the extension store. Open a normal website that starts with `http` or `https`.

**Resume opens the page but stays at the top**  
The site may have changed. Click **Update** at the new place. Dynamic pages get a few restore tries.

**"Unable to open this page"**  
The link may be gone or the site is down.

**Chrome and Brave show different saved pages**  
Each browser has its own storage. Use Export and Import.

**I changed the code and nothing changed**  
Run `npm run build`, then click **Reload** on the extension card.

---

## Search words

Chrome extension to save scroll position, Brave extension to restore reading position, continue reading webpage later, remember where I left off online, webpage checkpoint, reading resume manager, save study progress on a website, restore scroll after closing Chrome, Manifest V3 TypeScript React Vite extension, local unpacked Chromium extension, no cloud bookmark alternative with page position.

---

## License

[MIT](LICENSE)

Issues and pull requests are welcome. Keep the main job simple: save, update, resume.
