export const POSITION_MOVE_THRESHOLD = 48;

export interface PositionSnapshot {
  scrollX: number;
  scrollY: number;
  anchorValue?: string;
}

export function positionMoved(
  previous: PositionSnapshot,
  next: PositionSnapshot,
  threshold = POSITION_MOVE_THRESHOLD,
): boolean {
  if (Math.abs(next.scrollY - previous.scrollY) >= threshold) {
    return true;
  }
  if (Math.abs(next.scrollX - previous.scrollX) >= threshold) {
    return true;
  }
  if (previous.anchorValue && next.anchorValue && previous.anchorValue !== next.anchorValue) {
    return true;
  }
  return false;
}
