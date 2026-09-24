import { useCallback, useEffect, useState } from "react";

export interface ActiveTab {
  id?: number;
  url?: string;
  title?: string;
}

export function useActiveTab() {
  const [tab, setTab] = useState<ActiveTab>({});

  const refresh = useCallback(async () => {
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    setTab({
      id: active?.id,
      url: active?.url,
      title: active?.title,
    });
  }, []);

  useEffect(() => {
    void refresh();

    function onActivated() {
      void refresh();
    }

    function onUpdated(_tabId: number, changeInfo: chrome.tabs.TabChangeInfo) {
      if (changeInfo.url || changeInfo.status === "complete") {
        void refresh();
      }
    }

    chrome.tabs.onActivated.addListener(onActivated);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.windows.onFocusChanged.addListener(onActivated);
    return () => {
      chrome.tabs.onActivated.removeListener(onActivated);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.windows.onFocusChanged.removeListener(onActivated);
    };
  }, [refresh]);

  return tab;
}
