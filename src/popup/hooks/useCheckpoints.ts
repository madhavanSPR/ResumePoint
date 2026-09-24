import { useCallback, useEffect, useState } from "react";
import type { ResumeCheckpoint } from "../../types/checkpoint";
import { listCheckpoints } from "../../storage/checkpoint-store";
import { STORE_KEY } from "../../storage/schema";

export function useCheckpoints() {
  const [checkpoints, setCheckpoints] = useState<ResumeCheckpoint[]>([]);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    const items = await listCheckpoints();
    setCheckpoints(items);
    setReady(true);
  }, []);

  useEffect(() => {
    void refresh();
    function onChanged(
      changes: { [key: string]: chrome.storage.StorageChange },
      area: string,
    ) {
      if (area === "local" && changes[STORE_KEY]) {
        void refresh();
      }
    }
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, [refresh]);

  return { checkpoints, ready, refresh };
}
