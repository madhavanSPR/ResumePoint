import { defineManifest } from "@crxjs/vite-plugin";

export default defineManifest({
  manifest_version: 3,
  name: "ResumePoint",
  version: "1.0.0",
  description: "Save where you stopped. Resume exactly there.",
  action: {
    default_title: "ResumePoint",
    default_popup: "src/popup/index.html",
    default_icon: {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png",
    },
  },
  icons: {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png",
  },
  background: {
    service_worker: "src/background/service-worker.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*"],
      js: ["src/content/content-script.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "tabs", "scripting"],
  host_permissions: ["http://*/*", "https://*/*"],
  commands: {
    _execute_action: {
      suggested_key: {
        default: "Alt+Shift+R",
        mac: "Alt+Shift+R",
      },
      description: "Open ResumePoint",
    },
    save_or_update: {
      suggested_key: {
        default: "Alt+Shift+S",
        mac: "Alt+Shift+S",
      },
      description: "Save or update the current page checkpoint",
    },
  },
});
