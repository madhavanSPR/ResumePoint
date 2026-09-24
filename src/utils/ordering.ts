import type { ResumeCheckpoint } from "../types/checkpoint";

export function orderCheckpoints(
  checkpoints: ResumeCheckpoint[],
  currentNormalizedUrl?: string,
): ResumeCheckpoint[] {
  const current: ResumeCheckpoint[] = [];
  const others: ResumeCheckpoint[] = [];

  for (const checkpoint of checkpoints) {
    if (currentNormalizedUrl && checkpoint.normalizedUrl === currentNormalizedUrl) {
      current.push(checkpoint);
    } else {
      others.push(checkpoint);
    }
  }

  others.sort((a, b) => b.updatedAt - a.updatedAt);
  return [...current, ...others];
}
