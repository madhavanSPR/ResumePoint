import type { ResumeCheckpoint } from "../types/checkpoint";

export function filterCheckpoints(
  checkpoints: ResumeCheckpoint[],
  query: string,
): ResumeCheckpoint[] {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return checkpoints;
  }

  return checkpoints.filter((checkpoint) => {
    return (
      checkpoint.name.toLowerCase().includes(needle) ||
      checkpoint.title.toLowerCase().includes(needle) ||
      checkpoint.url.toLowerCase().includes(needle)
    );
  });
}
